import os
import time
import httpx
import cv2
import numpy as np
import base64
from uuid import uuid4
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from supabase import create_client, Client
from google import genai
from dotenv import load_dotenv

load_dotenv()

# ── ENV CONFIG ────────────────────────────────────────
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
ROBOFLOW_PROJECT = os.getenv("ROBOFLOW_PROJECT")
ROBOFLOW_VERSION = os.getenv("ROBOFLOW_VERSION")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "assessment-images")

# ── CLIENT INITIALIZATION ─────────────────────────────
supabase: Client = None
gemini_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global supabase, gemini_client
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    print("🚀 Clients initialized. API is ready.")
    yield

app = FastAPI(
    title="Bahay Safety API",
    description="Structural risk assessment for Filipino homes",
    version="1.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ════════════════════════════════════════════════════
# HELPER: PHOTO VALIDATION
# ════════════════════════════════════════════════════
def validate_photo(image_data: bytes) -> dict:
    nparr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return {
            "valid": False,
            "reason": "Hindi ma-load ang larawan.",
            "code": "INVALID_IMAGE",
        }

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    brightness = float(np.mean(gray))

    if brightness < 40:
        return {
            "valid": False,
            "reason": "Masyadong madilim ang larawan.",
            "code": "TOO_DARK",
        }
    if brightness > 220:
        return {
            "valid": False,
            "reason": "Masyadong maliwanag ang larawan.",
            "code": "TOO_BRIGHT",
        }

    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if blur_score < 80:
        return {
            "valid": False,
            "reason": "Malabo ang larawan.",
            "code": "TOO_BLURRY",
        }

    return {"valid": True, "code": "OK"}

def build_image_url(image_data: bytes, mime_type: str = "image/jpeg") -> str:
    encoded = base64.b64encode(image_data).decode("utf-8")
    return f"data:{mime_type};base64,{encoded}"

# ════════════════════════════════════════════════════
# STEP 1: ROBOFLOW INFERENCE
# ════════════════════════════════════════════════════
async def run_roboflow(image_data: bytes) -> dict:
    url = f"https://detect.roboflow.com/{ROBOFLOW_PROJECT}/{ROBOFLOW_VERSION}"
    image_base64 = base64.b64encode(image_data).decode("utf-8")

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            url,
            params={"api_key": ROBOFLOW_API_KEY},
            content=image_base64,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        response.raise_for_status()

    predictions = response.json().get("predictions", [])
    detections = {"rust": [], "cracks": [], "old wood": []}

    for p in predictions:
        label = p["class"].lower()
        if p["confidence"] > 0.5 and label in detections:
            detections[label].append(
                {
                    "confidence": round(p["confidence"] * 100),
                    "location": {
                        "x": round(p["x"]),
                        "y": round(p["y"]),
                        "w": round(p["width"]),
                        "h": round(p["height"]),
                    },
                }
            )

    return {
        "detections": detections,
        "total_defects": sum(len(v) for v in detections.values()),
    }

# ════════════════════════════════════════════════════
# STEP 2: GEMINI ASSESSMENT
# ════════════════════════════════════════════════════
async def run_gemini_assessment(image_data: bytes, roboflow_results: dict) -> str:
    from google.genai import types
    import asyncio

    prompt = f"""You are a structural safety expert for Filipino homes. Analyze the image.
Roboflow detected: Rust: {len(roboflow_results['detections']['rust'])},
Cracks: {len(roboflow_results['detections']['cracks'])},
Old Wood: {len(roboflow_results['detections']['old wood'])}

Format strictly as follows:
PART 1 — MATERIAL DETECTION (English):
ROOFING:
WALLS:
FOUNDATION:
WINDOWS_DOORS:
OVERALL_BUILD:

PART 2
RISK_LEVEL: (MABABA, KATAMTAMAN, or MATAAS)
MGA NAKITANG PROBLEMA:
-
MGA REKOMENDASYON:
-
BABALA SA BAGYO AT LINDOL:
PANGKALAHATANG SYNOPSIS:
"""

    response = await asyncio.to_thread(
        gemini_client.models.generate_content,
        model="gemini-2.5-pro",
        contents=[
            types.Part.from_bytes(data=image_data, mime_type="image/jpeg"),
            prompt,
        ],
    )
    return response.text

# ════════════════════════════════════════════════════
# STEP 3: PARSING & DB
# ════════════════════════════════════════════════════
def parse_gemini_output(raw_text: str) -> dict:
    parts = raw_text.split("PART 2")
    material_findings = (
        parts[0].replace("PART 1 — MATERIAL DETECTION (English):", "").strip()
        if len(parts) > 1
        else ""
    )
    full_report = parts[1].strip() if len(parts) > 1 else raw_text

    risk_level = "KATAMTAMAN"
    if "RISK_LEVEL: MABABA" in full_report.upper():
        risk_level = "MABABA"
    elif "RISK_LEVEL: MATAAS" in full_report.upper():
        risk_level = "MATAAS"

    return {
        "material_findings": material_findings,
        "full_report": full_report,
        "risk_level": risk_level,
    }

def save_to_supabase(
    result: dict,
    resident_name: Optional[str],
    contact: Optional[str],
    address: Optional[str],
    lat: Optional[float],
    lng: Optional[float],
):
    color = {
        "MATAAS": "#EF4444",
        "KATAMTAMAN": "#F59E0B",
        "MABABA": "#22C55E",
    }.get(result["risk_level"], "#F59E0B")

    row = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "risk_level": result["risk_level"],
        "total_defects": result["total_defects"],
        "rust_count": len(result["rust_detected"]),
        "cracks_count": len(result["cracks_detected"]),
        "old_wood_count": len(result["old_wood_detected"]),
        "material_findings": result["material_findings"],
        "full_report": result["full_report"],
        "image_url": result.get("image_url"),
        "resident_name": resident_name,
        "contact_number": contact,
        "address": address,
        "lat": lat,
        "lng": lng,
        "color": color,
    }
    return supabase.table("assessments").insert(row).execute()

# ════════════════════════════════════════════════════
# CORE ANALYZE ROUTE
# ════════════════════════════════════════════════════
@app.post("/analyze")
async def analyze(
    image: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    resident_name: Optional[str] = Form(None),
    contact_number: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
):
    total_start = time.time()
    print(f"--- 📸 Analysis Start: {image.filename} ---")

    image_data = await image.read()
    mime_type = image.content_type or "image/jpeg"
    image_url = build_image_url(image_data, mime_type)

    # 0. Validate
    v_res = validate_photo(image_data)
    if not v_res["valid"]:
        return JSONResponse(status_code=422, content=v_res)

    # 1. Roboflow
    rf_start = time.time()
    try:
        rf_res = await run_roboflow(image_data)
        print(f"⏱️ Roboflow: {time.time() - rf_start:.2f}s")
    except Exception as e:
        print(f"❌ Roboflow Error: {e}")
        raise HTTPException(status_code=502, detail="Roboflow failed.")

    # 2. Gemini
    gem_start = time.time()
    try:
        raw_report = await run_gemini_assessment(image_data, rf_res)
        print(f"⏱️ Gemini: {time.time() - gem_start:.2f}s")
    except Exception as e:
        print(f"❌ Gemini Error: {e}")
        raise HTTPException(status_code=502, detail="Gemini failed.")

    # 3. Parse & Finalize
    parsed = parse_gemini_output(raw_report)
    result = {
        "valid": True,
        "risk_level": parsed["risk_level"],
        "material_findings": parsed["material_findings"],
        "rust_detected": rf_res["detections"]["rust"],
        "cracks_detected": rf_res["detections"]["cracks"],
        "old_wood_detected": rf_res["detections"]["old wood"],
        "total_defects": rf_res["total_defects"],
        "full_report": parsed["full_report"],
        "lat": latitude,
        "lng": longitude,
        "image_url": image_url,
    }

    # 4. Save
    try:
        db_res = save_to_supabase(
            result,
            resident_name,
            contact_number,
            address,
            latitude,
            longitude,
        )
        result["id"] = db_res.data[0]["id"] if db_res.data else None
    except Exception as e:
        print(f"⚠️ DB Save Warning: {e}")

    print(f"✅ Total Cycle: {time.time() - total_start:.2f}s")
    print("-----------------------------------------")
    return result

# ════════════════════════════════════════════════════
# UTILITY ROUTES
# ════════════════════════════════════════════════════
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/houses")
def get_houses():
    res = (
        supabase.table("assessments")
        .select("*")
        .not_.is_("lat", "null")
        .order("created_at", desc=True)
        .execute()
    )
    return [
        {
            "id": r["id"],
            "lat": r["lat"],
            "lng": r["lng"],
            "risk": r["risk_level"],
            "color": r["color"],
            "owner": r["resident_name"],
            "image_url": r.get("image_url"),
        }
        for r in res.data
    ]

@app.get("/assessments/{record_id}/recommendations")
def get_recommendations(record_id: str):
    if record_id == "latest":
        query = (
            supabase.table("assessments")
            .select("full_report")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
    else:
        query = (
            supabase.table("assessments")
            .select("full_report")
            .eq("id", record_id)
            .single()
            .execute()
        )

    report = query.data[0]["full_report"] if isinstance(query.data, list) else query.data.get("full_report", "")

    if "MGA REKOMENDASYON:" in report:
        return [
            line.strip("- ")
            for line in report.split("MGA REKOMENDASYON:")[1].split("BABALA")[0].strip().splitlines()
            if line.strip()
        ]

    return ["Kumonsulta sa isang civil engineer para sa masusing pag-aaral."]