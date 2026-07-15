import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { usePolling } from '../hooks/usePolling'
import ResolveModal from './ResolveModal'
import toast from 'react-hot-toast'
import { Bell, BellOff, CheckCircle, Radio, Wifi, Clock, AlertTriangle } from 'lucide-react'

const STATION_ID = 1

export default function AndonBoard({ activeStationId = 1, onAlertsUpdate }) {
  const { user, hasRole } = useAuth()
  const [alerts, setAlerts]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [resolveAlert, setResolveAlert] = useState(null)
  const [sirenOn, setSirenOn]           = useState(true)
  const [lastPollAt, setLastPollAt]     = useState(null)

  const audioRef = useRef(null)
  const prevAlertCount = useRef(0)

  const canResolve = hasRole('ROLE_TEAM_LEADER', 'ROLE_HSE_SPECIALIST', 'ROLE_ADMIN')
  const hasGlobalActiveAlerts = alerts.some(a => !a.resolved)
  const hasLocalActiveAlerts = alerts.some(a => a.stationId === activeStationId && !a.resolved)

  // Toggle siren + unlock audio context on user interaction
  const toggleSiren = () => {
    const nextSirenOn = !sirenOn
    setSirenOn(nextSirenOn)

    if (nextSirenOn) {
      if (!audioRef.current) {
        audioRef.current = new Audio('/siren.mp3')
        audioRef.current.loop = true
      }
      // Play and pause immediately to unlock the media element on the browser
      audioRef.current.play()
        .then(() => {
          if (!hasGlobalActiveAlerts) {
            audioRef.current.pause()
          }
        })
        .catch(error => console.log('Audio context unlock failed or suspended:', error))
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }

  useEffect(() => {
    if (hasGlobalActiveAlerts && sirenOn) {
      if (!audioRef.current) {
        audioRef.current = new Audio('/siren.mp3')
        audioRef.current.loop = true
      }
      audioRef.current.play()
        .catch(err => console.log('Autoplay blocked. Click the sound toggle to enable audio:', err))
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [hasGlobalActiveAlerts, sirenOn])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  // New alert toast
  useEffect(() => {
    const activeCount = alerts.filter(a => !a.resolved).length
    if (activeCount > prevAlertCount.current) {
      toast.error(`🚨 ANDON ALERT! A station exceeded Takt Time!`, {
        duration: 8000,
        style: { background: '#1a0808', border: '1px solid #ef4444', color: '#fca5a5' },
      })
    }
    prevAlertCount.current = activeCount
  }, [alerts])

  const fetchAlerts = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      const { data } = await api.get('/andon')
      const alertsList = Array.isArray(data) ? data : []
      setAlerts(alertsList)
      if (onAlertsUpdate) {
        onAlertsUpdate(alertsList)
      }
      setLastPollAt(new Date())
    } catch (err) {
      // Silently ignore polling errors (user may not have permission)
    } finally {
      setLoading(false)
    }
  }, [user, onAlertsUpdate])

  usePolling(fetchAlerts, 2000, !!user)

  const handleResolved = useCallback(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const activeAlerts   = alerts.filter(a => a.stationId === activeStationId && !a.resolved)
  const resolvedAlerts = alerts.filter(a => a.stationId === activeStationId && a.resolved).slice(0, 3)

  const timeSince = (iso) => {
    if (!iso) return ''
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
    if (diff < 60)   return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`
    return `${Math.floor(diff/3600)}h ago`
  }

  return (
    <div
      className={`flex flex-col gap-5 animate-fade-in rounded-xl p-6 transition-all duration-500 ${
        hasLocalActiveAlerts ? 'animate-flash-red' : 'glass-card'
      }`}
      style={hasLocalActiveAlerts ? { border: '2px solid #ef4444' } : {}}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label mb-1">Real-Time Status</p>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio size={18} color={hasLocalActiveAlerts ? '#ef4444' : '#10b981'} />
            Andon Board
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Siren mute / unlock audio toggle */}
          <button
            onClick={toggleSiren}
            className="tt-btn tt-btn-ghost p-2 flex items-center gap-1.5"
            title={sirenOn ? 'Mute siren' : 'Enable sound / Unmute'}
          >
            {sirenOn ? (
              <>
                <Bell size={16} color="#10b981" />
                <span className="text-xs font-semibold text-green-500">Sound Enabled</span>
              </>
            ) : (
              <>
                <BellOff size={16} color="#6b7280" />
                <span className="text-xs font-semibold text-gray-500">Muted</span>
              </>
            )}
          </button>
          {/* Poll indicator */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-gray-600">
            <Wifi size={12} className={user ? 'text-green-500' : 'text-gray-600'} />
            {lastPollAt ? lastPollAt.toLocaleTimeString() : '—'}
          </div>
        </div>
      </div>

      {/* Main status card */}
      {!user ? (
        <div
          className="rounded-xl p-6 text-center"
          style={{ background: '#0d1117', border: '1px solid #1f2937' }}
        >
          <p className="text-gray-500 text-sm">Login as Team Leader, HSE Specialist, or Admin to view Andon board</p>
        </div>
      ) : loading ? (
        <div className="rounded-xl p-6 text-center text-gray-500 text-sm">
          <span className="animate-spin-slow inline-block mr-2">⚙</span>
          Loading alerts...
        </div>
      ) : (
        <>
          {/* Station status */}
          <div
            className={`rounded-xl p-5 flex items-center gap-5 transition-all duration-500`}
            style={
              hasLocalActiveAlerts
                ? { background: '#1a080844', border: '2px solid #ef444488' }
                : { background: '#001a1244', border: '2px solid #10b98144' }
            }
          >
            {/* Status dot */}
            <div className="relative flex-shrink-0">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center`}
                style={{
                  background: hasLocalActiveAlerts ? '#ef444422' : '#10b98122',
                  border: `3px solid ${hasLocalActiveAlerts ? '#ef4444' : '#10b981'}`,
                  boxShadow: hasLocalActiveAlerts
                    ? '0 0 30px rgba(239,68,68,0.6)'
                    : '0 0 30px rgba(16,185,129,0.4)',
                }}
              >
                {hasLocalActiveAlerts
                  ? <AlertTriangle size={28} color="#ef4444" />
                  : <CheckCircle  size={28} color="#10b981" />
                }
              </div>
              {hasLocalActiveAlerts && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-status-blink"
                  style={{ background: '#ef4444', border: '2px solid #050810' }}
                />
              )}
            </div>

            <div className="flex-1">
              <p className="text-xs text-gray-500 font-mono mb-1">STATION ID: {activeStationId}</p>
              <p
                className={`text-xl font-black tracking-wide ${
                  hasLocalActiveAlerts ? 'animate-status-blink' : ''
                }`}
                style={{ color: hasLocalActiveAlerts ? '#ef4444' : '#10b981' }}
              >
                {hasLocalActiveAlerts ? '⚠ ANDON TRIGGERED' : '✓ LINE STATUS: OK'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {hasLocalActiveAlerts
                  ? `${activeAlerts.length} active alert${activeAlerts.length > 1 ? 's' : ''} — Immediate action required`
                  : 'No bottlenecks detected — Running at takt'
                }
              </p>
            </div>
          </div>

          {/* Active alerts list */}
          {activeAlerts.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="section-label">Active Alerts</p>
              <div className="max-h-80 overflow-y-auto pr-2 flex flex-col gap-3 scrollbar-thin">
                {activeAlerts.map((alert) => {
                  const delta = alert.taktTime
                    ? (alert.totalCycleTime - alert.taktTime).toFixed(1)
                    : null
                  return (
                    <div
                      key={alert.id}
                      className="rounded-lg p-4 flex flex-col gap-3"
                      style={{ background: '#1a080833', border: '1px solid #ef444455' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="text-xs px-2 py-0.5 rounded font-mono font-bold animate-status-blink"
                              style={{ background: '#ef444422', color: '#ef4444' }}
                            >
                              ALERT #{alert.id}
                            </span>
                            <span className="text-xs text-gray-600">
                              <Clock size={10} className="inline mr-1" />
                              {timeSince(alert.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-red-300 font-medium">{alert.message}</p>
                          <div className="flex gap-3 mt-2 flex-wrap">
                            <span className="text-xs text-gray-500">
                              Station #{alert.stationId}
                            </span>
                            <span className="text-xs text-gray-500">
                              Cycle #{alert.cycleNumber}
                            </span>
                            {delta !== null && (
                              <span className="text-xs font-mono font-bold" style={{ color: '#ef4444' }}>
                                +{delta}s over takt
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {canResolve ? (
                        <button
                          onClick={() => setResolveAlert(alert)}
                          className="tt-btn tt-btn-primary w-full text-sm py-2"
                          id={`resolve-btn-${alert.id}`}
                        >
                          <CheckCircle size={15} /> RESOLVE ALERT
                        </button>
                      ) : (
                        <p className="text-xs text-center text-gray-600 py-1">
                          Only Team Leaders / HSE can resolve alerts
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recent resolved */}
          {resolvedAlerts.length > 0 && (
            <div>
              <p className="section-label mb-2">Recently Resolved</p>
              <div className="flex flex-col gap-2">
                {resolvedAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-lg p-3 flex items-center gap-3"
                    style={{ background: '#00120822', border: '1px solid #10b98122' }}
                  >
                    <CheckCircle size={14} color="#10b981" className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 truncate">{alert.message}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Cycle #{alert.cycleNumber} · {timeSince(alert.createdAt)}
                      </p>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded flex-shrink-0"
                      style={{ background: '#10b98122', color: '#10b981' }}
                    >
                      OK
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeAlerts.length === 0 && resolvedAlerts.length === 0 && (
            <div className="text-center text-gray-600 text-xs py-2">
              No alerts on record
            </div>
          )}
        </>
      )}

      {/* Resolve modal */}
      {resolveAlert && (
        <ResolveModal
          alert={resolveAlert}
          onClose={() => setResolveAlert(null)}
          onResolved={handleResolved}
        />
      )}
    </div>
  )
}
