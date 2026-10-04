'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Send, Plane, CheckCircle } from 'lucide-react'

export default function SupportPage() {
    const [form, setForm] = useState({
        passenger_id: '',
        question: ''
    })
    const [passengers, setPassengers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [loadingPassengers, setLoadingPassengers] = useState(false)

    async function fetchPassengers() {
        if (passengers.length > 0) return
        setLoadingPassengers(true)
        const { data } = await supabase.from('passengers').select('*')
        setPassengers(data || [])
        setLoadingPassengers(false)
    }

    async function submitTicket() {
        if (!form.passenger_id || !form.question) return
        setLoading(true)
        try {
            await fetch('http://localhost:5678/webhook/customer-support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })
            setSent(true)
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    const inputStyle = {
        width: '100%',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '12px',
        padding: '12px 16px',
        color: 'white',
        fontSize: '14px',
        outline: 'none',
    }

    const labelStyle = {
        color: 'rgba(255,255,255,0.5)',
        fontSize: '12px',
        fontWeight: '600' as const,
        letterSpacing: '1px',
        textTransform: 'uppercase' as const,
        marginBottom: '8px',
        display: 'block'
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
                    background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 65%)',
                    borderRadius: '50%'
                }} />
                <div style={{
                    position: 'absolute', top: '5%', right: '3%',
                    opacity: 0.035, transform: 'rotate(42deg)'
                }}>
                    <Plane size={240} color="white" />
                </div>
            </div>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px' }}>

                {/* Header */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <div style={{
                            width: '7px', height: '7px', borderRadius: '50%',
                            background: '#8B5CF6', boxShadow: '0 0 10px #8B5CF6'
                        }} />
                        <span style={{
                            color: '#8B5CF6', fontSize: '11px', fontWeight: '700',
                            letterSpacing: '2.5px', textTransform: 'uppercase'
                        }}>AI Support</span>
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'white', letterSpacing: '-0.5px' }}>
                        Customer Support
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', marginTop: '4px' }}>
                        AI-powered support with human approval gate
                    </p>
                </div>

                {sent ? (
                    /* Success State */
                    <div style={{
                        background: 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        borderRadius: '24px', padding: '48px',
                        textAlign: 'center'
                    }}>
                        <CheckCircle size={48} color="#10B981"
                            style={{ margin: '0 auto 16px', display: 'block' }} />
                        <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>
                            Ticket Submitted!
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '24px' }}>
                            Our AI is generating a response. The ops team will review and approve before sending to the passenger.
                        </p>
                        <button
                            onClick={() => { setSent(false); setForm({ passenger_id: '', question: '' }) }}
                            style={{
                                background: 'linear-gradient(135deg, #065F46, #10B981)',
                                border: 'none', borderRadius: '12px',
                                padding: '12px 24px', color: 'white',
                                fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                            }}
                        >
                            Submit Another
                        </button>
                    </div>
                ) : (
                    /* Form */
                    <div style={{
                        background: 'rgba(255,255,255,0.04)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '24px', padding: '36px'
                    }}>

                        {/* How it works */}
                        <div style={{
                            background: 'rgba(139,92,246,0.08)',
                            border: '1px solid rgba(139,92,246,0.15)',
                            borderRadius: '14px', padding: '16px 20px',
                            marginBottom: '28px'
                        }}>
                            <p style={{
                                color: '#A78BFA', fontSize: '12px', fontWeight: '700',
                                letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px'
                            }}>
                                How It Works
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {[
                                    '1. Select passenger and enter their question',
                                    '2. AI fetches their fare type from database',
                                    '3. RAG pipeline searches policy documents',
                                    '4. Fare-aware response generated by Ollama',
                                    '5. Ops team reviews and approves via email',
                                    '6. Response sent to passenger after approval'
                                ].map(step => (
                                    <p key={step} style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                                        {step}
                                    </p>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={labelStyle}>Passenger</label>
                                <select
                                    value={form.passenger_id}
                                    onFocus={fetchPassengers}
                                    onChange={e => setForm({ ...form, passenger_id: e.target.value })}
                                    style={inputStyle}
                                >
                                    <option value="" style={{ background: '#0D1B4B' }}>
                                        {loadingPassengers ? 'Loading...' : 'Select passenger...'}
                                    </option>
                                    {passengers.map(p => (
                                        <option key={p.id} value={p.id} style={{ background: '#0D1B4B' }}>
                                            {p.first_name} {p.last_name} — {p.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={labelStyle}>Customer Question</label>
                                <textarea
                                    placeholder="e.g. Can I change my flight date? What is my baggage allowance?"
                                    value={form.question}
                                    onChange={e => setForm({ ...form, question: e.target.value })}
                                    rows={5}
                                    style={{
                                        ...inputStyle,
                                        resize: 'vertical' as const,
                                        lineHeight: '1.6'
                                    }}
                                />
                            </div>

                            <button
                                onClick={submitTicket}
                                disabled={loading || !form.passenger_id || !form.question}
                                style={{
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: '8px',
                                    background: form.passenger_id && form.question
                                        ? 'linear-gradient(135deg, #5B21B6, #8B5CF6)'
                                        : 'rgba(255,255,255,0.06)',
                                    border: 'none', borderRadius: '12px',
                                    padding: '14px', color: 'white',
                                    fontSize: '14px', fontWeight: '600',
                                    cursor: form.passenger_id && form.question ? 'pointer' : 'not-allowed',
                                    boxShadow: form.passenger_id && form.question
                                        ? '0 4px 20px rgba(139,92,246,0.4)' : 'none',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                <Send size={16} />
                                {loading ? 'Submitting...' : 'Submit Support Ticket'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}