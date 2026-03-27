import axios from "axios";
import type { House, AnalysisResult, UserRole } from "./types";
import { HOUSES } from "./mock_data";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, 
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("tipak_jwt_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  login: async (email: string, _pass: string): Promise<{ token: string; role: UserRole; userId: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const role: UserRole = email.toLowerCase().includes('captain') ? 'captain' : 'resident';
    return { token: "mock-jwt-token-12345", role, userId: "mock-user-123" };
  },

  register: async (_email: string, _pass: string, role: UserRole): Promise<{ token: string; role: UserRole; userId: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { token: "mock-jwt-token-67890", role, userId: "mock-new-user-456" };
  },

  checkHealth: async () => {
    const response = await apiClient.get("/health");
    return response.data;
  },

  analyzeImages: async (
    photoUrls: string[], // Passing array still works, but it will only process the first item
    location?: { lat: number; lng: number } | null
  ): Promise<AnalysisResult> => {
    const formData = new FormData();
    
    if (photoUrls.length > 0) {
      const response = await fetch(photoUrls[0]); // <-- Only process the very first image for testing
      const blob = await response.blob();
      formData.append("image", blob, `photo_test.jpg`); // <-- Matching backend 'image'
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

  getHouses: async (): Promise<House[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return HOUSES; 
  },

  updateHouseRisk: async (id: number, updatedData: Partial<House>): Promise<House> => {
    const house = HOUSES.find(h => h.id === id);
    if (!house) throw new Error("House not found");
    return { ...house, ...updatedData } as House;
  },

  saveAssessment: async (userId: string, result: AnalysisResult) => {
    console.log("Mock saved assessment using JWT for user:", userId);
    return { id: 999, user_id: userId, result };
  }
};