import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

// Public
export const fetchServices = () => api.get("/services").then(r => r.data);
export const fetchService = (slug) => api.get(`/services/${slug}`).then(r => r.data);
export const fetchDoctors = () => api.get("/doctors").then(r => r.data);
export const fetchTestimonials = () => api.get("/testimonials").then(r => r.data);
export const fetchGallery = () => api.get("/gallery").then(r => r.data);
export const fetchReviewSummary = () => api.get("/reviews-summary").then(r => r.data);
export const fetchBlog = () => api.get("/blog").then(r => r.data);
export const fetchBlogPost = (slug) => api.get(`/blog/${slug}`).then(r => r.data);
export const createBooking = (payload) => api.post("/bookings", payload).then(r => r.data);
export const createContact = (payload) => api.post("/contact", payload).then(r => r.data);
export const sendChat = (session_id, message) => api.post("/chat", { session_id, message }).then(r => r.data);

// Admin
const ADMIN_KEY = "smilesavers_admin_token";
export const getAdminToken = () => localStorage.getItem(ADMIN_KEY) || "";
export const setAdminToken = (t) => localStorage.setItem(ADMIN_KEY, t);
export const clearAdminToken = () => localStorage.removeItem(ADMIN_KEY);
const admHeaders = () => ({ headers: { "X-Admin-Token": getAdminToken() } });

export const adminLogin = (token) => api.post("/admin/login", { token }).then(r => r.data);
export const adminListBookings = () => api.get("/admin/bookings", admHeaders()).then(r => r.data);
export const adminListContacts = () => api.get("/admin/contacts", admHeaders()).then(r => r.data);
export const adminListSmileAnalyses = () => api.get("/admin/smile-analyses", admHeaders()).then(r => r.data);
export const adminListBlog = () => api.get("/admin/blog", admHeaders()).then(r => r.data);
export const adminCreateBlog = (payload) => api.post("/admin/blog", payload, admHeaders()).then(r => r.data);
export const adminUpdateBlog = (slug, payload) => api.put(`/admin/blog/${slug}`, payload, admHeaders()).then(r => r.data);
export const adminDeleteBlog = (slug) => api.delete(`/admin/blog/${slug}`, admHeaders()).then(r => r.data);
export const fetchBookedSlots = (date) =>
  api.get(`/booked-slots?date=${date}`).then(r => r.data);
