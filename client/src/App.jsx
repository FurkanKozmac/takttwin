import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPanel from './components/AuthPanel'
import SimulationController from './components/SimulationController'
import AndonBoard from './components/AndonBoard'
import StationInspector from './components/StationInspector'
import AdminSetup from './components/AdminSetup'
import AssemblyLineFlowchart from './components/AssemblyLineFlowchart'
import api from './api/axios'
import { Activity, Factory, Shield, Wifi, Clock, Gauge, Heart, ShieldAlert } from 'lucide-react'
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
    <header
      style={{
        background: 'rgba(5, 8, 16, 0.95)',
        borderBottom: '1px solid #1f2937',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
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

  // Lifted simulation states
  const [running, setRunning]         = useState(false)
  const [muri, setMuri]               = useState(false)
  const [simStates, setSimStates]     = useState({})

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

  useEffect(() => {
    if (!user) {
      setStations([]);
      setRunning(false);
      setSimStates({});
      setActiveOrder(null);
      return;
    }
    loadStations()
    loadActiveOrder()
    const stationInterval = setInterval(loadStations, 5000)
    const orderInterval = setInterval(loadActiveOrder, 2000)
    return () => {
      clearInterval(stationInterval)
      clearInterval(orderInterval)
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
    return Object.values(simStates).reduce((sum, state) => sum + (state.cycleCount || 0), 0)
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-900 pb-5">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider"
                style={{
                  background: '#00d4aa22',
                  color: '#00d4aa',
                  border: '1px solid #00d4aa33',
                }}
              >
                ● LIVE MONITOR
              </div>
              <span className="text-gray-600 text-xs font-mono">
                Industrial Digital Twin MES v2.5
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-wide">
              Production Digital Twin Dashboard
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Real-time line balancing, active operator twin telemetry, and parallel assembly line simulation
            </p>
          </div>
        </div>

        {/* Completed Order Banner */}
        {activeOrder && activeOrder.status === 'COMPLETED' && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between animate-fade-in shadow-[0_0_15px_rgba(16,185,129,0.1)] mb-1">
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

        {/* 5 Sleek KPI Cards */}
        {user && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in">
            {/* OEE */}
            <div className="glass-card p-4 flex items-center justify-between border border-gray-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.25)] relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300">
              <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-cyan-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
              <div>
                <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase font-mono">Overall OEE</p>
                <p className="text-2xl font-black text-white font-mono mt-1.5">{calculateOee()}</p>
                <p className="text-[9px] text-cyan-400 mt-1 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" /> Optimal Flow
                </p>
              </div>
              <div className="bg-cyan-950/40 p-3 rounded-xl border border-cyan-900/30 text-cyan-400">
                <Gauge size={20} />
              </div>
            </div>

            {/* Today's Production */}
            <div className="glass-card p-4 flex items-center justify-between border border-gray-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.25)] relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
              <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-emerald-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
              <div>
                <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase font-mono">Total Throughput</p>
                <p className="text-2xl font-black text-white font-mono mt-1.5">{getProductionCount()} <span className="text-xs text-gray-500 font-normal">units</span></p>
                <p className="text-[9px] text-emerald-400 mt-1 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Running Cycles
                </p>
              </div>
              <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-900/30 text-emerald-400">
                <Activity size={20} />
              </div>
            </div>

            {/* Active Anomalies */}
            <div className="glass-card p-4 flex items-center justify-between border border-gray-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.25)] relative overflow-hidden group hover:border-red-500/30 transition-all duration-300">
              <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-red-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
              <div>
                <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase font-mono">Active Alerts</p>
                <p className="text-2xl font-black text-white font-mono mt-1.5">{getActiveAnomaliesCount()}</p>
                <p className="text-[9px] text-red-400 mt-1 flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${getActiveAnomaliesCount() > 0 ? 'bg-red-500 animate-ping' : 'bg-gray-500'}`} /> 
                  {getActiveAnomaliesCount() > 0 ? 'Action Required' : 'Line Secured'}
                </p>
              </div>
              <div className={`p-3 rounded-xl border transition-colors ${getActiveAnomaliesCount() > 0 ? 'bg-red-950/40 border-red-900/30 text-red-400' : 'bg-gray-900/40 border-gray-800/30 text-gray-400'}`}>
                <ShieldAlert size={20} />
              </div>
            </div>

            {/* Line Health */}
            <div className="glass-card p-4 flex items-center justify-between border border-gray-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.25)] relative overflow-hidden group hover:border-violet-500/30 transition-all duration-300">
              <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-violet-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
              <div>
                <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase font-mono">Line Health</p>
                <p className="text-2xl font-black text-white font-mono mt-1.5">{getLineHealth()}</p>
                <p className="text-[9px] text-violet-400 mt-1 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" /> Stability Index
                </p>
              </div>
              <div className="bg-violet-950/40 p-3 rounded-xl border border-violet-900/30 text-violet-400">
                <Heart size={20} />
              </div>
            </div>

            {/* Active Production Order Card */}
            <div className="glass-card p-4 flex flex-col justify-between border border-gray-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.25)] relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300 col-span-2 lg:col-span-1">
              <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-emerald-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
              {activeOrder ? (
                <div className="flex flex-col gap-2 h-full justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase font-mono">Active Order</p>
                      <p className="text-sm font-black text-white font-mono mt-0.5">{activeOrder.orderNumber}</p>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                      activeOrder.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                      activeOrder.status === 'COMPLETED' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {activeOrder.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 font-mono">Model: {activeOrder.productModel}</p>
                    <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1 font-mono">
                      <span>Progress</span>
                      <span className="font-bold text-emerald-400">
                        {activeOrder.completedQuantity}/{activeOrder.targetQuantity} ({Math.round((activeOrder.completedQuantity / activeOrder.targetQuantity) * 100)}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800 mt-1">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (activeOrder.completedQuantity / activeOrder.targetQuantity) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-center h-full">
                  <p className="text-xs font-bold text-gray-500">No Active Order</p>
                  <p className="text-[9px] text-gray-600 mt-1 max-w-[150px] leading-relaxed">
                    Activate a pending order in the console to track progress.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Flowchart Panel (Full Width) */}
        {user && stations.length > 0 && (
          <div className="animate-fade-in">
            <AssemblyLineFlowchart
              stations={stations}
              activeStationId={activeStationId}
              onSelectStation={setActiveStationId}
              alerts={alerts}
            />
          </div>
        )}

        {/* Main layout below top panels */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* LEFT COLUMN — Auth + Setup + Simulation */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            <AuthPanel />
            {user && <AdminSetup />}
            {user && (
              <SimulationController 
                activeStationId={activeStationId}
                running={running}
                setRunning={setRunning}
                muri={muri}
                setMuri={setMuri}
                simStates={simStates}
                setSimStates={setSimStates}
                activeOrder={activeOrder}
              />
            )}
          </div>

          {/* RIGHT COLUMN — Andon + Station Twin Inspector */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            {user && (
              <>
                <AndonBoard
                  activeStationId={activeStationId}
                  onAlertsUpdate={setAlerts}
                />
                <StationInspector 
                  activeStationId={activeStationId}
                  station={stations.find(s => s.id === activeStationId)}
                  activeSim={simStates[activeStationId]}
                  alerts={alerts}
                  running={running}
                />
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-6 pt-6 border-t border-gray-900 text-center">
          <p className="text-xs text-gray-700 font-mono">
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
      <Dashboard />
    </AuthProvider>
  )
}
