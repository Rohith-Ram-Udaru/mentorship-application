import { api } from "./api";

export const authApi = {
  register: (payload) => api.post("/auth/register", payload).then((r) => r.data),
  login: (payload) => api.post("/auth/login", payload).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
  users: (q) => api.get("/auth/users", { params: { q } }).then((r) => r.data)
};

export const pairingsApi = {
  list: (params) => api.get("/pairings", { params }).then((r) => r.data),
  create: (payload) => api.post("/pairings", payload).then((r) => r.data),
  get: (id) => api.get(`/pairings/${id}`).then((r) => r.data),
  status: (id, payload) => api.patch(`/pairings/${id}/status`, payload).then((r) => r.data),
  addObserver: (id, payload) => api.post(`/pairings/${id}/observers`, payload).then((r) => r.data),
  removeObserver: (id, userId) => api.delete(`/pairings/${id}/observers/${userId}`).then((r) => r.data),
  timeline: (id) => api.get(`/pairings/${id}/timeline`).then((r) => r.data),
  summary: (id) => api.get(`/pairings/${id}/summary`).then((r) => r.data),
  org: () => api.get("/pairings/organization/dashboard").then((r) => r.data)
};

export const sessionsApi = {
  list: (pairingId, params) => api.get(`/pairings/${pairingId}/sessions`, { params }).then((r) => r.data),
  create: (pairingId, payload) => api.post(`/pairings/${pairingId}/sessions`, payload).then((r) => r.data),
  update: (pairingId, sessionId, payload) => api.patch(`/pairings/${pairingId}/sessions/${sessionId}`, payload).then((r) => r.data)
};

export const feedbackApi = {
  list: (pairingId, params) => api.get(`/pairings/${pairingId}/feedback`, { params }).then((r) => r.data),
  create: (pairingId, payload) => api.post(`/pairings/${pairingId}/feedback`, payload).then((r) => r.data),
  remove: (pairingId, feedbackId) => api.delete(`/pairings/${pairingId}/feedback/${feedbackId}`).then((r) => r.data)
};

export const kraApi = {
  list: (pairingId) => api.get(`/pairings/${pairingId}/kras`).then((r) => r.data),
  create: (pairingId, payload) => api.post(`/pairings/${pairingId}/kras`, payload).then((r) => r.data),
  createKpi: (pairingId, kraId, payload) => api.post(`/pairings/${pairingId}/kras/${kraId}/kpis`, payload).then((r) => r.data),
  updateKpi: (pairingId, kraId, kpiId, payload) =>
    api.patch(`/pairings/${pairingId}/kras/${kraId}/kpis/${kpiId}`, payload).then((r) => r.data),
  history: (pairingId, kraId, kpiId, params) =>
    api.get(`/pairings/${pairingId}/kras/${kraId}/kpis/${kpiId}/history`, { params }).then((r) => r.data)
};
