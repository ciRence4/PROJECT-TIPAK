/* eslint-disable @typescript-eslint/no-unused-vars */
// src/lib/api.ts
import axios from "axios";
import type { House, AnalysisResult, UserRole } from "./types";

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
  // Authentication relies on a simulated delay since there are no auth endpoints 
  // in the FastAPI backend yet. It defaults everyone to the "captain" role.
  login: async (_email: string, _pass: string): Promise<{ token: string; role: UserRole; userId: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { token: "mock-jwt-token-12345", role: "captain", userId: "mock-user-123" };
  },

  register: async (_email: string, _pass: string, _role: UserRole): Promise<{ token: string; role: UserRole; userId: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { token: "mock-jwt-token-67890", role: "captain", userId: "mock-new-user-456" };
  },

  checkHealth: async () => {
    const response = await apiClient.get("/health");
    return response.data;
  },

  analyzeImages: async (
    photoUrls: string[],
    location?: { lat: number; lng: number } | null,
    residentName?: string,
    address?: string,
    contactNumber?: string, 
  ): Promise<AnalysisResult> => {
    const formData = new FormData();
    
    if (photoUrls.length > 0) {
      const response = await fetch(photoUrls[0]); 
      const blob = await response.blob();
      formData.append("image", blob, `photo_test.jpg`); 
    }

    if (location) {
      formData.append("latitude", location.lat.toString());
      formData.append("longitude", location.lng.toString());
    }
    
    if (residentName) formData.append("resident_name", residentName);
    if (address) formData.append("address", address);
    if (contactNumber) formData.append("contact_number", contactNumber);

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
    try {
      const response = await apiClient.get("/houses");
      const rawData = Array.isArray(response.data) ? response.data : [];

      return rawData.map((r: any) => ({
        id: r.id,
        lat: r.lat,
        lng: r.lng,
        risk: r.risk,
        color: r.color || (r.risk === 'MATAAS' ? '#EF4444' : r.risk === 'MABABA' ? '#22C55E' : '#F59E0B'),
        owner: r.owner || 'Unknown',
        address: r.address || 'Di nakatala', 
        materials: r.materials || 'Tingnan sa buong ulat',
        details: r.details || 'Walang naitalang depekto',
        full_report: r.full_report || 'Walang karagdagang ulat.',
        date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-PH') : new Date().toLocaleDateString('en-PH')
      }));
    } catch (error) {
      console.error("API Error in getHouses:", error);
      return [];
    }
  },
  
  updateHouseRisk: async (_id: number, _updatedData: Partial<House>): Promise<House> => {
    throw new Error("Ang manu-manong pagbabago ng risk level ay hindi pa suportado sa backend.");
  },

  saveAssessment: async (userId: string, result: AnalysisResult) => {
    // The backend handles saving directly in the /analyze route now.
    // This just returns the object structure expected by the frontend UI.
    return { id: result.id || 999, user_id: userId, result };
  }
};