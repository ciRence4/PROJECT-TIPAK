from google import genai
from google.genai import types
import requests
import os
import cv2
import numpy as np
from dotenv import load_dotenv

load_dotenv()

ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
ROBOFLOW_PROJECT = os.getenv("ROBOFLOW_PROJECT")
ROBOFLOW_VERSION = os.getenv("ROBOFLOW_VERSION")
GEMINI_API_KEY   = os.getenv("GEMINI_API_KEY")


# ══════════════════════════════════════════════════════
# STEP 0: PHOTO VALIDATION
# ══════════════════════════════════════════════════════
def validate_photo(image_data: bytes) -> dict:
    nparr = np.frombuffer(image_data, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return {"valid": False, "reason": "Hindi ma-load ang larawan. Subukan muli.", "code": "INVALID_IMAGE"}

    gray       = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    brightness = np.mean(gray)

    if brightness < 40:
        return {"valid": False, "reason": "Masyadong madilim ang larawan. Pumunta sa mas maliwanag na lugar at kumuha ulit ng litrato.", "code": "TOO_DARK"}
    if brightness > 220:
        return {"valid": False, "reason": "Masyadong maliwanag ang larawan (overexposed). Iwasan ang direktang sikat ng araw sa camera at kumuha ulit.", "code": "TOO_BRIGHT"}

    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
    if blur_score < 80:
        return {"valid": False, "reason": "Malabo ang larawan. Siguraduhing hindi gumagalaw ang kamay mo at kumuha ulit ng litrato.", "code": "TOO_BLURRY"}

    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLines(edges, 1, np.pi / 180, threshold=100)
    if lines is not None:
        angles = [abs(np.degrees(line[0][1]) - 90) for line in lines[:20]]
        if angles and np.mean(angles) > 20:
            return {"valid": False, "reason": "Masyadong nakatiling ang larawan. I-straighten ang camera at kumuha ulit ng litrato.", "code": "TOO_TILTED"}

    h, w = img.shape[:2]
    if w < 300 or h < 300:
        return {"valid": False, "reason": "Masyadong maliit ang larawan. Gumamit ng mas mataas na kalidad na camera.", "code": "TOO_SMALL"}

    return {
        "valid": True,
        "code":  "OK",
        "stats": {"brightness": round(brightness), "blur_score": round(blur_score), "resolution": f"{w}x{h}"}
    }


# ══════════════════════════════════════════════════════
# STEP 1: ROBOFLOW  (no mold)
# ══════════════════════════════════════════════════════
def run_roboflow(image_data: bytes) -> dict:
    response = requests.post(
        f"https://detect.roboflow.com/{ROBOFLOW_PROJECT}/{ROBOFLOW_VERSION}",
        params={"api_key": ROBOFLOW_API_KEY},
        data=image_data,
        headers={"Content-Type": "application/octet-stream"}
    )
    response.raise_for_status()
    predictions = response.json().get("predictions", [])

    detections = {
        "rust":     [],
        "cracks":   [],
        "old wood": []
    }

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
            summary_parts.append(f"{len(items)} {defect} detection(s) at avg {avg_conf}% confidence")

    return {
        "detections":    detections,
        "summary":       ", ".join(summary_parts) if summary_parts else "No defects detected",
        "total_defects": sum(len(v) for v in detections.values())
    }


# ══════════════════════════════════════════════════════
# STEP 2: GEMINI
# ══════════════════════════════════════════════════════
def run_gemini_assessment(client, image_data: bytes, roboflow_results: dict) -> str:
    prompt = f"""
You are a structural safety expert specializing in Filipino residential housing.

Your job has two parts:
1. Identify what the house is made of by looking at the image
2. Write a structural risk assessment in simple Filipino

You are also given defect detection results from an AI model (Roboflow)
that already scanned the image for rust, cracks, and old wood.

━━━━━━━━━━━━━━━━━━━━━━━━━
ROBOFLOW DEFECT DETECTION RESULTS:
{roboflow_results['summary']}

Defect counts:
- Rust:     {len(roboflow_results['detections']['rust'])} detection(s)
- Cracks:   {len(roboflow_results['detections']['cracks'])} detection(s)
- Old Wood: {len(roboflow_results['detections']['old wood'])} detection(s)
━━━━━━━━━━━━━━━━━━━━━━━━━

PART 1 — MATERIAL DETECTION (English):
Look at the image and identify what the house is made of.

ROOFING: (e.g. GI sheet/yero, concrete, clay tiles, wood, asbestos)
WALLS: (e.g. hollow blocks/CHB, wood, plywood, bamboo, concrete)
FOUNDATION: (e.g. concrete slab, stilts/haligi, unknown)
WINDOWS_DOORS: (e.g. wood, jalousie, steel, none visible)
OVERALL_BUILD: (e.g. permanent, semi-permanent, makeshift/informal)

━━━━━━━━━━━━━━━━━━━━━━━━━

PART 2 — RISK ASSESSMENT (simple Filipino):
Based on what you see in the image AND the Roboflow defect results above,
write a structural risk assessment for this Filipino household.

RISK_LEVEL: (one word only — MAHINA, KATAMTAMAN, or MALAKAS)

MGA NAKITANG PROBLEMA:
- Kalawang/Rust: (ilarawan kung gaano kalala)
- Mga Bitak/Cracks: (ilarawan kung gaano kalala)
- Lumang Kahoy/Old Wood: (ilarawan kung gaano kalala)
- Iba pa: (kung may nakita kang iba)

SEVERITY_NOTES:
- (Ipaliwanag kung bakit mapanganib ang bawat problema
   lalo na sa mga bagyo, malakas na ulan, at lindol sa Pilipinas)

MGA REKOMENDASYON:
- (Mga praktikal at abot-kayang solusyon para sa may-ari ng bahay)
- (Ilagay ang pinaka-urgent na ayusin muna)

BABALA SA BAGYO AT LINDOL:
(1-2 pangungusap tungkol sa kaya ng bahay sa bagyo o lindol
 batay sa mga materyales at depekto na nakita)

PANGKALAHATANG SYNOPSIS:
(2-3 pangungusap na buod ng kondisyon ng bahay sa simpleng Filipino)
"""

    response = client.models.generate_content(
        model="gemini-2.0-flash-lite",
        contents=[
            types.Part.from_bytes(data=image_data, mime_type="image/jpeg"),
            prompt
        ]
    )
    return response.text


# ══════════════════════════════════════════════════════
# STEP 3: PARSE
# ══════════════════════════════════════════════════════
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
    if "RISK_LEVEL: MAHINA" in upper:
        risk_level = "MAHINA"
    elif "RISK_LEVEL: MALAKAS" in upper:
        risk_level = "MALAKAS"

    return {"material_findings": material_findings, "full_report": full_report, "risk_level": risk_level}


# ══════════════════════════════════════════════════════
# MAIN ENTRY POINT
# ══════════════════════════════════════════════════════
def analyze_image(image_path: str) -> dict:
    with open(image_path, "rb") as f:
        image_data = f.read()

    validation = validate_photo(image_data)
    if not validation["valid"]:
        return {"valid": False, "error_code": validation["code"], "message": validation["reason"]}

    roboflow_results  = run_roboflow(image_data)
    client            = genai.Client(api_key=GEMINI_API_KEY)
    raw_gemini_output = run_gemini_assessment(client, image_data, roboflow_results)
    parsed            = parse_gemini_output(raw_gemini_output)

    return {
        "valid":             True,
        "risk_level":        parsed["risk_level"],
        "material_findings": parsed["material_findings"],
        "rust_detected":     roboflow_results["detections"]["rust"],
        "cracks_detected":   roboflow_results["detections"]["cracks"],
        "old_wood_detected": roboflow_results["detections"]["old wood"],
        "total_defects":     roboflow_results["total_defects"],
        "full_report":       parsed["full_report"],
        "raw_gemini_output": raw_gemini_output
    }