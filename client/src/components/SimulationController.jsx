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
  const [pipelineQueue, setPipelineQueue] = useState([])   // [cycle# at st1, st2, ... st6]
  const [vehiclesCompleted, setVehiclesCompleted] = useState(0)
  const [lineLog, setLineLog]         = useState([])       // global conveyor-level log

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

  // ---------------------------------------------------------------------------
  // Pipeline Conveyor Belt Simulation Engine
  // ---------------------------------------------------------------------------

  /**
   * Process all work elements for a single station on its assigned cycleNumber.
   * Returns { totalMs, stationId } when done.
   */
  const processStation = async (station, cycleNumber) => {
    const stationId = station.id
    const elements = station.workElements || []
    if (elements.length === 0) return { totalMs: 0, stationId }

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
          elProgress: 0,
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

      // Animate progress (10 steps for smoother display)
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
          cycleNumber:    cycleNumber,
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

    return { totalMs: cycleTotalMs, stationId }
  }

  /**
   * Main conveyor belt loop.
   * Maintains a pipeline queue of 6 cycleNumbers — one per station.
   * Each "pulse" starts all stations working in parallel on their assigned vehicles,
   * waits for ALL 6 to finish, then shifts the conveyor belt forward.
   */
  const runConveyorBelt = useCallback(async (sortedStations) => {
    const NUM_STATIONS = sortedStations.length
    if (NUM_STATIONS === 0) return

    // Initialize the pipeline: station 0 gets cycle 1, station 1 gets cycle 0 (not yet assigned), etc.
    // Actually, we ramp up: only station 1 has work initially, then station 1+2, etc.
    // For simplicity and matching real-world startup: fill all 6 slots at once.
    let nextCycle = NUM_STATIONS + 1  // Next free cycle number after initial fill
    let queue = []
    for (let i = 0; i < NUM_STATIONS; i++) {
      // Station 0 (Trim-1) gets the highest cycle, Station 5 (Inspection) gets the lowest
      queue.push(NUM_STATIONS - i)
    }
    // queue = [6, 5, 4, 3, 2, 1] => Station 1 works on Cycle#6, Station 6 works on Cycle#1

    setPipelineQueue([...queue])
    let completed = 0

    // Initialize simStates for all stations
    const initialStates = {}
    sortedStations.forEach((st, idx) => {
      initialStates[st.id] = {
        cycleCount: queue[idx],
        currentEl: null,
        currentElIdx: -1,
        elProgress: 0,
        totalTime: 0,
        logs: [`▶ Station ${st.name} initialized — Vehicle #${queue[idx]} on conveyor`]
      }
    })
    setSimStates(prev => ({ ...prev, ...initialStates }))

    const ts = () => new Date().toLocaleTimeString()

    setLineLog([`[${ts()}] 🏭 Conveyor Belt started — ${NUM_STATIONS} vehicles loaded on line`])

    // Main pulse loop
    while (runningRef.current) {
      // Log current conveyor state
      const queueStr = sortedStations.map((st, i) => `${st.name.split('-')[0]}#${queue[i]}`).join(' → ')
      setLineLog(prev => [`[${ts()}] ━━ CONVEYOR PULSE ━━ ${queueStr}`, ...prev].slice(0, 30))

      // Update cycle numbers for each station in simStates
      sortedStations.forEach((st, idx) => {
        setSimStates(prev => ({
          ...prev,
          [st.id]: {
            ...(prev[st.id] || {}),
            cycleCount: queue[idx],
            logs: [`── Vehicle #${queue[idx]} — processing begins ──`, ...(prev[st.id]?.logs || [])].slice(0, 20)
          }
        }))
      })

      // Launch ALL stations in parallel, each processing its assigned vehicle
      const promises = sortedStations.map((st, idx) =>
        processStation(st, queue[idx])
      )

      const results = await Promise.all(promises)

      if (!runningRef.current) break

      // Log per-station completion times
      results.forEach((res, idx) => {
        const st = sortedStations[idx]
        const totalSec = parseFloat((res.totalMs / 1000).toFixed(1))
        const isOverTakt = totalSec > (st.taktTime || 60)

        setSimStates(prev => ({
          ...prev,
          [st.id]: {
            ...(prev[st.id] || {}),
            currentEl: null,
            currentElIdx: -1,
            elProgress: 0,
            totalTime: totalSec,
            logs: [
              `✓ Vehicle #${queue[idx]} completed — ${totalSec}s ${isOverTakt ? '▲ OVER TAKT' : '✓ OK'}`,
              ...(prev[st.id]?.logs || [])
            ].slice(0, 20)
          }
        }))
      })

      // ===== CONVEYOR BELT SHIFT =====
      // The vehicle at Station 6 (last station = Inspection) exits the factory
      const exitedVehicle = queue[NUM_STATIONS - 1]
      completed++
      setVehiclesCompleted(completed)

      setLineLog(prev => [
        `[${ts()}] 🚗✅ Vehicle #${exitedVehicle} completed VES Quality Inspection and left the factory!`,
        ...prev
      ].slice(0, 30))

      toast.success(`🚗 Vehicle #${exitedVehicle} left the factory!`, {
        duration: 3000,
        style: {
          background: '#064e3b',
          border: '1px solid #10b981',
          color: '#ecfdf5',
          fontSize: '12px',
        }
      })

      // Shift the conveyor: each station receives the vehicle from the previous station
      for (let i = NUM_STATIONS - 1; i > 0; i--) {
        queue[i] = queue[i - 1]
      }
      // A brand-new vehicle enters Station 1
      queue[0] = nextCycle++

      setPipelineQueue([...queue])

      setLineLog(prev => [
        `[${ts()}] ⏩ Conveyor shifted — new Vehicle #${queue[0]} enters ${sortedStations[0].name}`,
        ...prev
      ].slice(0, 30))

      // Short pause between conveyor pulses
      await sleep(600)
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
    setVehiclesCompleted(0)
    setLineLog([])

    toast.success('🏭 Conveyor Belt Pipeline started — 6 vehicles on the line!', { icon: '⚡' })

    // Trigger conveyor belt simulation
    runConveyorBelt(stations)
  }

  const stopSimulation = () => {
    runningRef.current = false
    setRunning(false)
    toast('⏹ Conveyor Belt simulation stopped', { icon: '🛑' })
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
            Conveyor Belt Pipeline
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

      {/* Conveyor Pipeline Visual */}
      {running && pipelineQueue.length > 0 && (
        <div
          className="rounded-xl p-3 border animate-fade-in"
          style={{ background: '#060c1a', borderColor: '#1e3a5f66' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
              <Layers size={12} /> CONVEYOR BELT STATE
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              {vehiclesCompleted} vehicles completed
            </span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {stations.map((st, idx) => (
              <div key={st.id} className="flex items-center gap-1 flex-shrink-0">
                <div
                  className="rounded-lg px-2 py-1.5 text-center min-w-[80px] transition-all"
                  style={{
                    background: activeStationId === st.id ? '#00d4aa18' : '#0d1117',
                    border: `1px solid ${activeStationId === st.id ? '#00d4aa44' : '#1f293766'}`,
                  }}
                >
                  <p className="text-[8px] text-gray-500 font-mono truncate">{st.name}</p>
                  <p className="text-sm font-black font-mono" style={{ color: '#00d4aa' }}>
                    #{pipelineQueue[idx]}
                  </p>
                </div>
                {idx < stations.length - 1 && (
                  <ChevronRight size={12} className="text-gray-700 flex-shrink-0" />
                )}
              </div>
            ))}
            <div className="flex items-center gap-1 flex-shrink-0 ml-1">
              <ChevronRight size={12} className="text-emerald-600" />
              <div className="rounded-lg px-2 py-1.5 text-center min-w-[50px]"
                style={{ background: '#064e3b33', border: '1px solid #10b98144' }}>
                <p className="text-[8px] text-emerald-500 font-mono">EXIT</p>
                <p className="text-xs font-bold text-emerald-400">🚗</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <p className="section-label mb-1">Vehicle #</p>
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
            <Play size={16} fill="currentColor" /> Start Conveyor Belt
          </button>
        ) : (
          <button
            onClick={stopSimulation}
            className="tt-btn tt-btn-danger flex-1"
            id="sim-stop-btn"
          >
            <Square size={16} fill="currentColor" /> Stop Line
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

      {/* Conveyor Line Log */}
      {lineLog.length > 0 && (
        <div>
          <p className="section-label mb-2">Conveyor Belt Log</p>
          <div
            className="rounded-lg p-3 h-28 overflow-y-auto flex flex-col gap-0.5"
            style={{ background: '#050810', border: '1px solid #1e3a5f44' }}
          >
            {lineLog.map((logLine, i) => (
              <div key={i} className="text-[11px] font-mono" style={{
                color: logLine.includes('✅') ? '#10b981' : logLine.includes('PULSE') ? '#60a5fa' : logLine.includes('⏩') ? '#a78bfa' : '#6b7280'
              }}>
                {logLine}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Station Activity log */}
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
