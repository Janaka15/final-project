import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// --- Auth ---
export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

// --- Rooms ---
export const roomsApi = {
  list: () => api.get("/rooms"),
  detail: (id: number) => api.get(`/rooms/${id}`),
  availability: (checkIn: string, checkOut: string) =>
    api.get("/rooms/availability", { params: { check_in: checkIn, check_out: checkOut } }),
};

// --- Bookings ---
export const bookingsApi = {
  create: (data: {
    room_type_id: number;
    check_in: string;
    check_out: string;
    guests: number;
    notes?: string;
  }) => api.post("/bookings", data),
  myBookings: () => api.get("/bookings"),
  cancel: (id: number) => api.put(`/bookings/${id}/cancel`),
};

// --- Feedback ---
export const feedbackApi = {
  submit: (data: { booking_id: number; rating: number; comment?: string }) =>
    api.post("/feedback", data),
};

// --- Admin ---
export const adminApi = {
  bookings: {
    list: (status?: string) =>
      api.get("/admin/bookings", { params: status ? { status } : {} }),
    update: (id: number, status: string) =>
      api.put(`/admin/bookings/${id}`, { status }),
  },
  rooms: {
    list: () => api.get("/admin/rooms"),
    create: (data: object) => api.post("/admin/rooms", data),
    update: (id: number, data: object) => api.put(`/admin/rooms/${id}`, data),
    delete: (id: number) => api.delete(`/admin/rooms/${id}`),
  },
  predictions: (days = 30) => api.get("/admin/predictions", { params: { days } }),
  analytics: {
    kpis: () => api.get("/admin/analytics/kpis"),
    revenue: (period: "daily" | "weekly" | "monthly" = "weekly") =>
      api.get("/admin/analytics/revenue", { params: { period } }),
    heatmap: (year: number) =>
      api.get("/admin/analytics/occupancy-heatmap", { params: { year } }),
    seasonal: () => api.get("/admin/analytics/seasonal"),
    roomUtilization: () => api.get("/admin/analytics/room-utilization"),
  },
  customers: {
    list: (search?: string) =>
      api.get("/admin/customers", { params: search ? { search } : {} }),
    bookings: (userId: number) => api.get(`/admin/customers/${userId}/bookings`),
    feedback: () => api.get("/admin/customers/feedback"),
  },
};
