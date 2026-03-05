import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem('medsys_user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState(() => sessionStorage.getItem('medsys_token') || null)

  const login = (userData, jwtToken) => {
    setUser(userData)
    setToken(jwtToken)
    sessionStorage.setItem('medsys_user', JSON.stringify(userData))
    sessionStorage.setItem('medsys_token', jwtToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    sessionStorage.clear()
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
