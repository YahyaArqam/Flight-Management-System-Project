from fastapi import APIRouter, HTTPException, Depends
from schemas.flight import FlightCreate, FlightUpdate
from database import supabase

router = APIRouter(prefix="/admin/flights", tags=["Admin Flights"])

@router.post("/", status_code=201)
def create_flight(flight: FlightCreate):
    # FastAPI schema validation already verified seat amounts sum to capacity
    try:
        flight_data = {
            "flight_number": flight.flight_number,
            "origin": flight.origin,
            "destination": flight.destination,
            "departure_time": flight.departure_time.isoformat(),
            "arrival_time": flight.arrival_time.isoformat(),
            "total_capacity": flight.total_capacity
        }
        f_res = supabase.table("flights").insert(flight_data).execute()
        new_flight = f_res.data[0]
        flight_id = new_flight["id"]

        # 2. Insert Seat Classes
        # KNOWN GAP: no transaction/rollback here. If this insert fails, the flight
        # row above is already committed and orphaned with no seat classes.
        # Not fixed yet — would need a Postgres RPC function to be truly atomic.
        seat_classes_data = [
            {
                "flight_id": flight_id,
                "fare_type": sc.fare_type,
                "total_seats": sc.total_seats,
                "overbook_buffer": sc.overbook_buffer
            } for sc in flight.seat_classes
        ]
        supabase.table("flight_seat_classes").insert(seat_classes_data).execute()

        # 3. Log Audit
        supabase.table("audit_logs").insert({
            "entity_name": "flights",
            "entity_id": flight_id,
            "action": "CREATE",
            "new_data": new_flight,
            "changed_by": "admin_user"  # Hardcoded for now — no auth system yet
        }).execute()

        return {"message": "Flight created successfully", "flight": new_flight}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{flight_id}")
def cancel_flight(flight_id: str):
    # This edits the status rather than hard delete, to trigger downstream workflows
    try:
        old_flight_res = supabase.table("flights").select("*").eq("id", flight_id).execute()
        if not old_flight_res.data:
            raise HTTPException(status_code=404, detail="Flight not found")

        update_res = supabase.table("flights").update({"status": "CANCELLED"}).eq("id", flight_id).execute()

        # Log Audit
        supabase.table("audit_logs").insert({
            "entity_name": "flights",
            "entity_id": flight_id,
            "action": "CANCEL_FLIGHT",
            "old_data": old_flight_res.data[0],
            "new_data": update_res.data[0],
            "changed_by": "admin_user"
        }).execute()

        return {"message": "Flight cancelled", "flight": update_res.data[0]}
    except HTTPException:
        # FIX: without this, the 404 above was being caught by the except Exception
        # below and re-raised as a 400 with detail "404: Flight not found".
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{flight_id}")
def edit_flight(flight_id: str, flight_update: FlightUpdate):
    # This edits the flight times & triggers cascading affect via Postgres status update if needed
    try:
        old_flight_res = supabase.table("flights").select("*").eq("id", flight_id).execute()
        if not old_flight_res.data:
            raise HTTPException(status_code=404, detail="Flight not found")

        update_data = {k: v for k, v in flight_update.model_dump(exclude_unset=True).items() if v is not None}
        if "departure_time" in update_data:
            update_data["departure_time"] = update_data["departure_time"].isoformat()
        if "arrival_time" in update_data:
            update_data["arrival_time"] = update_data["arrival_time"].isoformat()

        if not update_data:
            return {"message": "No fields to update"}

        update_res = supabase.table("flights").update(update_data).eq("id", flight_id).execute()

        # Log Audit
        supabase.table("audit_logs").insert({
            "entity_name": "flights",
            "entity_id": flight_id,
            "action": "EDIT_FLIGHT",
            "old_data": old_flight_res.data[0],
            "new_data": update_res.data[0],
            "changed_by": "admin_user"
        }).execute()

        return {"message": "Flight updated", "flight": update_res.data[0]}
    except HTTPException:
        # FIX: same bug as cancel_flight above.
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))