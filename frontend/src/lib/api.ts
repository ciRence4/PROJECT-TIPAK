import axios from "axios";
import type { House, AnalysisResult, UserRole } from "./types";
import { HOUSES } from "./mock_data";

// Your custom backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, 
});

// ─── JWT INTERCEPTOR ────────────────────────────────────────────────────────
// Automatically attach the JWT token to every request if the user is logged in
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("tipak_jwt_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // ─── AUTHENTICATION (Mocked JWT for now) ──────────────────────────────────

  login: async (email: string, _pass: string): Promise<{ token: string; role: UserRole; userId: string }> => {
    // TODO: Replace with real endpoint -> const res = await apiClient.post("/auth/login", { email, pass }); return res.data;
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    
    // Mock logic: assign 'captain' role if email contains 'captain'
    const role: UserRole = email.toLowerCase().includes('captain') ? 'captain' : 'resident';
    return { token: "mock-jwt-token-12345", role, userId: "mock-user-123" };
  },

  register: async (_email: string, _pass: string, role: UserRole): Promise<{ token: string; role: UserRole; userId: string }> => {
    // TODO: Replace with real endpoint -> const res = await apiClient.post("/auth/register", { email, pass, role }); return res.data;
    await new Promise(resolve => setTimeout(resolve, 800));
    return { token: "mock-jwt-token-67890", role, userId: "mock-new-user-456" };
  },

  // ─── AI ENGINE ────────────────────────────────────────────────────────────

  checkHealth: async () => {
    const response = await apiClient.get("/health");
    return response.data;
  },

  analyzeImages: async (
    photoUrls: string[],
    location?: { lat: number; lng: number } | null
  ): Promise<AnalysisResult> => {
    const formData = new FormData();
    
    for (let i = 0; i < photoUrls.length; i++) {
      const response = await fetch(photoUrls[i]);
      const blob = await response.blob();
      formData.append("images", blob, `photo_${i}.jpg`); 
    }

    if (location) {
      formData.append("latitude", location.lat.toString());
      formData.append("longitude", location.lng.toString());
    }

    const response = await apiClient.post("/analyze", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    
    return response.data;
  },

  getRecommendations: async (assessmentId?: string): Promise<string[]> => {
    const response = await apiClient.get(`/assessments/${assessmentId || 'latest'}/recommendations`);
    return response.data;
  },

  // ─── DATABASE CRUD (Using your custom backend, mocked for now) ────────────

  getHouses: async (): Promise<House[]> => {
    // TODO: Replace with real endpoint -> const res = await apiClient.get("/houses"); return res.data;
    await new Promise(resolve => setTimeout(resolve, 600));
    return HOUSES; 
  },

  updateHouseRisk: async (id: number, updatedData: Partial<House>): Promise<House> => {
    // TODO: Replace with real endpoint -> const res = await apiClient.put(`/houses/${id}`, updatedData); return res.data;
    const house = HOUSES.find(h => h.id === id);
    if (!house) throw new Error("House not found");
    return { ...house, ...updatedData } as House;
  },

  saveAssessment: async (userId: string, result: AnalysisResult) => {
    // TODO: Replace with real endpoint -> const res = await apiClient.post("/assessments", { userId, result }); return res.data;
    console.log("Mock saved assessment using JWT for user:", userId);
    return { id: 999, user_id: userId, result };
  }
};