import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('authUser')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    const userData = {
      email: data.email,
      role: data.role,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    }
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('authUser', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const register = useCallback(async (email, password, role) => {
    await api.post('/auth/register', { email, password, role })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('authUser')
    setUser(null)
    toast.success('Logged out successfully')
  }, [])

  // Listen for forced logout (token refresh failure)
  useEffect(() => {
    const handler = () => {
      setUser(null)
      toast.error('Session expired. Please log in again.', { duration: 5000 })
    }
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  const hasRole = useCallback(
    (...roles) => user && roles.includes(user.role),
    [user]
  )

  return (
    <AuthContext.Provider value={{ user, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
