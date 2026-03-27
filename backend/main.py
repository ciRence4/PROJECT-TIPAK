from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from supabase import create_client, Client
from datetime import datetime
from google import genai
from typing import Optional
import httpx
import os

from dotenv import load_dotenv
load_dotenv()

# ── ENV ──────────────────────────────────────────────
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
ROBOFLOW_PROJECT = os.getenv("ROBOFLOW_PROJECT")
ROBOFLOW_VERSION = os.getenv("ROBOFLOW_VERSION")
GEMINI_API_KEY   = os.getenv("GEMINI_API_KEY")
SUPABASE_URL     = os.getenv("SUPABASE_URL")
SUPABASE_KEY     = os.getenv("SUPABASE_KEY")

# ── CLIENTS ───────────────────────────────────────────
supabase: Client = None
gemini_client    = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global supabase, gemini_client
    supabase      = create_client(SUPABASE_URL, SUPABASE_KEY)
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    yield


app = FastAPI(
    title="Bahay Safety API",
    description="Structural risk assessment for Filipino homes",
    version="1.0.0",
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
# STEP 0 — PHOTO VALIDATION
# ════════════════════════════════════════════════════
def validate_photo(image_data: bytes) -> dict:
    import cv2
    import numpy as np

    nparr = np.frombuffer(image_data, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return {"valid": False, "reason": "Hindi ma-load ang larawan. Subukan muli.", "code": "INVALID_IMAGE"}

    gray       = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    brightness = float(np.mean(gray))

    if brightness < 40:
        return {"valid": False, "reason": "Masyadong madilim ang larawan. Pumunta sa mas maliwanag na lugar.", "code": "TOO_DARK"}
    if brightness > 220:
        return {"valid": False, "reason": "Masyadong maliwanag ang larawan. Iwasan ang direktang sikat ng araw.", "code": "TOO_BRIGHT"}

    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if blur_score < 80:
        return {"valid": False, "reason": "Malabo ang larawan. Siguraduhing hindi gumagalaw ang kamay mo.", "code": "TOO_BLURRY"}

    h, w = img.shape[:2]
    if w < 300 or h < 300:
        return {"valid": False, "reason": "Masyadong maliit ang larawan. Gumamit ng mas mataas na kalidad na camera.", "code": "TOO_SMALL"}

    return {"valid": True, "code": "OK"}


# ════════════════════════════════════════════════════
# STEP 1 — ROBOFLOW
# ════════════════════════════════════════════════════
async def run_roboflow(image_data: bytes) -> dict:
    import base64
    url = f"https://detect.roboflow.com/{ROBOFLOW_PROJECT}/{ROBOFLOW_VERSION}"
    image_base64 = base64.b64encode(image_data).decode("utf-8")

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            url,
            params={"api_key": ROBOFLOW_API_KEY},
            content=image_base64,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        response.raise_for_status()

    predictions = response.json().get("predictions", [])
    detections  = {"rust": [], "cracks": [], "old wood": []}

    for p in predictions:
        label = p["class"].lower()
        if p["confidence"] > 0.5 and label in detections:
            detections[label].append({
                "confidence": round(p["confidence"] * 100),
                "location": {
                    "x":      round(p["x"]),
                    "y":      round(p["y"]),
                    "width":  round(p["width"]),
                    "height": round(p["height"])
                }
            })

    summary_parts = []
    for defect, items in detections.items():
        if items:
            avg_conf = round(sum(i["confidence"] for i in items) / len(items))
            summary_parts.append(f"{len(items)} {defect} at avg {avg_conf}%")

    return {
        "detections":    detections,
        "summary":       ", ".join(summary_parts) if summary_parts else "No defects detected",
        "total_defects": sum(len(v) for v in detections.values())
    }


# ════════════════════════════════════════════════════
# STEP 2 — GEMINI ASSESSMENT
# ════════════════════════════════════════════════════
async def run_gemini_assessment(image_data: bytes, roboflow_results: dict) -> str:
    from google.genai import types
    import asyncio

    prompt = f"""You are a structural safety expert for Filipino homes. Analyze the image briefly.

Roboflow detected: Rust: {len(roboflow_results['detections']['rust'])}, Cracks: {len(roboflow_results['detections']['cracks'])}, Old Wood: {len(roboflow_results['detections']['old wood'])}

Reply in this exact format, keep each field to 1-2 sentences max:

PART 1 — MATERIAL DETECTION (English):
ROOFING:
WALLS:
FOUNDATION:
WINDOWS_DOORS:
OVERALL_BUILD:

PART 2
RISK_LEVEL: (MABABA, KATAMTAMAN, or MATAAS only)

MGA NAKITANG PROBLEMA:
- Kalawang/Rust:
- Mga Bitak/Cracks:
- Lumang Kahoy/Old Wood:
- Iba pa:

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
            prompt
        ]
    )
    return response.text


# ════════════════════════════════════════════════════
# STEP 3 — PARSE GEMINI OUTPUT
# ════════════════════════════════════════════════════
def parse_gemini_output(raw_text: str) -> dict:
    split_marker = "PART 2"
    if split_marker in raw_text:
        parts             = raw_text.split(split_marker, 1)
        material_findings = parts[0].replace("PART 1 — MATERIAL DETECTION (English):", "").strip()
        full_report       = parts[1].strip()
    else:
        material_findings = ""
        full_report       = raw_text

    risk_level = "KATAMTAMAN"
    upper      = full_report.upper()
    if "RISK_LEVEL: MABABA" in upper or "RISK_LEVEL: MAHINA" in upper:
        risk_level = "MABABA"
    elif "RISK_LEVEL: MATAAS" in upper or "RISK_LEVEL: MALAKAS" in upper:
        risk_level = "MATAAS"

    return {"material_findings": material_findings, "full_report": full_report, "risk_level": risk_level}


# ════════════════════════════════════════════════════
# STEP 4 — SAVE TO SUPABASE
# ════════════════════════════════════════════════════
def save_to_supabase(result: dict, resident_name: str = None, contact_number: str = None, address: str = None, latitude: float = None, longitude: float = None) -> str:
    risk_color = {"MATAAS": "#EF4444", "KATAMTAMAN": "#F59E0B", "MABABA": "#22C55E"}.get(result["risk_level"], "#F59E0B")

    row = {
        "created_at":        datetime.utcnow().isoformat(),
        "risk_level":        result["risk_level"],
        "total_defects":     result["total_defects"],
        "rust_count":        len(result["rust_detected"]),
        "cracks_count":      len(result["cracks_detected"]),
        "old_wood_count":    len(result["old_wood_detected"]),
        "material_findings": result["material_findings"],
        "full_report":       result["full_report"],
        "findings":          result["material_findings"],
        "raw_data":          result,
        "resident_name":     resident_name,
        "contact_number":    contact_number,
        "address":           address,
        "lat":               latitude,
        "lng":               longitude,
        "color":             risk_color,
    }
    response = supabase.table("assessments").insert(row).execute()
    return response.data[0]["id"] if response.data else None


# ════════════════════════════════════════════════════
# ROUTES
# ════════════════════════════════════════════════════

@app.get("/")
def root():
    return {"status": "ok", "message": "Bahay Safety API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(
    file:           UploadFile        = File(...),
    latitude:       Optional[float]   = Form(None),
    longitude:      Optional[float]   = Form(None),
    resident_name:  Optional[str]     = Form(None),
    contact_number: Optional[str]     = Form(None),
    address:        Optional[str]     = Form(None),
):
    image_data = await file.read()
    
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WebP images are accepted.")
    
    if len(image_data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image is too large. Maximum size is 10 MB.")

    # ── Step 0: Validate ─────────────────────────────
    validation = validate_photo(image_data)
    if not validation["valid"]:
        return JSONResponse(status_code=422, content={
            "valid":      False,
            "error_code": validation["code"],
            "message":    validation["reason"]
        })

    # ── Step 1: Roboflow ─────────────────────────────
    try:
        roboflow_results = await run_roboflow(image_data)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Roboflow error: {str(e)}")

    # ── Step 2: Gemini ───────────────────────────────
    try:
        raw_gemini_output = await run_gemini_assessment(image_data, roboflow_results)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini error: {str(e)}")

    # ── Step 3: Parse ────────────────────────────────
    parsed = parse_gemini_output(raw_gemini_output)

    result = {
        "valid":             True,
        "risk_level":        parsed["risk_level"],
        "material_findings": parsed["material_findings"],
        "rust_detected":     roboflow_results["detections"]["rust"],
        "cracks_detected":   roboflow_results["detections"]["cracks"],
        "old_wood_detected": roboflow_results["detections"]["old wood"],
        "total_defects":     roboflow_results["total_defects"],
        "full_report":       parsed["full_report"],
        "lat":               latitude,
        "lng":               longitude,
    }

    # ── Step 4: Save to Supabase ─────────────────────
    try:
        record_id = save_to_supabase(result, resident_name, contact_number, address, latitude, longitude)
        result["id"] = record_id
    except Exception as e:
        print(f"[WARNING] Supabase save failed: {e}")

    return result


@app.get("/houses")
def get_houses():
    response = (
        supabase.table("assessments")
        .select("id, resident_name, address, risk_level, material_findings, full_report, lat, lng, color, created_at")
        .not_.is_("lat", "null")
        .not_.is_("lng", "null")
        .order("created_at", desc=True)
        .execute()
    )

    houses = []
    for row in response.data:
        houses.append({
            "id":        row["id"],
            "lat":       row["lat"],
            "lng":       row["lng"],
            "risk":      row["risk_level"],
            "color":     row.get("color", "#F59E0B"),
            "owner":     row.get("resident_name", "Unknown"),
            "address":   row.get("address", "N/A"),
            "materials": row.get("material_findings", ""),
            "details":   row.get("full_report", ""),
            "date":      row["created_at"][:10] if row.get("created_at") else "",
        })

    return houses


@app.get("/assessments")
def get_assessments(limit: int = 20, offset: int = 0):
    response = (
        supabase.table("assessments")
        .select("id, created_at, resident_name, address, risk_level, total_defects, rust_count, cracks_count, old_wood_count, lat, lng")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return {"assessments": response.data, "count": len(response.data)}


@app.get("/assessments/{record_id}")
def get_assessment(record_id: str):
    response = supabase.table("assessments").select("*").eq("id", record_id).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    return response.data


@app.get("/assessments/{record_id}/recommendations")
def get_recommendations(record_id: str):
    if record_id == "latest":
        response = (
            supabase.table("assessments")
            .select("full_report")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        data = response.data[0] if response.data else {}
    else:
        response = supabase.table("assessments").select("full_report").eq("id", record_id).single().execute()
        data = response.data if response.data else {}

    if not data:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    full_report = data.get("full_report", "")
    recommendations = []

    if "MGA REKOMENDASYON:" in full_report:
        section = full_report.split("MGA REKOMENDASYON:")[1]
        for stop in ["BABALA", "PANGKALAHATANG", "SEVERITY"]:
            if stop in section:
                section = section.split(stop)[0]
        lines = [line.strip().lstrip("-").strip() for line in section.strip().splitlines()]
        recommendations = [l for l in lines if l]

    if not recommendations:
        recommendations = ["Makipag-ugnayan sa lokal na inhinyero para sa detalyadong inspeksyon."]

    return recommendations