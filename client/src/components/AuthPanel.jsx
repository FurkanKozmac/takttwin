import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { LogIn, UserPlus, ChevronRight, Zap, Shield, HardHat, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'ROLE_ADMIN',         label: 'Admin',          icon: Shield,   color: '#4a90d9' },
  { value: 'ROLE_TEAM_LEADER',   label: 'Team Leader',    icon: Users,    color: '#f59e0b' },
  { value: 'ROLE_OPERATOR',      label: 'Operator',       icon: Zap,      color: '#10b981' },
  { value: 'ROLE_HSE_SPECIALIST',label: 'HSE Specialist', icon: HardHat,  color: '#a78bfa' },
]

const QUICK_USERS = [
  { email: 'admin@tmmt.com',      password: 'mysecurepassword123', role: 'ROLE_ADMIN',          label: 'Admin',   color: '#4a90d9' },
  { email: 'leader@tmmt.com',     password: 'password123',         role: 'ROLE_TEAM_LEADER',    label: 'Leader',  color: '#f59e0b' },
  { email: 'operator1@tmmt.com',  password: 'mysecurepassword123', role: 'ROLE_OPERATOR',       label: 'Operator',color: '#10b981' },
  { email: 'isguzmani@example.com', password: 'mysecurepassword123', role: 'ROLE_HSE_SPECIALIST', label: 'HSE',     color: '#a78bfa' },
]

export default function AuthPanel() {
  const { login, register, user, logout } = useAuth()
  const [tab, setTab]           = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole]         = useState('ROLE_OPERATOR')
  const [loading, setLoading]   = useState(false)

  const handleLogin = async (e) => {
    e?.preventDefault()
    if (!email || !password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      const u = await login(email, password)
      toast.success(`Welcome back, ${u.email}!`, { icon: '🏭' })
      setEmail(''); setPassword('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed — check credentials')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e?.preventDefault()
    if (!email || !password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      await register(email, password, role)
      toast.success('User registered! You can now log in.')
      setTab('login')
      setEmail(''); setPassword('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (u) => {
    setLoading(true)
    try {
      const logged = await login(u.email, u.password)
      toast.success(`Logged in as ${logged.role.replace('ROLE_', '')}`, { icon: '⚡' })
    } catch (err) {
      // Try to register first, then login
      try {
        await register(u.email, u.password, u.role)
        const logged = await login(u.email, u.password)
        toast.success(`Created & logged in as ${logged.role.replace('ROLE_', '')}`, { icon: '✅' })
      } catch (err2) {
        toast.error(`Quick login failed: ${err2.response?.data?.message || err2.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const roleColor = ROLES.find(r => r.value === (user?.role))?.color || '#10b981'

  return (
    <div className="glass-card p-6 flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label mb-1">Access Control</p>
          <h2 className="text-lg font-bold text-white">Authentication</h2>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <span
              className="status-dot"
              style={{ background: roleColor, boxShadow: `0 0 8px ${roleColor}` }}
            />
            <span className="text-xs font-mono text-gray-400">{user.email}</span>
          </div>
        )}
      </div>

      {user ? (
        /* ── Logged-in view ── */
        <div className="flex flex-col gap-4">
          <div
            className="rounded-xl p-4 flex items-center gap-4"
            style={{ background: `${roleColor}18`, border: `1px solid ${roleColor}44` }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ background: `${roleColor}30`, color: roleColor }}
            >
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{user.email}</p>
              <p className="text-xs font-mono mt-0.5" style={{ color: roleColor }}>
                {user.role.replace('ROLE_', '')}
              </p>
            </div>
            <Shield size={20} style={{ color: roleColor }} />
          </div>

          <div className="border-t border-gray-800 pt-4">
            <p className="section-label mb-3">Quick Switch User</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_USERS.map((u) => (
                <button
                  key={u.email}
                  onClick={() => quickLogin(u)}
                  disabled={loading || user.email === u.email}
                  className="tt-btn tt-btn-ghost text-xs py-2 px-3"
                  style={user.email === u.email ? { borderColor: u.color, color: u.color } : {}}
                >
                  {u.label}
                  {user.email !== u.email && <ChevronRight size={12} />}
                </button>
              ))}
            </div>
          </div>

          <button onClick={logout} className="tt-btn tt-btn-ghost w-full text-sm">
            Sign Out
          </button>
        </div>
      ) : (
        /* ── Auth forms ── */
        <div className="flex flex-col gap-4">
          {/* Tab selector */}
          <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
            {['login', 'register'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all"
                style={tab === t
                  ? { background: 'linear-gradient(135deg, #00d4aa, #10b981)', color: '#000' }
                  : { color: '#9ca3af' }
                }
              >
                {t === 'login' ? <span className="flex items-center justify-center gap-2"><LogIn size={14}/>Login</span>
                               : <span className="flex items-center justify-center gap-2"><UserPlus size={14}/>Register</span>}
              </button>
            ))}
          </div>

          <form onSubmit={tab === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-3">
            <div>
              <label className="section-label block mb-1.5">Email</label>
              <input
                className="tt-input"
                type="email"
                placeholder="operator@tmmt.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="section-label block mb-1.5">Password</label>
              <input
                className="tt-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {tab === 'register' && (
              <div>
                <label className="section-label block mb-1.5">Role</label>
                <select
                  className="tt-input"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="tt-btn tt-btn-primary w-full mt-1"
            >
              {loading
                ? <span className="flex items-center gap-2"><span className="animate-spin-slow inline-block">⚙</span> Working...</span>
                : tab === 'login' ? <><LogIn size={16}/> Sign In</> : <><UserPlus size={16}/> Create Account</>
              }
            </button>
          </form>

          {/* Quick login section */}
          <div className="border-t border-gray-800 pt-4">
            <p className="section-label mb-3">Quick Access (auto-create)</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_USERS.map((u) => (
                <button
                  key={u.email}
                  onClick={() => quickLogin(u)}
                  disabled={loading}
                  className="tt-btn tt-btn-ghost text-xs py-2 px-3 flex items-center gap-1.5"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: u.color }}
                  />
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
