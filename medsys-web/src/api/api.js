import axios from 'axios'

const AUTH_API = axios.create({ baseURL: '/api/v1/auth' })
const PATIENT_API = axios.create({ baseURL: '/api/v1' })
const ADMIN_API = axios.create({ baseURL: '/api/v1/admin' })

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
withAuth(ADMIN_API)

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
  search: (q, params) => PATIENT_API.get('/patients/search', { params: { q, ...params } }),
  stats: () => PATIENT_API.get('/patients/statistiques'),

  // Portail patient
  me: () => PATIENT_API.get('/patient/me'),
  updateMe: (data) => PATIENT_API.patch('/patient/me', data),
  myDossier: () => PATIENT_API.get('/patient/me/dossier'),
  dossier: (id) => PATIENT_API.get(`/patients/${id}/dossier`),

  // Notifications
  notifications: () => PATIENT_API.get('/patient/me/notifications'),

  // PDF & QR Code
  exportPdf: () => PATIENT_API.get('/patient/me/dossier/pdf', { responseType: 'blob' }),
  getQrCode: () => PATIENT_API.get('/patient/me/qrcode', { responseType: 'blob' }),

  // Documents
  uploadDocument: (formData) => PATIENT_API.post('/patient/me/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDocuments: () => PATIENT_API.get('/patient/me/documents'),
  deleteDocument: (id) => PATIENT_API.delete(`/patient/me/documents/${id}`),
  getDocumentFileUrl: (id) => `/api/v1/patient/me/documents/${id}/fichier`,

  // Messagerie
  getMessages: () => PATIENT_API.get('/patient/me/messages'),
  envoyerMessage: (data) => PATIENT_API.post('/patient/me/messages', data),
  marquerLu: (id) => PATIENT_API.put(`/patient/me/messages/${id}/lu`),

  // Rendez-vous
  getRdv: () => PATIENT_API.get('/patient/me/rdv'),
  annulerRdv: (id) => PATIENT_API.put(`/patient/me/rdv/${id}/annuler`),
}

export const adminApi = {
  createPersonnel: (data) => ADMIN_API.post('/personnel', data),
  listUsers: () => ADMIN_API.get('/users'),
  listByRole: (role) => ADMIN_API.get(`/users/role/${role}`),
  toggleUser: (id) => ADMIN_API.put(`/users/${id}/toggle`),
  deleteUser: (id) => ADMIN_API.delete(`/users/${id}`),
}
