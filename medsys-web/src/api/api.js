import axios from 'axios'

const AUTH_API = axios.create({ baseURL: '/api/v1/auth' })
const PATIENT_API = axios.create({ baseURL: '/api/v1' })

// Intercepteur token
const withAuth = (api) => {
  api.interceptors.request.use(cfg => {
    const token = sessionStorage.getItem('medsys_token')
    if (token) cfg.headers.Authorization = `Bearer ${token}`
    return cfg
  })
  return api
}

withAuth(AUTH_API)
withAuth(PATIENT_API)

export const authApi = {
  login: (data) => AUTH_API.post('/login', data),
  register: (data) => AUTH_API.post('/register', data),
  forgotPassword: (email) => AUTH_API.post('/forgot-password', { email }),
  resetPassword: (data) => AUTH_API.post('/reset-password', data),
  changePassword: (data) => AUTH_API.post('/change-password', data),
  verify: (token) => AUTH_API.get(`/verify?token=${token}`),
  me: () => AUTH_API.get('/me'),
}

export const patientApi = {
  getAll: (params) => PATIENT_API.get('/patients', { params }),
  getById: (id) => PATIENT_API.get(`/patients/${id}`),
  create: (data) => PATIENT_API.post('/patients', data),
  update: (id, data) => PATIENT_API.put(`/patients/${id}`, data),
  delete: (id) => PATIENT_API.delete(`/patients/${id}`),
  search: (q) => PATIENT_API.get('/patients/search', { params: { q } }),
  stats: () => PATIENT_API.get('/patients/statistiques'),
  me: () => PATIENT_API.get('/patient/me'),
}

export const adminApi = {
  createPersonnel: (data) => AUTH_API.post('/../../api/v1/admin/personnel', data),
  listUsers: () => AUTH_API.get('/../../api/v1/admin/users'),
  toggleUser: (id) => AUTH_API.put(`/../../api/v1/admin/users/${id}/toggle`),
}
