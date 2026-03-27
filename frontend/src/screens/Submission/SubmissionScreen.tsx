import React, { useState, useEffect } from "react";
import {
  Camera,
  Shield,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  ImagePlus,
  MapPin,
  Loader2
} from "lucide-react";
import type { NavigateProps } from "../../lib/types";
import { useNativeCamera } from "../../hooks/useNativeCamera";
import { api } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import "./SubmissionScreen.css";

const MIN_PHOTOS = 4;

const SubmissionScreen: React.FC<NavigateProps> = ({ navigate }) => {
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // ─── NEW: Location State ──────────────────────────────────────────────────
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const {
    fileInputRef,
    photos,
    error,
    openNativeCamera,
    handleFileChange,
    removePhoto,
    resetAll,
  } = useNativeCamera();

  const canSubmit = photos.length >= MIN_PHOTOS && location !== null;
  const remaining = Math.max(0, MIN_PHOTOS - photos.length);
  const isBusy    = isLoading;
  const latestPhoto = photos.length > 0 ? photos[photos.length - 1] : null;
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Hindi suportado ng iyong browser ang geolocation.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
      },
      (err) => {
        console.warn("Location error:", err.message);
        setLocationError("Hindi makuha ang lokasyon. Pakisuri ang iyong GPS/settings.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);

  const handleProcessSubmit = async (): Promise<void> => {
    if (isBusy || !canSubmit || !userId) return;
    setIsLoading(true);
    try {
      const analysisResult = await api.analyzeImages(photos);
      await api.saveAssessment(userId, analysisResult);
      navigate("/result", { state: { analysisData: analysisResult, location } });
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sub">
      <div className="sub__bg-orb sub__bg-orb--1" aria-hidden="true" />
      <div className="sub__bg-orb sub__bg-orb--2" aria-hidden="true" />

      <header className="sub__header">
        <div className="sub__logo">
          <img src="/src/assets/tipak.png" alt="Tipak Logo" />
          <div className="sub__logo-text">Project Tipak</div>
        </div>
      </header>

      <main className="sub__body">
        <h1 className="sub__headline">
          Suriin ang <em>iyong bahay</em> ngayon.
        </h1>

        <p className="sub__subtext">
          Kumuha ng {MIN_PHOTOS} larawan ng iyong tahanan para sa libreng AI
          structural assessment.
        </p>

        {/* ─── NEW: Location Indicator ────────────────────────────────────── */}
        <div 
          className="sub__location-indicator" 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '6px', 
            fontSize: '0.75rem', marginBottom: '16px',
            color: locationError ? '#dc2626' : 'var(--c-navy)',
            opacity: 0.85, fontWeight: 500
          }}
        >
          <MapPin size={14} />
          {location ? (
            <span>GPS: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
          ) : locationError ? (
            <span>{locationError}</span>
          ) : (
            <>
              <Loader2 size={12} className="auth__icon-spin" />
              <span>Kumukuha ng lokasyon...</span>
            </>
          )}
        </div>

        {/* Progress dots */}
        <div
          className="sub__progress"
          aria-label={`${photos.length} ng ${MIN_PHOTOS} larawan`}
        >
          {Array.from({ length: MIN_PHOTOS }).map((_, i) => (
            <span
              key={i}
              className={`sub__progress-dot${i < photos.length ? " sub__progress-dot--filled" : ""}`}
              aria-hidden="true"
            />
          ))}
          <span className="sub__progress-label">
            {canSubmit ? (
              <>
                <CheckCircle size={12} strokeWidth={2} />
                Handa na para isumite
              </>
            ) : photos.length >= MIN_PHOTOS && !location ? (
              "Naghihintay ng GPS lokasyon..."
            ) : (
              `${remaining} larawan pa ang kailangan`
            )}
          </span>
        </div>

        {/* Error banner */}
        {error && (
          <div className="sub__alert" role="alert">
            <AlertCircle size={14} strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        {/* Viewfinder Area */}
        <div
          className="sub__viewfinder"
          role="img"
          aria-label="Latest photo preview"
          onClick={openNativeCamera}
          style={{ cursor: "pointer" }}
        >
          {latestPhoto ? (
            <img 
              src={latestPhoto} 
              alt="Pinakabagong kuha" 
              className="sub__media" 
              style={{ objectFit: "cover", width: "100%", height: "100%", display: "block" }}
            />
          ) : (
            <>
              <div className="sub__viewfinder-grid" aria-hidden="true" />
              <div className="sub__viewfinder-vignette" aria-hidden="true" />
              <span className="sub__corner sub__corner--tl" aria-hidden="true" />
              <span className="sub__corner sub__corner--tr" aria-hidden="true" />
              <span className="sub__corner sub__corner--bl" aria-hidden="true" />
              <span className="sub__corner sub__corner--br" aria-hidden="true" />

              <Camera
                size={54}
                strokeWidth={1.2}
                className="sub__viewfinder-icon"
              />
              <span className="sub__viewfinder-label">
                Pindutin para buksan ang kamera
              </span>
            </>
          )}

          {photos.length > 0 && (
            <span className="sub__shot-count" aria-hidden="true">
              {photos.length}/{MIN_PHOTOS}
            </span>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {/* Thumbnail strip */}
        {photos.length > 0 && (
          <div className="sub__thumbnails" aria-label="Mga kuha">
            {photos.map((src, i) => (
              <div key={i} className="sub__thumb">
                <img src={src} alt={`Larawan ${i + 1}`} className="sub__thumb-img" />
                <button
                  className="sub__thumb-remove"
                  onClick={() => removePhoto(i)}
                  disabled={isBusy}
                  aria-label={`Alisin ang larawan ${i + 1}`}
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
                <span className="sub__thumb-num">{i + 1}</span>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="sub__controls">
          <button
            className="sub__btn sub__btn--icon"
            onClick={openNativeCamera}
            disabled={isBusy}
            aria-label="Kuhanan ng litrato"
          >
            {photos.length > 0 ? (
               <ImagePlus size={22} strokeWidth={2} />
            ) : (
               <Camera size={22} strokeWidth={2} />
            )}
          </button>

          {photos.length > 0 && (
            <button
              className="sub__btn sub__btn--outline sub__btn--icon"
              onClick={resetAll}
              disabled={isBusy}
              aria-label="I-reset lahat"
            >
              <RefreshCw size={22} strokeWidth={2} />
            </button>
          )}

          {canSubmit && (
            <button
              className="sub__btn sub__btn--text"
              onClick={handleProcessSubmit}
              disabled={isBusy}
            >
              {isLoading ? (
                <>
                  <span className="sub__spinner" aria-hidden="true" />
                  Sinusuri...
                </>
              ) : (
                "I-submit para sa Pagsusuri"
              )}
            </button>
          )}
        </div>

        <div className="sub__footer" aria-label="Privacy note">
          <Shield size={11} color="var(--c-navy)" opacity={0.45} aria-hidden="true" />
          <span className="sub__footer-text">
            Ligtas at kumpidensyal ang lahat ng datos
          </span>
        </div>
      </main>
    </div>
  );
};

export default SubmissionScreen;