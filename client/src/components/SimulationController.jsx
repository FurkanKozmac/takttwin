import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import {
  Play, Square, Zap, AlertTriangle, Activity,
  ChevronRight, Clock, Layers
} from 'lucide-react'

const SPEED_FACTOR = 10   // real-time ÷ 10
const MURI_EXTRA_MIN = 5000
const MURI_EXTRA_MAX = 10000

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function randBetween(min, max) {
  return Math.random() * (max - min) + min
}

export default function SimulationController({ activeStationId, running, setRunning, muri, setMuri, simStates, setSimStates, activeOrder }) {
  const { user } = useAuth()
  const [stations, setStations]       = useState([])
  const [cordBounce, setCordBounce]   = useState(false)
  
  const runningRef   = useRef(false)
  const muriRef      = useRef(false)

  // Auto-stop simulation when production order is completed
  useEffect(() => {
    if (activeOrder && activeOrder.status === 'COMPLETED' && running) {
      runningRef.current = false
      setRunning(false)
      toast.success(`Production Order ${activeOrder.orderNumber} Completed Successfully!`, {
        duration: 8000,
        icon: '🎉',
        style: {
          border: '1px solid #10b981',
          background: '#064e3b',
          color: '#ecfdf5',
          fontWeight: 'bold',
        }
      })
    }
  }, [activeOrder, running])

  // Keep refs in sync
  useEffect(() => { runningRef.current = running }, [running])
  useEffect(() => { muriRef.current = muri }, [muri])

  // Load all stations with elements
  const fetchAllStations = async () => {
    try {
      const { data } = await api.get('/stations')
      setStations(data.sort((a, b) => a.id - b.id))
    } catch (err) {
      // Stations may not exist yet
    }
  }

  useEffect(() => {
    if (!user) {
      setStations([]);
      return;
    }
    fetchAllStations()
    const interval = setInterval(fetchAllStations, 5000)
    return () => clearInterval(interval)
  }, [user])

  // Async simulation runner for a single station
  const runStationSimulation = useCallback(async (station) => {
    const stationId = station.id
    const elements = station.workElements || []
    if (elements.length === 0) return

    let cycle = 0
    // Set initial simulation state for this station
    setSimStates(prev => ({
      ...prev,
      [stationId]: {
        cycleCount: 0,
        currentEl: null,
        currentElIdx: -1,
        elProgress: 0,
        totalTime: 0,
        logs: [`▶ Station ${station.name} simulation initialized`]
      }
    }))

    while (runningRef.current) {
      cycle++
      
      // Update cycle count
      setSimStates(prev => ({
        ...prev,
        [stationId]: {
          ...(prev[stationId] || {}),
          cycleCount: cycle,
          logs: [`── Cycle #${cycle} begins ──`, ...(prev[stationId]?.logs || [])].slice(0, 20)
        }
      }))

      let cycleTotalMs = 0

      for (let i = 0; i < elements.length; i++) {
        if (!runningRef.current) break

        const el = elements[i]
        
        // Update active element status
        setSimStates(prev => ({
          ...prev,
          [stationId]: {
            ...(prev[stationId] || {}),
            currentEl: el,
            currentElIdx: i,
            elProgress: 0
          }
        }))

        const humanFactor = randBetween(-1500, 1500)
        const muriExtra   = muriRef.current ? randBetween(MURI_EXTRA_MIN, MURI_EXTRA_MAX) : 0
        const actualMs    = Math.max(500, (el.standardDuration * 1000 + humanFactor + muriExtra))
        const waitMs      = actualMs / SPEED_FACTOR
        const actualSec   = actualMs / 1000

        // Log element details
        setSimStates(prev => ({
          ...prev,
          [stationId]: {
            ...(prev[stationId] || {}),
            logs: [`  ↳ ${el.name}: ${actualSec.toFixed(1)}s${muriRef.current ? ' ⚠ +muri' : ''}`, ...(prev[stationId]?.logs || [])].slice(0, 20)
          }
        }))

        // Animate progress (10 steps for smoother parallel runs)
        const steps = 10
        for (let s = 0; s <= steps; s++) {
          if (!runningRef.current) break
          setSimStates(prev => ({
            ...prev,
            [stationId]: {
              ...(prev[stationId] || {}),
              elProgress: Math.round((s / steps) * 100)
            }
          }))
          await sleep(waitMs / steps)
        }

        cycleTotalMs += actualMs

        if (!runningRef.current) break

        // Post telemetry
        try {
          await api.post('/telemetry', {
            stationId:      stationId,
            workElementId:  el.id,
            actualDuration: parseFloat(actualSec.toFixed(2)),
            cycleNumber:    cycle,
          })
        } catch (err) {
          setSimStates(prev => ({
            ...prev,
            [stationId]: {
              ...(prev[stationId] || {}),
              logs: [`  ✗ Telemetry error: ${err.response?.data?.message || err.message}`, ...(prev[stationId]?.logs || [])].slice(0, 20)
            }
          }))
        }
      }

      if (!runningRef.current) break

      const totalSec = parseFloat((cycleTotalMs / 1000).toFixed(1))
      const isOverTakt = totalSec > (station.taktTime || 60)

      // Cycle completion update
      setSimStates(prev => ({
        ...prev,
        [stationId]: {
          ...(prev[stationId] || {}),
          currentEl: null,
          currentElIdx: -1,
          elProgress: 0,
          totalTime: totalSec,
          logs: [
            `✓ Cycle #${cycle} completed — total ${totalSec}s ${isOverTakt ? '▲ OVER TAKT' : '✓ OK'}`,
            ...(prev[stationId]?.logs || [])
          ].slice(0, 20)
        }
      }))

      // Short break before starting next cycle
      await sleep(500)
    }
  }, [])

  const runSimulation = async () => {
    if (stations.length === 0) {
      toast.error('No stations found. Create or seed database first.', { duration: 4000 })
      return
    }
    if (!user) {
      toast.error('Please log in as Operator first.')
      return
    }

    setRunning(true)
    runningRef.current = true

    toast.success('▶ Parallel simulation started for all 6 stations!', { icon: '⚡' })

    // Trigger simulation for all 6 stations in parallel
    stations.forEach(st => {
      runStationSimulation(st)
    })
  }

  const stopSimulation = () => {
    runningRef.current = false
    setRunning(false)
    toast('⏹ Parallel simulation stopped', { icon: '🛑' })
  }

  const triggerAndonCord = async () => {
    if (!user) return toast.error('Log in first')
    setCordBounce(true)
    setTimeout(() => setCordBounce(false), 500)

    const activeStation = stations.find(s => s.id === activeStationId)
    if (!activeStation) return toast.error('Selected station not found')

    toast.loading(`Pulling Andon cord for ${activeStation.name}...`, { id: 'andon-cord' })
    try {
      const el = activeStation.workElements?.[0]
      if (!el) throw new Error('No elements defined yet for this station')

      await api.post('/telemetry', {
        stationId:      activeStationId,
        workElementId:  el.id,
        actualDuration: 999.0,
        cycleNumber:    9999,
      })
      toast.success(`🚨 ANDON CORD PULLED — Alert triggered for ${activeStation.name}!`, { id: 'andon-cord', duration: 4000 })
    } catch (err) {
      toast.error(`Andon cord failed: ${err.response?.data?.message || err.message}`, { id: 'andon-cord' })
    }
  }

  // Active selected station data for UI display
  const activeStation = stations.find(s => s.id === activeStationId)
  const activeSim = simStates[activeStationId] || {
    cycleCount: 0,
    currentEl: null,
    currentElIdx: -1,
    elProgress: 0,
    totalTime: 0,
    logs: []
  }

  const logColor = { info: '#9ca3af', success: '#10b981', warning: '#f59e0b', error: '#ef4444' }
  const taktTime = activeStation?.taktTime || 60
  const overTakt = activeSim.totalTime > taktTime

  return (
    <div className="glass-card p-6 flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label mb-1">Gemba Simulation</p>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity size={18} color="#00d4aa" />
            Parallel Simulation
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-gray-500">ACTIVE:</span>
          <span
            className="px-2 py-1 rounded font-bold"
            style={{ background: '#00d4aa22', color: '#00d4aa', border: '1px solid #00d4aa44' }}
          >
            {activeStation?.name || `ID: ${activeStationId}`}
          </span>
        </div>
      </div>

      {/* Station info */}
      {activeStation ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <p className="section-label mb-1">Takt Time</p>
            <p className="text-xl font-bold font-mono text-white">{taktTime}s</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <p className="section-label mb-1">Elements</p>
            <p className="text-xl font-bold font-mono text-white">{activeStation.workElements?.length || 0}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <p className="section-label mb-1">Cycle #</p>
            <p className="text-xl font-bold font-mono" style={{ color: '#00d4aa' }}>{activeSim.cycleCount}</p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg p-4 text-center text-gray-500 text-sm">
          ⚠ Selected station not found
        </div>
      )}

      {/* Current element progress */}
      {running && activeSim.currentEl && (
        <div
          className="rounded-lg p-3 border animate-fade-in"
          style={{ background: '#001a12', borderColor: '#00d4aa33' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-gray-400 flex items-center gap-2">
              <span className="animate-status-blink" style={{ color: '#00d4aa' }}>●</span>
              ACTIVE ELEMENT
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{ background: '#00d4aa22', color: '#00d4aa' }}
            >
              {activeSim.currentEl.workType}
            </span>
          </div>
          <p className="text-white font-semibold text-sm mb-2">{activeSim.currentEl.name}</p>
          <div className="tt-progress">
            <div className="tt-progress-bar" style={{ width: `${activeSim.elProgress}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              Element {activeSim.currentElIdx + 1}/{activeStation?.workElements?.length || 0}
            </span>
            <span className="text-xs font-mono" style={{ color: muri ? '#f59e0b' : '#00d4aa' }}>
              {activeSim.elProgress}%
            </span>
          </div>
        </div>
      )}

      {/* Last cycle time */}
      {activeSim.totalTime > 0 && (
        <div
          className="rounded-lg p-3 flex items-center justify-between"
          style={{
            background: overTakt ? '#1a080822' : '#00120822',
            border: `1px solid ${overTakt ? '#ef444444' : '#10b98133'}`
          }}
        >
          <span className="text-xs text-gray-400 flex items-center gap-2">
            <Clock size={14} />
            Last Cycle Duration
          </span>
          <span className="font-mono font-bold text-sm" style={{ color: overTakt ? '#ef4444' : '#10b981' }}>
            {activeSim.totalTime}s {overTakt ? '▲ OVER TAKT' : '✓ OK'}
          </span>
        </div>
      )}

      {/* Controls row */}
      <div className="flex items-center gap-3">
        {!running ? (
          <button
            onClick={runSimulation}
            disabled={!user || stations.length === 0}
            className="tt-btn tt-btn-primary flex-1 animate-pulse-green"
            id="sim-start-btn"
          >
            <Play size={16} fill="currentColor" /> Start Parallel Simulation
          </button>
        ) : (
          <button
            onClick={stopSimulation}
            className="tt-btn tt-btn-danger flex-1"
            id="sim-stop-btn"
          >
            <Square size={16} fill="currentColor" /> Stop
          </button>
        )}
      </div>

      {/* Muri toggle */}
      <div
        className="rounded-xl p-4 flex items-center justify-between"
        style={{
          background: muri ? '#1a08081a' : '#0d1117',
          border: `1px solid ${muri ? '#ef444466' : '#1f2937'}`
        }}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle size={18} color={muri ? '#ef4444' : '#6b7280'} />
          <div>
            <p className="text-sm font-semibold" style={{ color: muri ? '#ef4444' : '#d1d5db' }}>
              Trigger Bottleneck (Muri)
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Adds 5–10s delay to exceed Takt Time globally
            </p>
          </div>
        </div>
        <label className="tt-toggle" id="muri-toggle">
          <input type="checkbox" checked={muri} onChange={e => setMuri(e.target.checked)} />
          <span className="tt-toggle-slider" />
        </label>
      </div>

      {/* Andon cord */}
      <div className="flex flex-col items-center gap-3 py-2">
        <p className="section-label">Emergency Stop ({activeStation?.name})</p>
        <div className="flex flex-col items-center gap-2">
          {/* Cord rope visual */}
          <div className="flex flex-col items-center gap-0">
            <div className="w-0.5 h-8 bg-gray-600 rounded" />
            <div className="w-1 h-1 rounded-full bg-gray-500" />
            <div className="w-0.5 h-4 bg-gray-600 rounded" />
          </div>
          <button
            onClick={triggerAndonCord}
            disabled={!user}
            className={`andon-cord-btn flex items-center justify-center ${cordBounce ? 'animate-bounce-cord' : ''}`}
            id="andon-cord-btn"
            title={`Pull Andon Cord for ${activeStation?.name}`}
          >
            <span className="text-white font-black text-xs leading-tight text-center">
              ANDON<br/>CORD
            </span>
          </button>
        </div>
        <p className="text-xs text-gray-600 text-center">
          Pull to instantly trigger alert<br/>for the active station
        </p>
      </div>

      {/* Activity log */}
      <div>
        <p className="section-label mb-2">Activity Log ({activeStation?.name})</p>
        <div
          className="rounded-lg p-3 h-36 overflow-y-auto flex flex-col gap-0.5"
          style={{ background: '#050810', border: '1px solid #1f2937' }}
        >
          {activeSim.logs.length === 0 ? (
            <p className="text-xs text-gray-600 text-center mt-4">No activity yet...</p>
          ) : activeSim.logs.map((logLine, i) => (
            <div key={i} className="flex items-start gap-2 text-xs font-mono">
              <span className="text-gray-600 flex-shrink-0">
                {new Date().toLocaleTimeString()}
              </span>
              <span style={{ color: logColor[logLine.includes('✓') ? 'success' : logLine.includes('⚠') || logLine.includes('▲') ? 'warning' : logLine.includes('✗') ? 'error' : 'info'] }}>
                {logLine}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
