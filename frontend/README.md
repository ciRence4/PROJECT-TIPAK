# 🏠 Project Tipak - Structural Safety Assessment App

Project Tipak is a React-based web application designed to help communities assess the structural integrity of houses before and after natural disasters (like typhoons). 

It features a dual-role system:
1. **Resident Portal:** Allows homeowners to take photos of their houses and receive instant AI-powered structural risk assessments (via YOLOv8).
2. **Command Center (Dashboard):** Allows Barangay Captains and local officials to view a real-time, map-based overview of structural risks in their community to prioritize aid and inspections.

---

## ✨ Features

- **Role-Based Authentication:** Secure login for `residents` and `captains` powered by Supabase Auth.
- **Native Camera Integration:** Seamlessly triggers the mobile device's native camera for high-quality photo capturing.
- **AI Image Analysis:** Integrates with a FastAPI Python backend running YOLOv8 to detect rust, cracks, and old wood, classifying homes into Risk Levels (MATAAS, KATAMTAMAN, MABABA).
- **Interactive Risk Map:** A Leaflet.js-powered dashboard plotting assessed homes with color-coded risk markers.
- **Persistent Sessions:** Users remain logged in across sessions using Supabase's secure token management.
- **Responsive Design:** Mobile-first interface for residents, and a rich desktop dashboard for local officials.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Routing:** React Router v6
- **Database & Auth:** Supabase (PostgreSQL)
- **AI Backend API:** FastAPI (Python), YOLOv8
- **Maps:** Leaflet.js (via custom lazy-load hook)
- **Icons:** Lucide React
- **HTTP Client:** Axios

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- A running instance of the **Project Tipak FastAPI Backend** (AI Engine).
- A **Supabase** Project (for Database and Authentication).

### 1. Clone the repository
```bash
git clone [https://github.com/your-username/project-tipak-frontend.git](https://github.com/your-username/project-tipak-frontend.git)
cd project-tipak-frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory of the project (next to `package.json`) and add your backend connection details:

```env
# URL of your Python FastAPI AI Engine
VITE_API_BASE_URL="http://localhost:8000"

# Supabase Project Credentials
VITE_SUPABASE_URL="[https://your-project-id.supabase.co](https://your-project-id.supabase.co)"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 4. Run the Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

---

## 🔗 Backend Integration Requirements

To ensure this frontend works perfectly, your backends must meet the following criteria:

### Supabase Requirements:
- **Auth:** Email provider enabled.
- **Tables:** - `houses` (id, lat, lng, risk, color, owner, address, materials, details, date)
  - `assessments` (id, user_id, risk_level, findings, raw_data)
- **RLS Policies:** Configured to allow residents to insert assessments and captains to read house data.

### FastAPI Requirements:
- **CORS:** Enabled for the frontend's origin (`http://localhost:5173` or `*`).
- **Endpoints:**
  - `GET /health` - Returns `{ "status": "ok" }`.
  - `POST /analyze` - Accepts images via `multipart/form-data` and returns the `AnalysisResult` JSON.
  - `GET /assessments/{id}/recommendations` - Returns an array of Tagalog recommendation strings.

---

## 📂 Project Structure

```text
src/
├── assets/            # Static assets (logos, images)
├── components/        # Reusable UI components (Sidebar, StatCards, Map Panels)
├── hooks/             # Custom React hooks (useAuth, useNativeCamera, useLeaflet)
├── lib/               # Core utilities, API clients (api.ts, supabase.ts), Types
├── screens/           # Main page views
│   ├── Authentication # Login and Registration (AuthScreen)
│   ├── Dashboard      # Captain's Map Interface
│   ├── Submission     # Camera & Upload view for residents
│   └── Result         # AI Analysis output view
├── styles/            # Global CSS variables and resets
├── App.tsx            # App root & Route Guards (Protected Routes)
└── main.tsx           # React DOM mounting
```

---