import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPanel from './components/AuthPanel'
import SimulationController from './components/SimulationController'
import AndonBoard from './components/AndonBoard'
import YamazumiChart from './components/YamazumiChart'
import AdminSetup from './components/AdminSetup'
import AssemblyLineFlowchart from './components/AssemblyLineFlowchart'
import api from './api/axios'
import { Activity, Factory, Shield, Wifi, Clock } from 'lucide-react'
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
      <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
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

  const loadStations = async () => {
    try {
      const { data } = await api.get('/stations')
      setStations(data.sort((a, b) => a.id - b.id))
    } catch (err) {}
  }

  useEffect(() => {
    if (!user) {
      setStations([]);
      return;
    }
    loadStations()
    const interval = setInterval(loadStations, 5000)
    return () => clearInterval(interval)
  }, [user])

  return (
    <div
      className="min-h-screen bg-grid"
      style={{ background: 'var(--bg-base)' }}
    >
      <Header />

      <main className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6">
        {/* Page title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="px-3 py-1 rounded-full text-xs font-mono font-bold"
              style={{
                background: '#00d4aa22',
                color: '#00d4aa',
                border: '1px solid #00d4aa33',
              }}
            >
              ● LIVE
            </div>
            <span className="text-gray-600 text-xs font-mono">
              Manufacturing Execution System v2.0
            </span>
          </div>
          <h2 className="text-3xl font-black text-white">
            Production Dashboard
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Real-time Takt Time analysis, Andon alerting, and parallel simulation for Automotive Assembly
          </p>
        </div>

        {/* Flowchart Panel (Full Width) */}
        {user && stations.length > 0 && (
          <div className="mb-6">
            <AssemblyLineFlowchart
              stations={stations}
              activeStationId={activeStationId}
              onSelectStation={setActiveStationId}
              alerts={alerts}
            />
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* LEFT COLUMN — Auth + Setup + Simulation */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            <AuthPanel />
            {user && <AdminSetup />}
            {user && <SimulationController activeStationId={activeStationId} />}
          </div>

          {/* RIGHT COLUMN — Andon + Yamazumi */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            <AndonBoard
              activeStationId={activeStationId}
              onAlertsUpdate={setAlerts}
            />
            <YamazumiChart activeStationId={activeStationId} />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-900 text-center">
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
