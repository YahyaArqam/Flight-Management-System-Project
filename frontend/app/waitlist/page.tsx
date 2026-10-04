'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Clock, Users, Plane } from 'lucide-react'

export default function WaitlistPage() {
    const [waitlist, setWaitlist] = useState<any[]>([])
    const [loading, setLoading] = useState(true)



    async function fetchWaitlist() {
        const { data } = await supabase
            .from('waitlists')
            .select('*, flights(flight_number, origin, destination), passengers(first_name, last_name, email)')
            .order('priority_score', { ascending: false })
        setWaitlist(data || [])
        setLoading(false)
    }

    useEffect(() => { fetchWaitlist() }, [])

    const statusConfig: Record<string, any> = {
        WAITING: { bg: 'rgba(245,158,11,0.12)', color: '#FCD34D', dot: '#F59E0B' },
        PROMOTED: { bg: 'rgba(16,185,129,0.12)', color: '#6EE7B7', dot: '#10B981' },
        EXPIRED: { bg: 'rgba(239,68,68,0.12)', color: '#FCA5A5', dot: '#EF4444' },
    }

    const fareConfig: Record<string, any> = {
        BASIC_ECONOMY: { color: '#93C5FD', bg: 'rgba(59,130,246,0.12)' },
        FLEXIBLE: { color: '#6EE7B7', bg: 'rgba(16,185,129,0.12)' },
        BUSINESS_CLASS: { color: '#FCD34D', bg: 'rgba(252,211,77,0.12)' },
    }

    const cols = '1.5fr 1.5fr 1fr 0.8fr 1fr'

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
                    background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 65%)',
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
            <div style={{ position: 'relative', zIndex: 1 }}>

                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <div style={{
                            width: '7px', height: '7px', borderRadius: '50%',
                            background: '#F59E0B', boxShadow: '0 0 10px #F59E0B'
                        }} />
                        <span style={{
                            color: '#F59E0B', fontSize: '11px', fontWeight: '700',
                            letterSpacing: '2.5px', textTransform: 'uppercase'
                        }}>Standby Queue</span>
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'white', letterSpacing: '-0.5px' }}>
                        Waitlist
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', marginTop: '4px' }}>
                        {waitlist.filter(w => w.status === 'WAITING').length} passengers waiting
                    </p>
                </div>

                {/* Stats Row */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '16px', marginBottom: '28px'
                }}>
                    {[
                        { label: 'Waiting', value: waitlist.filter(w => w.status === 'WAITING').length, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
                        { label: 'Promoted', value: waitlist.filter(w => w.status === 'PROMOTED').length, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
                        { label: 'Expired', value: waitlist.filter(w => w.status === 'EXPIRED').length, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
                    ].map(stat => (
                        <div key={stat.label} style={{
                            background: stat.bg,
                            border: `1px solid ${stat.color}20`,
                            borderRadius: '16px', padding: '20px 24px',
                            display: 'flex', alignItems: 'center', gap: '16px'
                        }}>
                            <div style={{
                                width: '42px', height: '42px',
                                background: `${stat.color}20`,
                                borderRadius: '12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Clock size={18} color={stat.color} />
                            </div>
                            <div>
                                <p style={{ color: stat.color, fontSize: '28px', fontWeight: '700', lineHeight: 1 }}>
                                    {stat.value}
                                </p>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '2px' }}>
                                    {stat.label}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px', overflow: 'hidden'
                }}>
                    <div style={{
                        display: 'grid', gridTemplateColumns: cols,
                        padding: '14px 28px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.03)'
                    }}>
                        {['Passenger', 'Flight', 'Fare', 'Priority', 'Status'].map(h => (
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
                    ) : waitlist.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <Users size={28} color="rgba(255,255,255,0.1)"
                                style={{ margin: '0 auto 12px', display: 'block' }} />
                            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
                                No passengers on waitlist
                            </p>
                        </div>
                    ) : (
                        waitlist.map((w, i) => {
                            const sc = statusConfig[w.status] || statusConfig.WAITING
                            const fc = fareConfig[w.fare_type] || fareConfig.BASIC_ECONOMY
                            return (
                                <div
                                    key={w.id}
                                    style={{
                                        display: 'grid', gridTemplateColumns: cols,
                                        padding: '16px 28px',
                                        borderBottom: i < waitlist.length - 1
                                            ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                        transition: 'background 0.15s', alignItems: 'center'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    {/* Passenger */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '34px', height: '34px',
                                            background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(59,130,246,0.2))',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '10px',
                                            display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', flexShrink: 0
                                        }}>
                                            <span style={{ color: 'white', fontSize: '12px', fontWeight: '700' }}>
                                                {w.passengers?.first_name?.[0]}{w.passengers?.last_name?.[0]}
                                            </span>
                                        </div>
                                        <div>
                                            <p style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>
                                                {w.passengers?.first_name} {w.passengers?.last_name}
                                            </p>
                                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                                                {w.passengers?.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Flight */}
                                    <div>
                                        <p style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>
                                            {w.flights?.flight_number}
                                        </p>
                                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                                            {w.flights?.origin} → {w.flights?.destination}
                                        </p>
                                    </div>

                                    {/* Fare */}
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{
                                            background: fc.bg, color: fc.color,
                                            fontSize: '10px', fontWeight: '700',
                                            padding: '4px 10px', borderRadius: '20px',
                                            whiteSpace: 'nowrap' as const,
                                            display: 'inline-block'
                                        }}>
                                            {w.fare_type?.replace(/_/g, ' ')}
                                        </span>
                                    </div>

                                    {/* Priority Score */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: '32px', height: '32px',
                                            background: 'rgba(245,158,11,0.12)',
                                            border: '1px solid rgba(245,158,11,0.2)',
                                            borderRadius: '8px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <span style={{ color: '#FCD34D', fontSize: '12px', fontWeight: '700' }}>
                                                {w.priority_score}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{
                                            background: sc.bg, color: sc.color,
                                            fontSize: '11px', fontWeight: '700',
                                            padding: '4px 12px', borderRadius: '20px',
                                            display: 'inline-flex', alignItems: 'center',
                                            gap: '5px', whiteSpace: 'nowrap' as const
                                        }}>
                                            <span style={{
                                                width: '5px', height: '5px',
                                                background: sc.dot, borderRadius: '50%',
                                                flexShrink: 0,
                                                boxShadow: `0 0 6px ${sc.dot}`
                                            }} />
                                            {w.status}
                                        </span>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}