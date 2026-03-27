import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ArrowLeft, Activity, CheckCircle2, ChevronRight, Image as ImageIcon, Loader2 } from "lucide-react";
import type { NavigateProps, AnalysisResult } from "../../lib/types";
import { api } from "../../lib/api";
import "./ResultScreen.css";

/**
 * Resident Portal Result Screen.
 * Displays the AI structural risk assessment result with data fetched directly 
 * from the FastAPI backend (passed via router state).
 */
const ResultScreen: React.FC<NavigateProps> = ({ navigate }) => {
  const location = useLocation();
  
  // Grab the data passed from the navigate() function in SubmissionScreen
  const analysisData = location.state?.analysisData as AnalysisResult | undefined;

  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the recommendations list
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const recs = await api.getRecommendations();
        setRecommendations(recs);
      } catch (error) {
        console.error("Failed to load recommendations", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, []);

  // Helper function to handle Tagalog translation / formatting for the UI
  const getRiskDisplay = (risk?: string) => {
    switch (risk?.toUpperCase()) {
      case "MATAAS":
      case "HIGH":
        return { label: "Mataas", colorClass: "res__risk-indicator--high" };
      case "MABABA":
      case "LOW":
        return { label: "Mababa", colorClass: "res__risk-indicator--low" };
      case "KATAMTAMAN":
      case "MODERATE":
      default:
        return { label: "Katamtaman", colorClass: "res__risk-indicator--moderate" };
    }
  };

  const riskDisplay = getRiskDisplay(analysisData?.risk_level);

  return (
    <div className="res">
      <header className="res__header">
        <button
          className="res__back-btn"
          onClick={() => navigate("/")}
          aria-label="Bumalik sa simula"
        >
          <ArrowLeft size={16} strokeWidth={2} />
        </button>
        <div>
          <div className="res__header-title">Resulta ng Pagsusuri</div>
          <div className="res__header-sub">Project Tipak AI Assessment</div>
        </div>
      </header>

      <main className="res__body">
        {/* Risk Level Card */}
        <section className="res__risk-card" aria-label={`Risk level: ${riskDisplay.label}`}>
          <p className="res__risk-eyebrow">Antas ng Panganib</p>
          <h1 className="res__risk-level">{riskDisplay.label}</h1>
          <div className={`res__risk-indicator ${riskDisplay.colorClass}`}>
            <span className="res__risk-dot" aria-hidden="true" />
            <span className="res__risk-indicator-text">
              {analysisData?.risk_level || "KATAMTAMAN"} Risk
            </span>
          </div>
        </section>

        {/* YOLOv8 Image Analysis Section */}
        <section className="res__card res__image-card" aria-label="Visual Analysis">
          <p className="res__card-eyebrow">
            <ImageIcon size={11} aria-hidden="true" />
            Pagsusuri ng Imahe (YOLOv8)
          </p>
          <div className="res__image-container">
            {/* If your backend eventually returns an annotated image URL in AnalysisResult,
              you can replace this placeholder with: src={analysisData?.annotated_image_url} 
            */}
            <img 
              src="https://placehold.co/600x400/1e293b/e2e8f0?text=YOLOv8+Analysis+Image" 
              alt="AI annotated structural analysis" 
              className="res__analysis-image"
            />
          </div>
        </section>

        {/* Text Summary Card */}
        <section className="res__card" aria-label="AI summary">
          <p className="res__card-eyebrow">
            <Activity size={11} aria-hidden="true" />
            Buod ng AI
          </p>
          {/* Using white-space: pre-wrap so the newline characters (\n) from your FastAPI format properly */}
          <p className="res__summary-text" style={{ whiteSpace: "pre-wrap" }}>
            {analysisData?.material_findings || 
              "May nakitang kalawang sa yero at maliliit na bitak sa pader. Pinapayuhan na suriin ito bago ang susunod na bagyo."}
          </p>
        </section>

        {/* Recommendations Card */}
        <section className="res__card" aria-label="Recommendations">
          <p className="res__card-eyebrow">
            <CheckCircle2 size={11} aria-hidden="true" />
            Mga Rekomendasyon
          </p>
          
          {isLoading ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', opacity: 0.5, fontSize: '0.85rem' }}>
              <Loader2 size={16} className="auth__icon-spin" /> Kinukuha ang mga rekomendasyon...
            </div>
          ) : (
            <ul className="res__recs" role="list">
              {recommendations.map((rec, i) => (
                <li key={i} className="res__rec">
                  <span className="res__rec-bullet" aria-hidden="true">
                    <ChevronRight size={11} color="#e9b26e" strokeWidth={2.5} />
                  </span>
                  <span className="res__rec-text">{rec}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <button className="res__cta" onClick={() => navigate("/")}>
          <ArrowLeft size={15} strokeWidth={2} />
          Bumalik sa Simula
        </button>
      </main>
    </div>
  );
};

export default ResultScreen;