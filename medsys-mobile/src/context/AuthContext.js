import { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restore = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('medsys_token')
        const storedUser = await AsyncStorage.getItem('medsys_user')
        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
        }
      } catch (e) {} finally { setLoading(false) }
    }
    restore()
  }, [])

  const login = async (userData, jwtToken) => {
    setUser(userData); setToken(jwtToken)
    await AsyncStorage.setItem('medsys_token', jwtToken)
    await AsyncStorage.setItem('medsys_user', JSON.stringify(userData))
  }

  const logout = async () => {
    setUser(null); setToken(null)
    await AsyncStorage.multiRemove(['medsys_token', 'medsys_user'])
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
