import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ⚠️ IMPORTANT : Remplacez par votre IP locale (ipconfig dans cmd)
const AUTH_BASE = 'http://192.168.1.100:8082/api/v1'
const PATIENT_BASE = 'http://192.168.1.100:8081/api/v1'

const authAxios = axios.create({ baseURL: AUTH_BASE })
const patientAxios = axios.create({ baseURL: PATIENT_BASE })

// Intercepteur auth
const addAuthInterceptor = (instance) => {
  instance.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('medsys_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })
}
addAuthInterceptor(authAxios)
addAuthInterceptor(patientAxios)

export const authApi = {
  login: (data) => authAxios.post('/auth/login', data),
  register: (data) => authAxios.post('/auth/register', data),
  forgotPassword: (email) => authAxios.post('/auth/forgot-password', { email }),
  resetPassword: (data) => authAxios.post('/auth/reset-password', data),
  me: () => authAxios.get('/auth/me'),
}

export const patientApi = {
  me: () => patientAxios.get('/patient/me'),
}
