import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Ajouter le token JWT automatiquement à chaque requête
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login = (data) => API.post("/auth/login", data);
export const register = (data) => API.post("/auth/register", data);
export const getMe = () => API.get("/auth/me");

// Créneaux médecin
export const getSlots = (doctorId, weekStart) =>
  API.get(`/slots?doctorId=${doctorId}&weekStart=${weekStart}`);
export const isWeekFull = (doctorId, weekStart) =>
  API.get(`/slots/week-full?doctorId=${doctorId}&weekStart=${weekStart}`);
export const createSlot = (data) => API.post("/slots", data);
export const blockSlot = (id) => API.put(`/slots/${id}/block`);
export const unblockSlot = (id) => API.put(`/slots/${id}/unblock`);
export const createBulkSlots = (data) => API.post("/slots/bulk", data);

// ✅ FIX Bug 1 : Créneaux hospitaliers (Analyses / Radiologie / Scanner)
export const getHospitalSlots = (serviceId, weekStart) =>
  API.get(`/slots/hospital?serviceId=${serviceId}&weekStart=${weekStart}`);
export const isHospitalWeekFull = (serviceId, weekStart) =>
  API.get(`/slots/hospital/week-full?serviceId=${serviceId}&weekStart=${weekStart}`);

// Rendez-vous
export const bookAppointment = (data) => API.post("/appointments", data);
export const cancelAppointment = (data) => API.delete("/appointments", { data });
export const getMyAppointments = () => API.get("/appointments/mine");
export const getAllAppointments = (doctorId) =>
  API.get(`/appointments${doctorId ? `?doctorId=${doctorId}` : ""}`);

// Liste d'attente
export const joinWaitingList = (data) => API.post("/waiting-list", data);

// Services
export const getServices = () => API.get("/services");
export const getDoctorsByService = (serviceId) => API.get(`/services/${serviceId}/doctors`);
export const getMyDoctorServices = () => API.get("/services/my-services");
export const assignDoctorServices = (data) => API.post("/services/assign", data);