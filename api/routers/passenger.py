from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from datetime import datetime
from database import supabase

router = APIRouter(prefix="/passenger", tags=["Passenger Flow"])


class HoldSeatRequest(BaseModel):
    flight_id: str
    passenger_id: str
    fare_type: str


class BookSeatRequest(BaseModel):
    hold_id: str
    payment_intent_id: str
    # NOTE: payment_intent_id is accepted but NOT persisted — the `bookings`
    # table has no payment_intent_id column (confirmed via information_schema
    # query this session). No payment tracking exists yet. Known gap.


class CancelRequest(BaseModel):
    booking_id: str


def _unwrap_rpc(data):
    """
    Supabase RPC calls to a function returning a single row (not SETOF)
    should return a dict directly, but PostgREST has been known to wrap
    single-row results in a list depending on version/config. Normalize
    both shapes here so route code doesn't have to care.
    """
    if isinstance(data, list):
        return data[0] if data else None
    return data


def _log_audit(entity_id: str, action: str, new_data: dict, old_data: dict = None):
    """
    Best-effort audit log write. Wrapped in its own try/except deliberately:
    the booking state change itself already succeeded via the RPC by the
    time this runs, so a failure here should NOT be reported to the caller
    as a failed booking/cancel/confirm. It's logged server-side only.
    """
    try:
        supabase.table("audit_logs").insert({
            "entity_name": "bookings",
            "entity_id": entity_id,
            "action": action,
            "old_data": old_data or {},
            "new_data": new_data,
            "changed_by": "passenger_api"
        }).execute()
    except Exception as audit_err:
        print(f"[audit_log warning] failed to log {action} for {entity_id}: {audit_err}")


@router.get("/search")
def search_flights(origin: str, destination: str, date: str):
    try:
        start_date = f"{date}T00:00:00Z"
        end_date = f"{date}T23:59:59Z"

        flights_res = supabase.table("flights") \
            .select("*, flight_seat_classes(*)") \
            .eq("origin", origin) \
            .eq("destination", destination) \
            .eq("status", "SCHEDULED") \
            .gte("departure_time", start_date) \
            .lte("departure_time", end_date) \
            .execute()

        return {"flights": flights_res.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/hold")
def hold_seat(req: HoldSeatRequest, idempotency_key: str = Header(...)):
    # Atomic hold via Postgres RPC: locks the seat class row, enforces the
    # overbook_buffer policy, and inserts the HOLD booking — all inside one
    # transaction. Replaces the old version which inserted a HOLD row with
    # no capacity check at all.
    try:
        result = supabase.rpc("hold_seat_atomic", {
            "p_flight_id": req.flight_id,
            "p_passenger_id": req.passenger_id,
            "p_fare_type": req.fare_type,
            "p_idempotency_key": idempotency_key,
            "p_hold_minutes": 15
        }).execute()

        booking = _unwrap_rpc(result.data)
        if not booking:
            raise HTTPException(status_code=400, detail="Hold failed: no booking returned")

        _log_audit(booking["id"], "HOLD_CREATED", booking)

        return {"message": "Seat held successfully for 15 minutes", "booking": booking}

    except HTTPException:
        raise
    except Exception as e:
        msg = str(e)
        if "SEAT_UNAVAILABLE" in msg:
            raise HTTPException(status_code=409, detail="This seat class is fully booked. Oversell prevented.")
        if "SEAT_CLASS_NOT_FOUND" in msg:
            raise HTTPException(status_code=404, detail="No such fare class on this flight.")
        raise HTTPException(status_code=400, detail=msg)


@router.post("/checkout")
def confirm_booking(req: BookSeatRequest, idempotency_key: str = Header(...)):
    # Atomic confirm via Postgres RPC: locks the booking + seat class rows,
    # rejects if the hold already expired or isn't in HOLD status, and moves
    # the seat from held_seats to booked_seats as part of the same transaction
    # that flips the booking to CONFIRMED.
    try:
        result = supabase.rpc("confirm_booking_atomic", {
            "p_hold_id": req.hold_id,
            "p_idempotency_key": idempotency_key
        }).execute()

        booking = _unwrap_rpc(result.data)
        if not booking:
            raise HTTPException(status_code=400, detail="Confirm failed: no booking returned")

        _log_audit(booking["id"], "BOOKING_CONFIRMED", booking)

        return {"message": "Booking Confirmed", "booking": booking}

    except HTTPException:
        raise
    except Exception as e:
        msg = str(e)
        if "BOOKING_NOT_FOUND" in msg:
            raise HTTPException(status_code=404, detail="Hold not found")
        if "BOOKING_NOT_IN_HOLD" in msg:
            raise HTTPException(status_code=409, detail="Booking is not currently on hold (already confirmed or cancelled).")
        if "HOLD_EXPIRED" in msg:
            raise HTTPException(status_code=410, detail="This hold has expired. Please search and hold again.")
        raise HTTPException(status_code=400, detail=msg)


@router.post("/waitlist")
def join_waitlist(req: HoldSeatRequest):
    # KNOWN GAP: the `waitlists` table has no idempotency_key column, so
    # unlike /hold and /checkout, a retried request here can create a
    # duplicate waitlist entry. Not fixed — would require a schema change
    # (ALTER TABLE waitlists ADD COLUMN idempotency_key) which is out of
    # scope for this pass. Documented here instead of silently ignored.
    try:
        waitlist_data = {
            "flight_id": req.flight_id,
            "passenger_id": req.passenger_id,
            "fare_type": req.fare_type,
            "status": "WAITING"
        }
        res = supabase.table("waitlists").insert(waitlist_data).execute()
        return {"message": "Added to Waitlist", "waitlist": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/cancel")
def cancel_booking(req: CancelRequest):
    # Atomic cancel via Postgres RPC: releases the correct seat counter
    # (held_seats if it was a HOLD, booked_seats if CONFIRMED) and applies
    # the fare-type refund policy in the same transaction. Naturally
    # idempotent — cancelling an already-CANCELLED booking is a safe no-op.
    try:
        result = supabase.rpc("cancel_booking_atomic", {
            "p_booking_id": req.booking_id
        }).execute()

        booking = _unwrap_rpc(result.data)
        if not booking:
            raise HTTPException(status_code=400, detail="Cancel failed: no booking returned")

        _log_audit(booking["id"], "BOOKING_CANCELLED", booking)

        # Rebuild a human-readable message from the RPC's result, matching
        # the UX of the original Python-only version.
        fare_type = booking.get("fare_type")
        refund_status = booking.get("refund_status")
        if refund_status == "NONE":
            message = "Basic Economy is non-refundable."
        elif refund_status == "PENDING":
            message = f"{fare_type} refund initiated." if fare_type != "BASIC_ECONOMY" \
                else "Flight was cancelled by airline. Full refund initiated."
        else:
            message = "Booking cancelled."

        return {"message": message, "booking": booking}

    except HTTPException:
        raise
    except Exception as e:
        msg = str(e)
        if "BOOKING_NOT_FOUND" in msg:
            raise HTTPException(status_code=404, detail="Booking not found")
        raise HTTPException(status_code=400, detail=msg)