import axios from "axios";
import { Capacitor } from '@capacitor/core';

const API = process.env.REACT_APP_API_URL || (Capacitor.isNativePlatform() ? "http://10.0.2.2:8000" : "http://localhost:8000");

/* ─────────────────────────────────────────────
   AXIOS INSTANCE
───────────────────────────────────────────── */
const instance = axios.create({
  baseURL: API,
  timeout: 15000,
});

// 🔐 Attach JWT token
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const lang = localStorage.getItem("preferred_language") || "en";

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["Accept-Language"] = lang;

  return config;
});

// ❌ Global error handler (optional but useful)
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API ERROR:", error?.response || error.message);

    if (error.response?.status === 401) {
      console.warn("Unauthorized — logging out");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload();
    }

    return Promise.reject(error);
  }
);

/* ============================================================
   AUTH APIs
============================================================ */
export const authAPI = {
  login: (payload) => instance.post("/api/auth/login", payload),
  logout: () => instance.post("/api/auth/logout"),
};

/* ============================================================
   USER / PROFILE APIs
============================================================ */
export const userAPI = {
  getProfile: (userId) =>
    instance.get(`/api/user/${userId}/profile`),

  getDashboard: (userId) =>
    instance.get(`/api/user/${userId}/dashboard`),

  updateProfile: (userId, data) =>
    instance.post(`/api/user/${userId}/update`, data),
};

/* ============================================================
   ASSETS / PORTFOLIO APIs
============================================================ */
export const assetAPI = {
  getAssets: (userId) =>
    instance.get(`/api/user/${userId}/assets`),

  addAsset: (userId, asset) =>
    instance.post(`/api/user/${userId}/assets`, asset),

  updateAsset: (userId, assetId, data) =>
    instance.put(`/api/user/${userId}/assets/${assetId}`, data),

  deleteAsset: (userId, assetId) =>
    instance.delete(`/api/user/${userId}/assets/${assetId}`),
};

/* ============================================================
   GOALS APIs
============================================================ */
export const goalAPI = {
  getGoals: (userId) =>
    instance.get(`/api/user/${userId}/goals`),

  addGoal: (userId, goal) =>
    instance.post(`/api/user/${userId}/goals`, goal),

  updateGoal: (userId, goalId, data) =>
    instance.put(`/api/user/${userId}/goals/${goalId}`, data),

  deleteGoal: (userId, goalId) =>
    instance.delete(`/api/user/${userId}/goals/${goalId}`),
};

/* ============================================================
   TRANSACTIONS / EXPENSES APIs
============================================================ */
export const transactionAPI = {
  getTransactions: (userId) =>
    instance.get(`/api/user/${userId}/transactions`),

  addTransaction: (userId, tx) =>
    instance.post(`/api/user/${userId}/transactions`, tx),

  deleteTransaction: (userId, txId) =>
    instance.delete(`/api/user/${userId}/transactions/${txId}`),
};

/* ============================================================
   FRAUD / ACTION ENGINE
============================================================ */
export const fraudAPI = {
  executeAction: (payload) =>
    instance.post(`/api/action/execute`, payload),
  getRiskHistory: (userId) =>
    instance.get(`/api/risk/history/${userId}`),
  getGlobalRiskHistory: () =>
    instance.get(`/api/risk/history/all`),
};

/* ============================================================
   CHAT / AI APIs
============================================================ */
export const chatAPI = {
  sendMessage: (message, history = []) => {
    const user = JSON.parse(localStorage.getItem("user"));

    return instance.post(`/api/chat/message`, {
      userId: user?.userId || 1,
      message,
      history,
    });
  },
};

/* ============================================================
   ANALYTICS / INSIGHTS APIs
============================================================ */
export const analyticsAPI = {
  getSpendingInsights: (userId) =>
    instance.get(`/api/user/${userId}/insights`),

  getRiskAnalysis: (userId) =>
    instance.get(`/api/user/${userId}/risk`),
};

/* ============================================================
   SYSTEM / HEALTH
============================================================ */
export const systemAPI = {
  health: () => instance.get(`/health`),
};

/* ============================================================
   EXPORT DEFAULT INSTANCE
============================================================ */
export default instance;