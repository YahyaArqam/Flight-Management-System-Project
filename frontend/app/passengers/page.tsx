'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, Plus, Pencil, Trash2, X, Check, AlertCircle } from 'lucide-react'

type Passenger = {
    id: string
    first_name: string
    last_name: string
    email: string
    loyalty_tier: number
}

type PassengerForm = {
    first_name: string
    last_name: string
    email: string
    loyalty_tier: string
}

type FieldDef = {
    key: keyof PassengerForm
    label: string
    placeholder: string
    type?: string
}

const emptyForm: PassengerForm = {
    first_name: '',
    last_name: '',
    email: '',
    loyalty_tier: '0'
}

const tiers: Record<number, { label: string; bg: string; color: string; dot: string }> = {
    0: { label: 'Standard', bg: 'rgba(148,163,184,0.12)', color: '#CBD5E1', dot: '#94A3B8' },
    1: { label: 'Silver', bg: 'rgba(6,182,212,0.12)', color: '#67E8F9', dot: '#06B6D4' },
    2: { label: 'Gold', bg: 'rgba(245,158,11,0.12)', color: '#FCD34D', dot: '#F59E0B' },
    3: { label: 'Platinum', bg: 'rgba(139,92,246,0.12)', color: '#C4B5FD', dot: '#8B5CF6' },
}

const fields: FieldDef[] = [
    { key: 'first_name', label: 'First Name', placeholder: 'John' },
    { key: 'last_name', label: 'Last Name', placeholder: 'Doe' },
    { key: 'email', label: 'Email', placeholder: 'john@example.com', type: 'email' },
]

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

const cols = '2fr 2.4fr 1.2fr 100px'

export default function PassengersPage() {
    const [passengers, setPassengers] = useState<Passenger[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [editPassenger, setEditPassenger] = useState<Passenger | null>(null)
    const [form, setForm] = useState<PassengerForm>(emptyForm)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Passenger | null>(null)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => { fetchPassengers() }, [])

    async function fetchPassengers() {
        const { data, error } = await supabase
            .from('passengers')
            .select('*')
            .order('first_name', { ascending: true })
        if (error) {
            setLoadError(error.message)
            setPassengers([])
        } else {
            setLoadError(null)
            setPassengers((data || []) as Passenger[])
        }
        setLoading(false)
    }

    function openCreate() {
        setForm(emptyForm)
        setEditPassenger(null)
        setFormError(null)
        setShowModal(true)
    }

    function openEdit(p: Passenger) {
        setForm({
            first_name: p.first_name,
            last_name: p.last_name,
            email: p.email,
            loyalty_tier: String(p.loyalty_tier ?? 0)
        })
        setEditPassenger(p)
        setFormError(null)
        setShowModal(true)
    }

    async function savePassenger() {
        if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
            setFormError('First name, last name and email are required.')
            return
        }
        setSaving(true)
        setFormError(null)
        const payload = {
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            email: form.email.trim(),
            loyalty_tier: parseInt(form.loyalty_tier, 10)
        }
        const { error } = editPassenger
            ? await supabase.from('passengers').update(payload).eq('id', editPassenger.id)
            : await supabase.from('passengers').insert(payload)
        setSaving(false)
        if (error) {
            setFormError(error.message)
            return
        }
        setShowModal(false)
        fetchPassengers()
    }

    async function confirmDelete() {
        if (!deleteTarget) return
        setDeleting(true)
        setDeleteError(null)
        const { error } = await supabase.from('passengers').delete().eq('id', deleteTarget.id)
        setDeleting(false)
        if (error) {
            setDeleteError(error.message)
            return
        }
        setDeleteTarget(null)
        fetchPassengers()
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
                    position: 'absolute', top: '5%', right: '3%',
                    opacity: 0.035, transform: 'rotate(12deg)'
                }}>
                    <Users size={240} color="white" />
                </div>
                <div style={{
                    position: 'absolute', top: '-10%', right: '-5%',
                    width: '500px', height: '500px',
                    background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 65%)',
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
                                background: '#10B981', boxShadow: '0 0 10px #10B981'
                            }} />
                            <span style={{
                                color: '#10B981', fontSize: '11px', fontWeight: 700,
                                letterSpacing: '2.5px', textTransform: 'uppercase'
                            }}>Passenger Management</span>
                        </div>
                        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'white', letterSpacing: '-0.5px' }}>
                            Passengers
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', marginTop: '4px' }}>
                            {passengers.length} passengers registered
                        </p>
                    </div>

                    <button
                        onClick={openCreate}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'linear-gradient(135deg, #047857, #10B981)',
                            border: 'none', borderRadius: '12px',
                            padding: '12px 20px', color: 'white',
                            fontSize: '14px', fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(16,185,129,0.35)'
                        }}
                    >
                        <Plus size={16} />
                        Add Passenger
                    </button>
                </div>

                {/* Load error banner */}
                {loadError && (
                    <div style={{ ...errorBoxStyle, marginBottom: '20px' }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                        <span>Could not load passengers: {loadError}</span>
                    </div>
                )}

                {/* Table */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px', overflow: 'hidden'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: cols,
                        padding: '14px 28px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.03)'
                    }}>
                        {['Passenger', 'Email', 'Loyalty Tier', 'Actions'].map(h => (
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
                    ) : passengers.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <Users size={28} color="rgba(255,255,255,0.1)"
                                style={{ margin: '0 auto 12px', display: 'block' }} />
                            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
                                {loadError ? 'Unable to load passengers' : 'No passengers found'}
                            </p>
                        </div>
                    ) : (
                        passengers.map((p, i) => {
                            const t = tiers[p.loyalty_tier] || tiers[0]
                            return (
                                <div
                                    key={p.id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: cols,
                                        padding: '16px 28px',
                                        borderBottom: i < passengers.length - 1
                                            ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                        transition: 'background 0.15s',
                                        alignItems: 'center'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '32px', height: '32px',
                                            background: 'rgba(16,185,129,0.1)',
                                            border: '1px solid rgba(16,185,129,0.2)',
                                            borderRadius: '8px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Users size={12} color="#10B981" />
                                        </div>
                                        <span style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>
                                            {p.first_name} {p.last_name}
                                        </span>
                                    </div>

                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                                        {p.email}
                                    </span>

                                    <div>
                                        <span style={{
                                            background: t.bg, color: t.color,
                                            fontSize: '11px', fontWeight: 700,
                                            padding: '5px 12px', borderRadius: '20px',
                                            display: 'inline-flex', alignItems: 'center',
                                            gap: '5px', whiteSpace: 'nowrap'
                                        }}>
                                            <span style={{
                                                width: '5px', height: '5px',
                                                background: t.dot, borderRadius: '50%',
                                                flexShrink: 0, boxShadow: `0 0 6px ${t.dot}`
                                            }} />
                                            {t.label}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => openEdit(p)}
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
                                            onClick={() => { setDeleteError(null); setDeleteTarget(p) }}
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
                <div style={overlayStyle}>
                    <div style={{
                        background: 'linear-gradient(135deg, #0D1B4B, #0A2463)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '24px', padding: '32px',
                        width: '480px', maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: '28px'
                        }}>
                            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700 }}>
                                {editPassenger ? 'Edit Passenger' : 'Add New Passenger'}
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
                            {fields.map(field => (
                                <div
                                    key={field.key}
                                    style={field.key === 'email' ? { gridColumn: '1 / -1' } : undefined}
                                >
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
                                <label style={labelStyle}>Loyalty Tier</label>
                                <select
                                    value={form.loyalty_tier}
                                    onChange={e => setForm({ ...form, loyalty_tier: e.target.value })}
                                    style={inputStyle}
                                >
                                    {[0, 1, 2, 3].map(n => (
                                        <option key={n} value={String(n)} style={{ background: '#0D1B4B' }}>
                                            {n} - {tiers[n].label}
                                        </option>
                                    ))}
                                </select>
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
                                onClick={savePassenger}
                                disabled={saving}
                                style={{
                                    flex: 2, padding: '12px',
                                    background: 'linear-gradient(135deg, #047857, #10B981)',
                                    border: 'none', borderRadius: '12px',
                                    color: 'white', fontSize: '14px',
                                    fontWeight: 600, cursor: 'pointer',
                                    boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: '8px'
                                }}
                            >
                                <Check size={16} />
                                {saving ? 'Saving...' : editPassenger ? 'Update Passenger' : 'Create Passenger'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteTarget && (
                <div style={overlayStyle}>
                    <div style={{
                        background: 'linear-gradient(135deg, #0D1B4B, #0A2463)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '24px', padding: '32px', width: '420px'
                    }}>
                        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
                            Delete Passenger?
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '20px' }}>
                            {deleteTarget.first_name} {deleteTarget.last_name} will be permanently removed.
                            This cannot be undone.
                        </p>

                        {deleteError && (
                            <div style={{ ...errorBoxStyle, marginBottom: '20px' }}>
                                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                                <span>{deleteError}</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setDeleteTarget(null)} style={cancelBtnStyle}>
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
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