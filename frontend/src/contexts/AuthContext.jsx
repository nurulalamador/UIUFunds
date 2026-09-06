import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, jsonBody } from '../api/client'

const AuthContext = createContext(null)
const TOKEN_KEY = 'uiufund_token'
const USER_KEY = 'uiufund_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) || null } catch { return null }
  })
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)))

  const persist = useCallback((token, nextUser) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return null
    }
    try {
      const data = await api('/auth/me')
      setUser(data.user)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      return data.user
    } catch {
      logout()
      return null
    } finally {
      setLoading(false)
    }
  }, [logout])

  useEffect(() => { refreshUser() }, [refreshUser])

  const login = async (identifier, password) => {
    const data = await api('/auth/login', {
      method: 'POST',
      body: jsonBody({ identifier, password }),
    })
    persist(data.token, data.user)
    return data
  }

  const register = async (payload) => {
    const data = await api('/auth/register', {
      method: 'POST',
      body: jsonBody(payload),
    })
    persist(data.token, data.user)
    return data
  }

  const updateUser = (nextUser) => {
    setUser(nextUser)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
  }

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user && localStorage.getItem(TOKEN_KEY)),
    login,
    register,
    logout,
    refreshUser,
    updateUser,
  }), [user, loading, logout, refreshUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
