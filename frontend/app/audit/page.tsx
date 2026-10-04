'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ScrollText, Plane } from 'lucide-react'

export default function AuditPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchLogs() }, [])

    async function fetchLogs() {
        const { data } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)
        setLogs(data || [])
        setLoading(false)
    }

    useEffect(() => { fetchLogs() }, [])

    const actionConfig: Record<string, any> = {
        FRAUD_DETECTED: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
        HOLD_EXPIRED: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
        RAG_RESPONSE_REJECTED: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
        WAITLIST_PROMOTED: { color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
        REFUND_ESCALATED: { color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
    }

    function getActionConfig(action: string) {
        return actionConfig[action] || { color: '#93C5FD', bg: 'rgba(59,130,246,0.12)' }
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
                    background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 65%)',
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
                            background: '#6366F1', boxShadow: '0 0 10px #6366F1'
                        }} />
                        <span style={{
                            color: '#6366F1', fontSize: '11px', fontWeight: '700',
                            letterSpacing: '2.5px', textTransform: 'uppercase'
                        }}>System Activity</span>
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'white', letterSpacing: '-0.5px' }}>
                        Audit Logs
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', marginTop: '4px' }}>
                        {logs.length} recent system events
                    </p>
                </div>

                {/* Logs */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px', overflow: 'hidden'
                }}>
                    {/* Column headers */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr 1.5fr',
                        padding: '14px 28px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.03)'
                    }}>
                        {['Time', 'Entity', 'Action', 'Changed By'].map(h => (
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
                    ) : logs.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <ScrollText size={28} color="rgba(255,255,255,0.1)"
                                style={{ margin: '0 auto 12px', display: 'block' }} />
                            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
                                No audit logs found
                            </p>
                        </div>
                    ) : (
                        logs.map((log, i) => {
                            const ac = getActionConfig(log.action)
                            return (
                                <div
                                    key={log.id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr 1fr 1.5fr',
                                        padding: '16px 28px',
                                        borderBottom: i < logs.length - 1
                                            ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                        transition: 'background 0.15s', alignItems: 'center'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    {/* Time */}
                                    <div>
                                        <p style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>
                                            {new Date(log.created_at).toLocaleDateString('en-US', {
                                                month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', marginTop: '2px' }}>
                                            {new Date(log.created_at).toLocaleDateString('en-US', { year: 'numeric' })}
                                        </p>
                                    </div>

                                    {/* Entity */}
                                    <div>
                                        <p style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>
                                            {log.entity_name}
                                        </p>
                                        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', marginTop: '2px' }}>
                                            {log.entity_id?.slice(0, 12)}...
                                        </p>
                                    </div>

                                    {/* Action */}
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{
                                            background: ac.bg,
                                            color: ac.color,
                                            fontSize: '10px',
                                            fontWeight: '700',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            whiteSpace: 'nowrap' as const,
                                            display: 'inline-block'
                                        }}>
                                            {log.action}
                                        </span>
                                    </div>

                                    {/* Changed By */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: '26px', height: '26px',
                                            background: 'rgba(99,102,241,0.15)',
                                            border: '1px solid rgba(99,102,241,0.2)',
                                            borderRadius: '6px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <span style={{ color: '#818CF8', fontSize: '10px', fontWeight: '700' }}>
                                                {log.changed_by?.[0]?.toUpperCase()}
                                            </span>
                                        </div>
                                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                                            {log.changed_by}
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