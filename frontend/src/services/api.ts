import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000/api";
const API_SERVER_URL =
  process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:8000";

// Utility function to get full file URL
export const getFileUrl = (
  filePath: string | null | undefined
): string | null => {
  if (!filePath) return null;
  if (filePath.startsWith("http")) return filePath;
  return `${API_SERVER_URL}${filePath}`;
};

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "staff" | "approver_level_1" | "approver_level_2" | "finance";
  department?: string;
  phone?: string;
}

export interface RequestItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
}

export interface PurchaseRequest {
  id: number;
  title: string;
  description: string;
  amount: string;
  status: "pending" | "approved" | "rejected";
  created_by: User;
  approved_by_level_1?: User;
  approved_by_level_2?: User;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  items?: RequestItem[];
  can_be_edited?: boolean;
  requires_level_1_approval?: boolean;
  requires_level_2_approval?: boolean;
  proforma?: any;
  purchase_order?: any;
  receipts?: any[];
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401
api.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem("access_token", access);
          originalRequest.headers.Authorization = `Bearer ${access}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/auth/login/", { email, password }),

  register: (data: any) => api.post("/auth/register/", data),

  getCurrentUser: () => api.get<User>("/auth/me/"),

  refreshToken: (refresh: string) => api.post("/auth/refresh/", { refresh }),
};

// Requests API
export const requestsAPI = {
  list: (params?: any) =>
    api.get<{ results: PurchaseRequest[] } | PurchaseRequest[]>("/requests/", {
      params,
    }),

  get: (id: number) => api.get<PurchaseRequest>(`/requests/${id}/`),

  create: (data: any) => api.post<PurchaseRequest>("/requests/", data),

  update: (id: number, data: any) =>
    api.put<PurchaseRequest>(`/requests/${id}/`, data),

  approve: (id: number) =>
    api.patch<PurchaseRequest>(`/requests/${id}/approve/`),

  reject: (id: number, reason: string) =>
    api.patch<PurchaseRequest>(`/requests/${id}/reject/`, { reason }),

  history: (id: number) => api.get(`/requests/${id}/history/`),
};

// Documents API
export const documentsAPI = {
  uploadProforma: (requestId: number, file: File) => {
    const formData = new FormData();
    formData.append("request", requestId.toString());
    formData.append("file", file);
    return api.post("/proformas/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadReceipt: (requestId: number, file: File) => {
    const formData = new FormData();
    formData.append("request", requestId.toString());
    formData.append("file", file);
    return api.post("/receipts/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getPurchaseOrders: (params?: any) => api.get("/purchase-orders/", { params }),

  getPurchaseOrder: (id: number) => api.get(`/purchase-orders/${id}/`),

  validateReceipt: (id: number) => api.post(`/receipts/${id}/validate/`),
};

export default api;
