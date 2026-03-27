import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Activity,
  CheckCircle2,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

import type { NavigateProps, AnalysisResult } from "../../lib/types";
import { api } from "../../lib/api";
import "./ResultScreen.css";

const ResultScreen: React.FC<NavigateProps> = ({ navigate }) => {
  const location = useLocation();
  const analysisData = location.state?.analysisData as
    | AnalysisResult
    | undefined;

  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* ---------------- FORMATTERS ---------------- */

  const formatSummary = (text?: string) => {
    if (!text) return [];

    return text.split("\n").map((line, index) => {
      const [title, content] = line.split(":");

      if (!content) return null;

      return (
        <div key={index} className="res__summary-block">
          <p className="res__summary-title">
            {title.replace("_", " ")}
          </p>

          <p className="res__summary-desc">
            {content.trim()}
          </p>
        </div>
      );
    });
  };

  const cleanRecommendations = (recs: string[]) => {
    return recs.map((r) => r.replace(/\*\*/g, ""));
  };

  /* ---------------- FETCH ---------------- */

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const recs = await api.getRecommendations();
        setRecommendations(cleanRecommendations(recs));
      } catch (error) {
        console.error("Failed to load recommendations", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, []);

  /* ---------------- RISK ---------------- */

  const getRiskDisplay = (risk?: string) => {
    const r = risk?.toUpperCase();

    if (r === "MATAAS" || r === "HIGH") {
      return { label: "Mataas", colorClass: "high" };
    }

    if (r === "MABABA" || r === "LOW") {
      return { label: "Mababa", colorClass: "low" };
    }

    return { label: "Katamtaman", colorClass: "moderate" };
  };

  const riskDisplay = getRiskDisplay(analysisData?.risk_level);

  return (
    <div className="res">
      {/* HEADER */}
      <header className="res__header">
        <button className="res__back-btn" onClick={() => navigate("/")}>
          <ArrowLeft size={16} />
        </button>

        <div>
          <h2 className="res__header-title">Resulta ng Pagsusuri</h2>
          <p className="res__header-sub">
            Project Tipak AI Assessment
          </p>
        </div>
      </header>

      <main className="res__body">
        {/* RISK */}
        <section className="res__risk-card">
          <p className="res__risk-eyebrow">Antas ng Panganib</p>

          <h1 className="res__risk-level">{riskDisplay.label}</h1>

          <div
            className={`res__risk-indicator ${riskDisplay.colorClass}`}
          >
            <span className="res__risk-dot" />
            <span className="res__risk-indicator-text">
              {analysisData?.risk_level || "KATAMTAMAN"} na Risk
            </span>
          </div>
        </section>

        {/* IMAGE */}
        <section className="res__card res__image-card">
          <p className="res__card-eyebrow">
            <ImageIcon size={12} />
            Pagsusuri ng Imahe (YOLOv8)
          </p>

          <div className="res__image-container">
            <img
              src={
                analysisData?.image_url ||
                "https://placehold.co/800x600"
              }
              alt="AI Analysis"
              className="res__analysis-image"
            />
          </div>
        </section>

        {/* SUMMARY (FORMATTED) */}
        <section className="res__card res__summary-card">
          <p className="res__card-eyebrow">
            <Activity size={12} />
            Buod ng AI
          </p>

          <div className="res__summary-structured">
            {formatSummary(analysisData?.material_findings)}
          </div>
        </section>

        {/* RECOMMENDATIONS */}
        <section className="res__card res__recs-card">
          <p className="res__card-eyebrow">
            <CheckCircle2 size={12} />
            Mga Rekomendasyon
          </p>

          {isLoading ? (
            <div className="res__loading-state">
              <Loader2 size={16} className="spin" />
              Loading...
            </div>
          ) : (
            <ul className="res__recs">
              {recommendations.map((rec, i) => (
                <li key={i} className="res__rec">
                  <div className="res__rec-bullet">
                    <ChevronRight size={12} />
                  </div>
                  <span className="res__rec-text">{rec}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* BUTTON */}
        <button className="res__cta" onClick={() => navigate("/")}>
          <ArrowLeft size={16} />
          Bumalik sa Simula
        </button>
      </main>
    </div>
  );
};

export default ResultScreen;