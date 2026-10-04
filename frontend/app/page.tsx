'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { Plane, Users, BookOpen, Clock, TrendingUp, AlertTriangle, ArrowUpRight } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    flights: 0, passengers: 0, bookings: 0,
    waitlist: 0, revenue: 0, pendingRefunds: 0
  })
  const [flights, setFlights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchStats() {
    const [
      { count: flightsCount },
      { count: passengersCount },
      { count: bookingsCount },
      { count: waitlistCount },
      { count: refundsCount },
      { data: revenueData }
    ] = await Promise.all([
      supabase.from('flights').select('*', { count: 'exact', head: true }),
      supabase.from('passengers').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'CONFIRMED'),
      supabase.from('waitlists').select('*', { count: 'exact', head: true }).eq('status', 'WAITING'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('refund_status', 'PENDING'),
      supabase.from('bookings').select('price_paid').eq('status', 'CONFIRMED')
    ])
    const totalRevenue = revenueData?.reduce((sum, b) => sum + (b.price_paid || 0), 0) || 0
    setStats({
      flights: flightsCount || 0,
      passengers: passengersCount || 0,
      bookings: bookingsCount || 0,
      waitlist: waitlistCount || 0,
      revenue: totalRevenue,
      pendingRefunds: refundsCount || 0
    })
    setLoading(false)
  }

  async function fetchRecentFlights() {
    const { data } = await supabase
      .from('flights')
      .select('*')
      .order('departure_time', { ascending: true })
      .limit(5)
    setFlights(data || [])
  }

  useEffect(() => {
    fetchStats()
    fetchRecentFlights()
  }, [])

  const statCards = [
    { label: 'Total Flights', value: stats.flights, icon: Plane, color: '#3B82F6', glow: 'rgba(59,130,246,0.25)', sub: 'Active routes', route: '/flights' },
    { label: 'Passengers', value: stats.passengers, icon: Users, color: '#10B981', glow: 'rgba(16,185,129,0.25)', sub: 'Registered', route: '/passengers' },
    { label: 'Bookings', value: stats.bookings, icon: BookOpen, color: '#06B6D4', glow: 'rgba(6,182,212,0.25)', sub: 'Confirmed', route: '/bookings' },
    { label: 'Waitlist', value: stats.waitlist, icon: Clock, color: '#34D399', glow: 'rgba(52,211,153,0.25)', sub: 'Pending seats', route: '/waitlist' },
    { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}`, icon: TrendingUp, color: '#3B82F6', glow: 'rgba(59,130,246,0.25)', sub: 'Total confirmed', route: '/bookings' },
    { label: 'Refunds', value: stats.pendingRefunds, icon: AlertTriangle, color: '#EF4444', glow: 'rgba(239,68,68,0.25)', sub: 'Pending', route: '/bookings' },
  ]

  const statusConfig: Record<string, any> = {
    SCHEDULED: { bg: 'rgba(59,130,246,0.12)', color: '#93C5FD', dot: '#3B82F6' },
    DELAYED: { bg: 'rgba(245,158,11,0.12)', color: '#FCD34D', dot: '#F59E0B' },
    CANCELLED: { bg: 'rgba(239,68,68,0.12)', color: '#FCA5A5', dot: '#EF4444' },
    DEPARTED: { bg: 'rgba(16,185,129,0.12)', color: '#6EE7B7', dot: '#10B981' },
  }

  return (
    <div style={{ padding: '40px 48px', minHeight: '100vh', position: 'relative' }}>

      {/* ── Background Layer ── */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden'
      }}>
        {/* Subtle grid */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px'
        }} />

        {/* Green glow top right */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          right: '-8%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 65%)',
          borderRadius: '50%'
        }} />

        {/* Blue glow bottom left */}
        <div style={{
          position: 'absolute',
          bottom: '-15%',
          left: '15%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)',
          borderRadius: '50%'
        }} />

        {/* Blue glow center */}
        <div style={{
          position: 'absolute',
          top: '30%',
          right: '25%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 65%)',
          borderRadius: '50%'
        }} />

        {/* Large faint plane — top right */}
        <div style={{
          position: 'absolute',
          top: '6%',
          right: '4%',
          opacity: 0.035,
          transform: 'rotate(42deg)'
        }}>
          <Plane size={260} color="white" />
        </div>

        {/* Medium faint plane — bottom center */}
        <div style={{
          position: 'absolute',
          bottom: '8%',
          left: '35%',
          opacity: 0.025,
          transform: 'rotate(25deg)'
        }}>
          <Plane size={160} color="white" />
        </div>

        {/* Small faint plane — middle right */}
        <div style={{
          position: 'absolute',
          top: '42%',
          right: '6%',
          opacity: 0.025,
          transform: 'rotate(35deg)'
        }}>
          <Plane size={100} color="white" />
        </div>

        {/* Dotted flight path line */}
        <div style={{
          position: 'absolute',
          top: '18%',
          left: '260px',
          right: '80px',
          height: '1px',
          background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 6px, transparent 6px, transparent 18px)',
          transform: 'rotate(-3deg)'
        }} />

        {/* Second dotted path */}
        <div style={{
          position: 'absolute',
          top: '55%',
          left: '260px',
          right: '120px',
          height: '1px',
          background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 6px, transparent 6px, transparent 18px)',
          transform: 'rotate(2deg)'
        }} />
      </div>

      {/* ── Content Layer ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                width: '7px', height: '7px',
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 10px #10B981'
              }} />
              <span style={{
                color: '#10B981',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '2.5px',
                textTransform: 'uppercase'
              }}>
                Live Operations
              </span>
            </div>
            <h1 style={{
              fontSize: '30px',
              fontWeight: '700',
              color: 'white',
              letterSpacing: '-0.5px',
              marginBottom: '4px'
            }}>
              Welcome, Admin
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric',
                month: 'long', day: 'numeric'
              })}
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Plane size={15} color="#3B82F6" />
            <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
              SkyOps Control
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '28px'
        }}>
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                onClick={() => router.push(card.route)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  padding: '28px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = `0 20px 60px ${card.glow}`
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                }}
              >
                {/* Card glow blob */}
                <div style={{
                  position: 'absolute',
                  top: '-30px', right: '-30px',
                  width: '100px', height: '100px',
                  background: card.color,
                  borderRadius: '50%',
                  opacity: 0.07,
                  filter: 'blur(30px)',
                  pointerEvents: 'none'
                }} />

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    width: '42px', height: '42px',
                    background: `${card.color}18`,
                    border: `1px solid ${card.color}30`,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={18} color={card.color} />
                  </div>
                  <ArrowUpRight size={14} color="rgba(255,255,255,0.2)" />
                </div>

                <p style={{
                  color: 'white',
                  fontSize: '34px',
                  fontWeight: '700',
                  letterSpacing: '-1px',
                  lineHeight: 1,
                  marginBottom: '8px'
                }}>
                  {loading ? '—' : card.value}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: '500' }}>
                  {card.label}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', marginTop: '2px' }}>
                  {card.sub}
                </p>
              </div>
            )
          })}
        </div>

        {/* Flights Table */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 28px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
              Upcoming Flights
            </h2>
            <span style={{
              background: 'rgba(59,130,246,0.12)',
              color: '#93C5FD',
              fontSize: '12px',
              fontWeight: '600',
              padding: '4px 14px',
              borderRadius: '20px',
              border: '1px solid rgba(59,130,246,0.2)'
            }}>
              {flights.length} flights
            </span>
          </div>

          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1.5fr 1.5fr 1fr',
            padding: '12px 28px',
            borderBottom: '1px solid rgba(255,255,255,0.04)'
          }}>
            {['Flight', 'Route', 'Departure', 'Status'].map(h => (
              <p key={h} style={{
                color: 'rgba(255,255,255,0.2)',
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '1.5px',
                textTransform: 'uppercase'
              }}>{h}</p>
            ))}
          </div>

          {flights.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <Plane size={28} color="rgba(255,255,255,0.1)"
                style={{ margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
                No upcoming flights
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
                    gridTemplateColumns: '1.5fr 1.5fr 1.5fr 1fr',
                    padding: '16px 28px',
                    borderBottom: i < flights.length - 1
                      ? '1px solid rgba(255,255,255,0.04)'
                      : 'none',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px',
                      background: 'rgba(59,130,246,0.1)',
                      border: '1px solid rgba(59,130,246,0.2)',
                      borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Plane size={12} color="#3B82F6" />
                    </div>
                    <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>
                      {flight.flight_number}
                    </span>
                  </div>

                  <span style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {flight.origin} → {flight.destination}
                  </span>

                  <span style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {new Date(flight.departure_time).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{
                      background: sc.bg,
                      color: sc.color,
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span style={{
                        width: '5px', height: '5px',
                        background: sc.dot,
                        borderRadius: '50%',
                        boxShadow: `0 0 6px ${sc.dot}`
                      }} />
                      {flight.status}
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