import { Toaster, toast } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPanel from './components/AuthPanel'
import SimulationController from './components/SimulationController'
import AndonBoard from './components/AndonBoard'
import StationInspector from './components/StationInspector'
import AdminSetup from './components/AdminSetup'
import AssemblyLineFlowchart from './components/AssemblyLineFlowchart'
import ErrorBoundary from './components/ErrorBoundary'
import TraceabilityPanel from './components/TraceabilityPanel'
import AlarmHistoryPanel from './components/AlarmHistoryPanel'
import InventoryPanel from './components/InventoryPanel'
import api from './api/axios'
import { Activity, Factory, Shield, Wifi, Clock, Gauge, Heart, ShieldAlert, Settings, ChevronRight, Layers, Search } from 'lucide-react'
import { useState, useEffect } from 'react'

function Header() {
  const { user } = useAuth()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const roleColors = {
    ROLE_ADMIN:          '#4a90d9',
    ROLE_TEAM_LEADER:    '#f59e0b',
    ROLE_OPERATOR:       '#10b981',
    ROLE_HSE_SPECIALIST: '#a78bfa',
  }
  const roleColor = roleColors[user?.role] || '#6b7280'

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #00d4aa22, #10b98133)',
              border: '1px solid #00d4aa44',
            }}
          >
            <Factory size={20} color="#00d4aa" />
          </div>
          <div>
            <h1
              className="text-xl font-black tracking-tight"
              style={{
                background: 'linear-gradient(90deg, #00d4aa, #4a90d9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              TaktTwin
            </h1>
            <p className="text-xs text-gray-600 leading-none font-mono">
              Digital Twin · Industrial MES
            </p>
          </div>
        </div>

        {/* Center status */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs">
            <Activity size={12} color="#00d4aa" />
            <span className="text-gray-400">Station TRIM-1</span>
            <span
              className="px-2 py-0.5 rounded text-xs font-mono font-bold"
              style={{ background: '#00d4aa22', color: '#00d4aa', border: '1px solid #00d4aa33' }}
            >
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Wifi size={12} color="#10b981" />
            <span className="text-gray-400">Backend</span>
            <span
              className="px-2 py-0.5 rounded text-xs font-mono"
              style={{ background: '#10b98122', color: '#10b981' }}
            >
              :8080
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Clock */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-gray-500">
            <Clock size={12} />
            <span>{time.toLocaleTimeString()}</span>
          </div>

          {/* User badge */}
          {user && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: `${roleColor}18`,
                border: `1px solid ${roleColor}44`,
              }}
            >
              <Shield size={12} style={{ color: roleColor }} />
              <span className="font-semibold" style={{ color: roleColor }}>
                {user.role.replace('ROLE_', '')}
              </span>
              <span className="text-gray-500 hidden sm:inline">
                {user.email.split('@')[0]}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
function Dashboard() {
  const { user } = useAuth()
  const [activeStationId, setActiveStationId] = useState(1)
  const [stations, setStations] = useState([])
  const [alerts, setAlerts] = useState([])

  // Active Production Order state
  const [activeOrder, setActiveOrder] = useState(null)
  const [oeeData, setOeeData] = useState(null)

  // Lifted simulation states
  const [running, setRunning]         = useState(false)
  const [muri, setMuri]               = useState(false)
  const [simStates, setSimStates]     = useState({})
  const [pipelineQueue, setPipelineQueue] = useState([])
  const [vehiclesCompleted, setVehiclesCompleted] = useState(0)
  const [lineLog, setLineLog]         = useState([])

  // Tab navigation state
  const [activeTab, setActiveTab]     = useState('orders')

  useEffect(() => {
    const handler = () => {
      setRunning(false)
    }
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  const loadStations = async () => {
    try {
      const { data } = await api.get('/stations')
      setStations(data.sort((a, b) => a.id - b.id))
    } catch (err) {}
  }

  const loadActiveOrder = async () => {
    try {
      const { data } = await api.get('/orders/active')
      setActiveOrder(data)
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setActiveOrder(null)
      }
    }
  }

  const loadOeeData = async () => {
    try {
      const { data } = await api.get('/orders/active/oee')
      setOeeData(data)
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setOeeData(null)
      }
    }
  }

  useEffect(() => {
    if (!user) {
      setStations([]);
      setRunning(false);
      setSimStates({});
      setActiveOrder(null);
      setOeeData(null);
      setActiveTab('orders');
      return;
    } else {
      setActiveTab('dashboard');
    }
    loadStations()
    loadActiveOrder()
    loadOeeData()
  }, [user])

  useEffect(() => {
    if (!user) return

    const sseUrl = 'http://localhost:8080/api/sse/subscribe'
    const eventSource = new EventSource(sseUrl)

    eventSource.onopen = () => {
      console.log('SSE connection established successfully')
    }

    eventSource.addEventListener('telemetry', (e) => {
      console.log('SSE telemetry event received:', e.data)
      try {
        // Trigger Yamazumi chart refresh
        window.dispatchEvent(new CustomEvent('yamazumi-refresh'))
        // Trigger OEE refresh to update gauges/KPIs
        loadOeeData()
      } catch (err) {
        console.error('Error handling SSE telemetry event:', err)
      }
    })

    eventSource.addEventListener('andon', (e) => {
      console.log('SSE andon event received:', e.data)
      try {
        // Trigger Andon Board alert list refresh
        window.dispatchEvent(new CustomEvent('andon-refresh'))
        // Refresh OEE data to decay OEE score instantly
        loadOeeData()
      } catch (err) {
        console.error('Error handling SSE andon event:', err)
      }
    })

    eventSource.addEventListener('order-update', (e) => {
      console.log('SSE order-update event received:', e.data)
      try {
        const updatedOrder = JSON.parse(e.data)
        setActiveOrder((prevOrder) => {
          // If completed quantity changed, show a success toast!
          if (prevOrder && updatedOrder.completedQuantity > prevOrder.completedQuantity) {
            toast.success(`Vehicle completed! Completed: ${updatedOrder.completedQuantity}/${updatedOrder.targetQuantity}`, {
              icon: '🚗',
              style: { background: '#0b1329', border: '1px solid #10b981', color: '#a7f3d0' }
            })
          }
          return updatedOrder
        })
        // Refresh OEE data
        loadOeeData()
      } catch (err) {
        console.error('Error handling SSE order-update event:', err)
      }
    })

    eventSource.addEventListener('material-update', (e) => {
      console.log('SSE material-update event received:', e.data)
      try {
        window.dispatchEvent(new CustomEvent('material-refresh', { detail: JSON.parse(e.data) }))
      } catch (err) {
        console.error('Error handling SSE material-update event:', err)
      }
    })

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err)
    }

    return () => {
      eventSource.close()
      console.log('SSE connection closed')
    }
  }, [user])

  // KPI Calculations
  const calculateOee = () => {
    if (!running) return '92.4%'
    if (muri) {
      return (86.5 + Math.sin(Date.now() / 4000) * 1.1).toFixed(1) + '%'
    }
    return (94.1 + Math.sin(Date.now() / 6000) * 0.5).toFixed(1) + '%'
  }

  const getProductionCount = () => {
    // In conveyor belt mode, the number of completed vehicles is tracked by how many
    // conveyor pulses have occurred. Station 6 (Inspection) cycle count tells us the
    // latest vehicle being inspected; vehicles completed = highest station-1 cycle - initial offset.
    // Simplest: count how many pulses happened = (station1 cycleCount - NUM_STATIONS)
    const stationIds = Object.keys(simStates).map(Number).sort((a, b) => a - b)
    if (stationIds.length === 0) return 0
    const firstStation = stationIds[0]
    const firstCycle = simStates[firstStation]?.cycleCount || 0
    // First station starts at NUM_STATIONS (6), so vehicles completed = firstCycle - 6
    const numStations = stationIds.length || 6
    return Math.max(0, firstCycle - numStations)
  }

  const getActiveAnomaliesCount = () => {
    return alerts.filter(a => !a.resolved).length
  }

  const getLineHealth = () => {
    const activeCount = getActiveAnomaliesCount()
    if (activeCount === 0) return '100%'
    if (activeCount === 1) return '85%'
    return '70%'
  }

  return (
    <div
      className="min-h-screen bg-grid"
      style={{ background: 'var(--bg-base)' }}
    >
      <Header />

      <main className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-6 flex flex-col gap-6">
        {/* Page title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div
                className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider"
                style={{
                  background: '#00d4aa15',
                  color: '#00d4aa',
                  border: '1px solid #00d4aa33',
                }}
              >
                ● LIVE MONITOR
              </div>
              <span className="text-slate-500 text-xs font-mono">
                Industrial Digital Twin MES v2.5
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-wide">
              Production Digital Twin Dashboard
            </h2>
            <p className="text-slate-400 text-xs mt-0.5 font-medium">
              Real-time line balancing, active operator twin telemetry, and conveyor belt queue simulator
            </p>
          </div>
        </div>

        {/* Completed Order Banner */}
        {activeOrder && activeOrder.status === 'COMPLETED' && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-4 flex items-center justify-between animate-fade-in shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Production Order Completed</h4>
                <p className="text-xs text-emerald-400 font-medium mt-0.5">
                  Production Order <span className="font-mono font-bold text-white">{activeOrder.orderNumber}</span> completed successfully! All units processed and checked.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid: Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-6 flex-1 items-start">
          
          {/* LEFT SIDEBAR NAVIGATION MENU */}
          <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-1.5 bg-slate-900 p-3 rounded border border-slate-800 shadow-md">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1 font-mono">Navigation</p>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Gauge, show: !!user },
              { id: 'simulator', label: 'Gemba Simulator', icon: Activity, show: !!user },
              { id: 'traceability', label: 'Traceability', icon: Search, show: !!user },
              { id: 'inventory', label: 'Inventory', icon: Layers, show: !!user },
              { id: 'alarmHistory', label: 'Alarm History', icon: ShieldAlert, show: user && (user.role === 'ROLE_TEAM_LEADER' || user.role === 'ROLE_HSE_SPECIALIST') },
              { id: 'config', label: 'Configuration', icon: Settings, show: !!user },
              { id: 'orders', label: 'Security & Orders', icon: Shield, show: true },
            ].filter(tab => tab.show).map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer text-left border ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 hover:border-slate-800 border-transparent'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* RIGHT MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col gap-6 min-w-0 w-full">
            
            {/* 1. DASHBOARD VIEW */}
            {activeTab === 'dashboard' && user && (
              <div className="flex flex-col gap-6 animate-fade-in w-full">
                
                {/* 5 Sleek KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  
                  {/* OEE */}
                  <div className="bg-slate-900 p-5 rounded border border-slate-800 relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-200 shadow-md">
                    <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-cyan-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-mono">Overall OEE</p>
                        <p className="text-2xl font-black text-white font-mono mt-1.5">{oeeData ? `${oeeData.oeePercentage}%` : '0.0%'}</p>
                        <p className="text-[9px] text-cyan-400 mt-1 flex items-center gap-1">
                          A:{oeeData ? oeeData.availability : 0}% | P:{oeeData ? oeeData.performance : 0}% | Q:{oeeData ? oeeData.quality : 0}%
                        </p>
                      </div>
                      <div className="bg-slate-950 p-1 rounded border border-slate-800 text-cyan-400">
                        <div className="relative flex items-center justify-center w-12 h-12">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="24"
                              cy="24"
                              r="18"
                              className="text-slate-800"
                              strokeWidth="3"
                              stroke="currentColor"
                              fill="transparent"
                            />
                            <circle
                              cx="24"
                              cy="24"
                              r="18"
                              className="text-cyan-400"
                              strokeWidth="3"
                              strokeDasharray={2 * Math.PI * 18}
                              strokeDashoffset={2 * Math.PI * 18 * (1 - (oeeData ? oeeData.oeePercentage : 0.0) / 100)}
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="transparent"
                            />
                          </svg>
                          <span className="absolute text-[8px] font-bold text-white font-mono">
                            {oeeData ? oeeData.oeePercentage : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Throughput */}
                  <div className="bg-slate-900 p-5 rounded border border-slate-800 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-200 shadow-md">
                    <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-emerald-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-mono">Total Throughput</p>
                        <p className="text-2xl font-black text-white font-mono mt-1.5">{oeeData ? oeeData.totalCompletedUnits : 0} <span className="text-xs text-slate-500 font-normal">units</span></p>
                        <p className="text-[9px] text-emerald-400 mt-1 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Running Cycles
                        </p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded border border-slate-800 text-emerald-400">
                        <Activity size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Active Alerts */}
                  <div className="bg-slate-900 p-5 rounded border border-slate-800 relative overflow-hidden group hover:border-rose-500/30 transition-all duration-200 shadow-md">
                    <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-rose-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-mono">Active Alerts</p>
                        <p className="text-2xl font-black text-white font-mono mt-1.5">{oeeData ? oeeData.activeAlertCount : 0}</p>
                        <div className="text-[9px] text-rose-500 mt-1 flex flex-col gap-0.5 w-full">
                          <span className="flex items-center gap-1">
                            <span className={`h-1.5 w-1.5 rounded-full ${(oeeData?.activeAlertCount || 0) > 0 ? 'bg-rose-500 animate-ping' : 'bg-slate-500'}`} /> 
                            {(oeeData?.activeAlertCount || 0) > 0 ? 'Action Required' : 'Line Secured'}
                          </span>
                          <span className="text-slate-400 font-mono mt-0.5 block">
                            Downtime: {oeeData ? Math.round(oeeData.totalDowntimeSeconds) : 0}s
                          </span>
                        </div>
                      </div>
                      <div className={`p-3 rounded border transition-colors bg-slate-950 border-slate-800 ${(oeeData?.activeAlertCount || 0) > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                        <ShieldAlert size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Line Health */}
                  <div className="bg-slate-900 p-5 rounded border border-slate-800 relative overflow-hidden group hover:border-violet-500/30 transition-all duration-200 shadow-md">
                    <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-violet-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-mono">Line Health</p>
                        <p className="text-2xl font-black text-white font-mono mt-1.5">{oeeData ? `${oeeData.lineHealth}%` : '100%'}</p>
                        <p className="text-[9px] text-violet-400 mt-1 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" /> Stability Index
                        </p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded border border-slate-800 text-violet-400">
                        <Heart size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Active Production Order */}
                  <div className="bg-slate-900 p-5 rounded border border-slate-800 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-200 shadow-md">
                    <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-emerald-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                    {activeOrder ? (
                      <div className="flex flex-col gap-2 h-full justify-between">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-mono">Active Order</p>
                            <p className="text-sm font-black text-white font-mono mt-0.5">{activeOrder.orderNumber}</p>
                          </div>
                          <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold bg-emerald-500/10 text-emerald-400">
                            {activeOrder.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-mono">Model: {activeOrder.productModel}</p>
                          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
                            <span>Progress</span>
                            <span className="font-bold text-emerald-400">
                              {activeOrder.completedQuantity}/{activeOrder.targetQuantity} ({activeOrder.targetQuantity > 0 ? Math.round((activeOrder.completedQuantity / activeOrder.targetQuantity) * 100) : 0}%)
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mt-1">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, activeOrder.targetQuantity > 0 ? (activeOrder.completedQuantity / activeOrder.targetQuantity) * 100 : 0)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-2 text-center h-full">
                        <p className="text-xs font-bold text-slate-500 font-mono">No Active Order</p>
                        <p className="text-[9px] text-slate-600 mt-1 max-w-[150px] leading-relaxed">
                          Activate a pending order in the Security & Orders tab to begin tracking.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Flowchart Panel (Full Width) */}
                {stations.length > 0 && (
                  <AssemblyLineFlowchart
                    stations={stations}
                    activeStationId={activeStationId}
                    onSelectStation={setActiveStationId}
                    alerts={alerts}
                  />
                )}

                {/* Conveyor Pipeline Visual (Dashboard Tab) */}
                {running && pipelineQueue.length > 0 && (
                  <div className="bg-slate-900 p-4 rounded border border-slate-800 shadow-md w-full animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
                        <Layers size={14} /> CONVEYOR BELT STATE
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                        {vehiclesCompleted} vehicles completed
                      </span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
                      {stations.map((st, idx) => (
                        <div key={st.id} className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => setActiveStationId(st.id)}
                            className={`rounded p-3 text-center min-w-[110px] border transition-all cursor-pointer ${
                              activeStationId === st.id 
                                ? 'bg-slate-800 border-emerald-500 text-emerald-400' 
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <p className="text-[9px] text-slate-500 font-mono truncate">{st.name}</p>
                            <p className="text-sm font-black font-mono mt-1">
                              {pipelineQueue[idx] ? `Vehicle #${pipelineQueue[idx]}` : 'Idle'}
                            </p>
                          </button>
                          {idx < stations.length - 1 && (
                            <ChevronRight size={14} className="text-slate-700 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <ChevronRight size={14} className="text-emerald-600" />
                        <div className="rounded p-3 text-center min-w-[70px] bg-emerald-500/10 border border-emerald-500/30">
                          <p className="text-[9px] text-emerald-400 font-mono font-bold">EXIT LANE</p>
                          <p className="text-sm font-bold text-emerald-400 mt-1">🚗 PASS</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main layout: Andon Board + Station Inspector */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
                  <div className="xl:col-span-4 flex flex-col gap-6">
                    <AndonBoard
                      activeStationId={activeStationId}
                      onAlertsUpdate={setAlerts}
                    />
                  </div>
                  <div className="xl:col-span-8 flex flex-col gap-6">
                    <StationInspector 
                      activeStationId={activeStationId}
                      station={stations.find(s => s.id === activeStationId)}
                      activeSim={simStates[activeStationId]}
                      alerts={alerts}
                      running={running}
                      activeOrder={activeOrder}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. GEMBA SIMULATOR VIEW */}
            {activeTab === 'simulator' && user && (
              <div className="animate-fade-in w-full">
                <SimulationController 
                  activeStationId={activeStationId}
                  running={running}
                  setRunning={setRunning}
                  muri={muri}
                  setMuri={setMuri}
                  simStates={simStates}
                  setSimStates={setSimStates}
                  activeOrder={activeOrder}
                  pipelineQueue={pipelineQueue}
                  setPipelineQueue={setPipelineQueue}
                  vehiclesCompleted={vehiclesCompleted}
                  setVehiclesCompleted={setVehiclesCompleted}
                  lineLog={lineLog}
                  setLineLog={setLineLog}
                  alerts={alerts}
                />
              </div>
            )}

            {/* 5. TRACEABILITY VIEW */}
            {activeTab === 'traceability' && user && (
              <div className="animate-fade-in w-full">
                <TraceabilityPanel />
              </div>
            )}

            {/* JIT INVENTORY VIEW */}
            {activeTab === 'inventory' && user && (
              <div className="animate-fade-in w-full">
                <InventoryPanel />
              </div>
            )}

            {/* 6. ALARM HISTORY VIEW */}
            {activeTab === 'alarmHistory' && user && (
              <div className="animate-fade-in w-full">
                <AlarmHistoryPanel />
              </div>
            )}

            {/* 3. CONFIGURATION VIEW */}
            {activeTab === 'config' && user && (
              <div className="animate-fade-in w-full">
                <AdminSetup showConfigOnly={true} />
              </div>
            )}

            {/* 4. SECURITY & ORDERS VIEW */}
            {activeTab === 'orders' && (
              <div className="animate-fade-in flex flex-col gap-6 w-full">
                <AuthPanel />
                {user && (
                  <AdminSetup showOrdersOnly={true} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-6 pt-6 border-t border-slate-900 text-center">
          <p className="text-xs text-slate-700 font-mono">
            TaktTwin MES · Spring Boot 4.1.0 + React 19 · Real-time Industrial Dashboard
          </p>
        </footer>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        gutter={8}
        containerStyle={{
          top: 20,
          right: 20,
          bottom: 20,
          left: 20,
        }}
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
            borderRadius: '10px',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s ease-in-out',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#111827' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#111827' },
            style: {
              background: '#1a0808',
              border: '1px solid #ef444466',
              color: '#fca5a5',
            },
          },
        }}
      />
      <ErrorBoundary>
        <Dashboard />
      </ErrorBoundary>
    </AuthProvider>
  )
}
