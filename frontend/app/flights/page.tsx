'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Plane, Plus, Pencil, Trash2, X, Check } from 'lucide-react'

const emptyForm = {
    flight_number: '',
    origin: '',
    destination: '',
    departure_time: '',
    arrival_time: '',
    total_capacity: '',
    status: 'SCHEDULED'
}

type FlightForm = typeof emptyForm

type FieldDef = {
    key: keyof FlightForm
    label: string
    placeholder?: string
    type?: string
}

export default function FlightsPage() {
    const [flights, setFlights] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editFlight, setEditFlight] = useState<any>(null)
    const [form, setForm] = useState<FlightForm>(emptyForm)
    const [saving, setSaving] = useState(false)
    const [deleteId, setDeleteId] = useState<any>(null)

    useEffect(() => { fetchFlights() }, [])

    async function fetchFlights() {
        const { data } = await supabase
            .from('flights')
            .select('*')
            .order('departure_time', { ascending: true })
        setFlights(data || [])
        setLoading(false)
    }

    function openCreate() {
        setForm(emptyForm)
        setEditFlight(null)
        setShowModal(true)
    }

    function openEdit(flight: any) {
        setForm({
            flight_number: flight.flight_number,
            origin: flight.origin,
            destination: flight.destination,
            departure_time: flight.departure_time?.slice(0, 16),
            arrival_time: flight.arrival_time?.slice(0, 16),
            total_capacity: flight.total_capacity,
            status: flight.status
        })
        setEditFlight(flight)
        setShowModal(true)
    }

    async function saveFlight() {
        setSaving(true)
        const payload = {
            ...form,
            total_capacity: parseInt(form.total_capacity)
        }
        if (editFlight) {
            await supabase.from('flights').update(payload).eq('id', editFlight.id)
        } else {
            await supabase.from('flights').insert(payload)
        }
        setSaving(false)
        setShowModal(false)
        fetchFlights()
    }

    async function deleteFlight(id: any) {
        await supabase.from('flights').delete().eq('id', id)
        setDeleteId(null)
        fetchFlights()
    }

    const statusConfig: Record<string, any> = {
        SCHEDULED: { bg: 'rgba(59,130,246,0.12)', color: '#93C5FD', dot: '#3B82F6' },
        DELAYED: { bg: 'rgba(245,158,11,0.12)', color: '#FCD34D', dot: '#F59E0B' },
        CANCELLED: { bg: 'rgba(239,68,68,0.12)', color: '#FCA5A5', dot: '#EF4444' },
        DEPARTED: { bg: 'rgba(16,185,129,0.12)', color: '#6EE7B7', dot: '#10B981' },
    }

    const inputStyle = {
        width: '100%',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '10px',
        padding: '10px 14px',
        color: 'white',
        fontSize: '14px',
        outline: 'none',
    }

    const labelStyle = {
        color: 'rgba(255,255,255,0.5)',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '1px',
        textTransform: 'uppercase' as const,
        marginBottom: '6px',
        display: 'block'
    }

    const cols = '1.2fr 1.2fr 1.6fr 1.6fr 140px 100px'

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
                    position: 'absolute', top: '5%', right: '3%',
                    opacity: 0.035, transform: 'rotate(42deg)'
                }}>
                    <Plane size={240} color="white" />
                </div>
                <div style={{
                    position: 'absolute', top: '-10%', right: '-5%',
                    width: '500px', height: '500px',
                    background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)',
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
                                background: '#3B82F6', boxShadow: '0 0 10px #3B82F6'
                            }} />
                            <span style={{
                                color: '#3B82F6', fontSize: '11px', fontWeight: '700',
                                letterSpacing: '2.5px', textTransform: 'uppercase'
                            }}>Fleet Management</span>
                        </div>
                        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'white', letterSpacing: '-0.5px' }}>
                            Flights
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', marginTop: '4px' }}>
                            {flights.length} flights in system
                        </p>
                    </div>

                    <button
                        onClick={openCreate}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
                            border: 'none', borderRadius: '12px',
                            padding: '12px 20px', color: 'white',
                            fontSize: '14px', fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(59,130,246,0.4)'
                        }}
                    >
                        <Plus size={16} />
                        Add Flight
                    </button>
                </div>

                {/* Table */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px', overflow: 'hidden'
                }}>
                    {/* Column headers */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: cols,
                        padding: '14px 28px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.03)'
                    }}>
                        {['Flight', 'Route', 'Departure', 'Arrival', 'Status', 'Actions'].map(h => (
                            <p key={h} style={{
                                color: 'rgba(255,255,255,0.25)', fontSize: '11px',
                                fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase'
                            }}>{h}</p>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <p style={{ color: 'rgba(255,255,255,0.3)' }}>Loading...</p>
                        </div>
                    ) : flights.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <Plane size={28} color="rgba(255,255,255,0.1)"
                                style={{ margin: '0 auto 12px', display: 'block' }} />
                            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
                                No flights found
                            </p>
                        </div>
                    ) : (
                        flights.map((flight, i) => {
                            const sc = statusConfig[flight.status] || statusConfig.SCHEDULED
                            return (
                                <div
                                    key={flight.id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: cols,
                                        padding: '16px 28px',
                                        borderBottom: i < flights.length - 1
                                            ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                        transition: 'background 0.15s',
                                        alignItems: 'center'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    {/* Flight number */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '32px', height: '32px',
                                            background: 'rgba(59,130,246,0.1)',
                                            border: '1px solid rgba(59,130,246,0.2)',
                                            borderRadius: '8px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Plane size={12} color="#3B82F6" />
                                        </div>
                                        <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>
                                            {flight.flight_number}
                                        </span>
                                    </div>

                                    {/* Route */}
                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                                        {flight.origin} → {flight.destination}
                                    </span>

                                    {/* Departure */}
                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                                        {new Date(flight.departure_time).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>

                                    {/* Arrival */}
                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                                        {new Date(flight.arrival_time).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>

                                    {/* Status */}
                                    <div>
                                        <span style={{
                                            background: sc.bg,
                                            color: sc.color,
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            padding: '5px 12px',
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
                                            {flight.status}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => openEdit(flight)}
                                            style={{
                                                width: '32px', height: '32px',
                                                background: 'rgba(59,130,246,0.1)',
                                                border: '1px solid rgba(59,130,246,0.2)',
                                                borderRadius: '8px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0
                                            }}
                                        >
                                            <Pencil size={12} color="#3B82F6" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(flight.id)}
                                            style={{
                                                width: '32px', height: '32px',
                                                background: 'rgba(239,68,68,0.1)',
                                                border: '1px solid rgba(239,68,68,0.2)',
                                                borderRadius: '8px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0
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

            {/* Create/Edit Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                    zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #0D1B4B, #0A2463)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '24px', padding: '32px',
                        width: '520px', maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: '28px'
                        }}>
                            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '700' }}>
                                {editFlight ? 'Edit Flight' : 'Add New Flight'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: 'none', borderRadius: '8px',
                                    width: '32px', height: '32px',
                                    cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <X size={16} color="white" />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {([
                                { key: 'flight_number', label: 'Flight Number', placeholder: 'SK101' },
                                { key: 'total_capacity', label: 'Total Capacity', placeholder: '180', type: 'number' },
                                { key: 'origin', label: 'Origin', placeholder: 'NYC' },
                                { key: 'destination', label: 'Destination', placeholder: 'LAX' },
                                { key: 'departure_time', label: 'Departure Time', type: 'datetime-local' },
                                { key: 'arrival_time', label: 'Arrival Time', type: 'datetime-local' },
                            ] as FieldDef[]).map(field => (
                                <div key={field.key}>
                                    <label style={labelStyle}>{field.label}</label>
                                    <input
                                        type={field.type || 'text'}
                                        placeholder={field.placeholder}
                                        value={form[field.key]}
                                        onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>
                            ))}

                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Status</label>
                                <select
                                    value={form.status}
                                    onChange={e => setForm({ ...form, status: e.target.value })}
                                    style={inputStyle}
                                >
                                    {['SCHEDULED', 'DELAYED', 'CANCELLED', 'DEPARTED'].map(s => (
                                        <option key={s} value={s}
                                            style={{ background: '#0D1B4B' }}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    flex: 1, padding: '12px',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px', color: 'rgba(255,255,255,0.6)',
                                    fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveFlight}
                                disabled={saving}
                                style={{
                                    flex: 2, padding: '12px',
                                    background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
                                    border: 'none', borderRadius: '12px',
                                    color: 'white', fontSize: '14px',
                                    fontWeight: '600', cursor: 'pointer',
                                    boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: '8px'
                                }}
                            >
                                <Check size={16} />
                                {saving ? 'Saving...' : editFlight ? 'Update Flight' : 'Create Flight'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteId && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                    zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #0D1B4B, #0A2463)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '24px', padding: '32px', width: '400px'
                    }}>
                        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>
                            Delete Flight?
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '28px' }}>
                            This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setDeleteId(null)}
                                style={{
                                    flex: 1, padding: '12px',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px', color: 'rgba(255,255,255,0.6)',
                                    fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteFlight(deleteId)}
                                style={{
                                    flex: 1, padding: '12px',
                                    background: 'linear-gradient(135deg, #991B1B, #EF4444)',
                                    border: 'none', borderRadius: '12px',
                                    color: 'white', fontSize: '14px',
                                    fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}