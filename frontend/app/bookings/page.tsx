'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../../lib/supabase'
import { BookOpen, Plus, Trash2, X, Check, AlertCircle } from 'lucide-react'

type Flight = {
    id: string
    flight_number: string
    origin: string
    destination: string
    departure_time: string
}

type Passenger = {
    id: string
    first_name: string
    last_name: string
    email: string
}

type Booking = {
    id: string
    flight_id: string
    passenger_id: string
    fare_type: string
    status: string
    price_paid: number
    flights?: { flight_number: string; origin: string; destination: string } | null
    passengers?: { first_name: string; last_name: string; email: string } | null
}

type BookingForm = {
    flight_id: string
    passenger_id: string
    fare_type: string
    price_paid: string
}

const emptyForm: BookingForm = {
    flight_id: '',
    passenger_id: '',
    fare_type: 'BASIC_ECONOMY',
    price_paid: '',
}

const fareTypes = ['BASIC_ECONOMY', 'FLEXIBLE', 'BUSINESS', 'FIRST']

const statusConfig: Record<string, { bg: string; color: string; dot: string }> = {
    CONFIRMED: { bg: 'rgba(16,185,129,0.12)', color: '#6EE7B7', dot: '#10B981' },
    HOLD: { bg: 'rgba(245,158,11,0.12)', color: '#FCD34D', dot: '#F59E0B' },
    CANCELLED: { bg: 'rgba(239,68,68,0.12)', color: '#FCA5A5', dot: '#EF4444' },
}

const fareConfig: Record<string, { color: string; bg: string }> = {
    BASIC_ECONOMY: { color: '#93C5FD', bg: 'rgba(59,130,246,0.12)' },
    FLEXIBLE: { color: '#6EE7B7', bg: 'rgba(16,185,129,0.12)' },
    BUSINESS: { color: '#FCD34D', bg: 'rgba(252,211,77,0.12)' },
    FIRST: { color: '#C4B5FD', bg: 'rgba(139,92,246,0.12)' },
}

const inputStyle: CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
}

const labelStyle: CSSProperties = {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: '6px',
    display: 'block'
}

const overlayStyle: CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
    zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
}

const errorBoxStyle: CSSProperties = {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: '12px', padding: '12px 14px',
    color: '#FCA5A5', fontSize: '13px', lineHeight: 1.4
}

const cancelBtnStyle: CSSProperties = {
    flex: 1, padding: '12px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px', color: 'rgba(255,255,255,0.6)',
    fontSize: '14px', fontWeight: 600, cursor: 'pointer'
}

const cols = '1.5fr 1.5fr 1fr 0.8fr 1fr 80px'

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [flights, setFlights] = useState<Flight[]>([])
    const [passengers, setPassengers] = useState<Passenger[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState<BookingForm>(emptyForm)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => { fetchAll() }, [])

    async function fetchAll() {
        const [bookingsRes, flightsRes, passengersRes] = await Promise.all([
            supabase.from('bookings').select('*, flights(flight_number, origin, destination), passengers(first_name, last_name, email)').order('created_at', { ascending: false }),
            supabase.from('flights').select('*').order('departure_time', { ascending: true }),
            supabase.from('passengers').select('*').order('first_name', { ascending: true })
        ])

        const firstError = bookingsRes.error || flightsRes.error || passengersRes.error
        if (firstError) {
            setLoadError(firstError.message)
        } else {
            setLoadError(null)
        }

        setBookings((bookingsRes.data || []) as Booking[])
        setFlights((flightsRes.data || []) as Flight[])
        setPassengers((passengersRes.data || []) as Passenger[])
        setLoading(false)
    }

    async function saveBooking() {
        if (!form.flight_id || !form.passenger_id || !form.price_paid) {
            setFormError('Passenger, flight and price are all required.')
            return
        }
        setSaving(true)
        setFormError(null)
        const { error } = await supabase.from('bookings').insert({
            flight_id: form.flight_id,
            passenger_id: form.passenger_id,
            fare_type: form.fare_type,
            status: 'CONFIRMED',
            refund_status: 'NONE',
            price_paid: parseFloat(form.price_paid)
        })
        setSaving(false)
        if (error) {
            setFormError(error.message)
            return
        }
        setShowModal(false)
        fetchAll()
    }

    async function deleteBooking() {
        if (!deleteId) return
        setDeleting(true)
        setDeleteError(null)
        const { error } = await supabase.from('bookings').delete().eq('id', deleteId)
        setDeleting(false)
        if (error) {
            setDeleteError(error.message)
            return
        }
        setDeleteId(null)
        fetchAll()
    }

    return (
        <div style={{ padding: '40px 48px', minHeight: '100vh', position: 'relative' }}>

            {/* Background */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                pointerEvents: 'none', zIndex: 0, overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
                    backgroundSize: '64px 64px'
                }} />
                <div style={{
                    position: 'absolute', top: '-10%', right: '-5%',
                    width: '500px', height: '500px',
                    background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 65%)',
                    borderRadius: '50%'
                }} />
            </div>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>

                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '32px'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <div style={{
                                width: '7px', height: '7px', borderRadius: '50%',
                                background: '#06B6D4', boxShadow: '0 0 10px #06B6D4'
                            }} />
                            <span style={{
                                color: '#06B6D4', fontSize: '11px', fontWeight: 700,
                                letterSpacing: '2.5px', textTransform: 'uppercase'
                            }}>Booking Management</span>
                        </div>
                        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'white', letterSpacing: '-0.5px' }}>
                            Bookings
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', marginTop: '4px' }}>
                            {bookings.length} bookings in system
                        </p>
                    </div>

                    <button
                        onClick={() => { setForm(emptyForm); setFormError(null); setShowModal(true) }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'linear-gradient(135deg, #0E7490, #06B6D4)',
                            border: 'none', borderRadius: '12px',
                            padding: '12px 20px', color: 'white',
                            fontSize: '14px', fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(6,182,212,0.4)'
                        }}
                    >
                        <Plus size={16} />
                        New Booking
                    </button>
                </div>

                {/* Load error banner */}
                {loadError && (
                    <div style={{ ...errorBoxStyle, marginBottom: '20px' }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                        <span>Could not load bookings: {loadError}</span>
                    </div>
                )}

                {/* Table */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px', overflow: 'hidden'
                }}>
                    {/* Column headers */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: cols,
                        padding: '14px 28px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.03)'
                    }}>
                        {['Passenger', 'Flight', 'Fare', 'Price', 'Status', 'Del'].map(h => (
                            <p key={h} style={{
                                color: 'rgba(255,255,255,0.25)', fontSize: '11px',
                                fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase'
                            }}>{h}</p>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <p style={{ color: 'rgba(255,255,255,0.3)' }}>Loading...</p>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <BookOpen size={28} color="rgba(255,255,255,0.1)"
                                style={{ margin: '0 auto 12px', display: 'block' }} />
                            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
                                {loadError ? 'Unable to load bookings' : 'No bookings found'}
                            </p>
                        </div>
                    ) : (
                        bookings.map((b, i) => {
                            const sc = statusConfig[b.status] || statusConfig.CONFIRMED
                            const fc = fareConfig[b.fare_type] || fareConfig.BASIC_ECONOMY
                            return (
                                <div
                                    key={b.id}
                                    style={{
                                        display: 'grid', gridTemplateColumns: cols,
                                        padding: '16px 28px',
                                        borderBottom: i < bookings.length - 1
                                            ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                        transition: 'background 0.15s', alignItems: 'center'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                                >
                                    {/* Passenger */}
                                    <div>
                                        <p style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>
                                            {b.passengers?.first_name} {b.passengers?.last_name}
                                        </p>
                                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                                            {b.passengers?.email}
                                        </p>
                                    </div>

                                    {/* Flight */}
                                    <div>
                                        <p style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>
                                            {b.flights?.flight_number}
                                        </p>
                                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                                            {b.flights?.origin} → {b.flights?.destination}
                                        </p>
                                    </div>

                                    {/* Fare */}
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{
                                            background: fc.bg,
                                            color: fc.color,
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            whiteSpace: 'nowrap',
                                            display: 'inline-block'
                                        }}>
                                            {b.fare_type?.replace(/_/g, ' ')}
                                        </span>
                                    </div>

                                    {/* Price */}
                                    <span style={{ color: '#10B981', fontWeight: 600, fontSize: '14px' }}>
                                        ${Number(b.price_paid ?? 0).toFixed(2)}
                                    </span>

                                    {/* Status */}
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{
                                            background: sc.bg,
                                            color: sc.color,
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            <span style={{
                                                width: '5px', height: '5px',
                                                background: sc.dot, borderRadius: '50%',
                                                flexShrink: 0,
                                                boxShadow: `0 0 6px ${sc.dot}`
                                            }} />
                                            {b.status}
                                        </span>
                                    </div>

                                    {/* Delete */}
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <button
                                            onClick={() => { setDeleteError(null); setDeleteId(b.id) }}
                                            style={{
                                                width: '32px', height: '32px',
                                                background: 'rgba(239,68,68,0.1)',
                                                border: '1px solid rgba(239,68,68,0.2)',
                                                borderRadius: '8px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            <Trash2 size={12} color="#EF4444" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div style={overlayStyle}>
                    <div style={{
                        background: 'linear-gradient(135deg, #0D1B4B, #0A2463)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '24px', padding: '32px', width: '480px'
                    }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: '28px'
                        }}>
                            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700 }}>
                                New Booking
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.08)', border: 'none',
                                    borderRadius: '8px', width: '32px', height: '32px',
                                    cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <X size={16} color="white" />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>Passenger</label>
                                <select
                                    value={form.passenger_id}
                                    onChange={e => setForm({ ...form, passenger_id: e.target.value })}
                                    style={inputStyle}
                                >
                                    <option value="" style={{ background: '#0D1B4B' }}>Select passenger...</option>
                                    {passengers.map(p => (
                                        <option key={p.id} value={p.id} style={{ background: '#0D1B4B' }}>
                                            {p.first_name} {p.last_name} — {p.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={labelStyle}>Flight</label>
                                <select
                                    value={form.flight_id}
                                    onChange={e => setForm({ ...form, flight_id: e.target.value })}
                                    style={inputStyle}
                                >
                                    <option value="" style={{ background: '#0D1B4B' }}>Select flight...</option>
                                    {flights.map(f => (
                                        <option key={f.id} value={f.id} style={{ background: '#0D1B4B' }}>
                                            {f.flight_number} — {f.origin} → {f.destination}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={labelStyle}>Fare Type</label>
                                <select
                                    value={form.fare_type}
                                    onChange={e => setForm({ ...form, fare_type: e.target.value })}
                                    style={inputStyle}
                                >
                                    {fareTypes.map(f => (
                                        <option key={f} value={f} style={{ background: '#0D1B4B' }}>{f}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={labelStyle}>Price Paid</label>
                                <input
                                    type="number" placeholder="199.99"
                                    value={form.price_paid}
                                    onChange={e => setForm({ ...form, price_paid: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        {formError && (
                            <div style={{ ...errorBoxStyle, marginTop: '20px' }}>
                                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                                <span>{formError}</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                            <button onClick={() => setShowModal(false)} style={cancelBtnStyle}>
                                Cancel
                            </button>
                            <button
                                onClick={saveBooking}
                                disabled={saving}
                                style={{
                                    flex: 2, padding: '12px',
                                    background: 'linear-gradient(135deg, #0E7490, #06B6D4)',
                                    border: 'none', borderRadius: '12px',
                                    color: 'white', fontSize: '14px',
                                    fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: '8px'
                                }}
                            >
                                <Check size={16} />
                                {saving ? 'Creating...' : 'Create Booking'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteId && (
                <div style={overlayStyle}>
                    <div style={{
                        background: 'linear-gradient(135deg, #0D1B4B, #0A2463)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '24px', padding: '32px', width: '420px'
                    }}>
                        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
                            Delete Booking?
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '20px' }}>
                            This action cannot be undone.
                        </p>

                        {deleteError && (
                            <div style={{ ...errorBoxStyle, marginBottom: '20px' }}>
                                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                                <span>{deleteError}</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setDeleteId(null)} style={cancelBtnStyle}>
                                Cancel
                            </button>
                            <button
                                onClick={deleteBooking}
                                disabled={deleting}
                                style={{
                                    flex: 1, padding: '12px',
                                    background: 'linear-gradient(135deg, #991B1B, #EF4444)',
                                    border: 'none', borderRadius: '12px',
                                    color: 'white', fontSize: '14px',
                                    fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}