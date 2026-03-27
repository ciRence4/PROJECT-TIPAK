// src/screens/Submission/SubmissionScreen.tsx
import React, { useState, useEffect } from "react";
import {
  Camera, Shield, RefreshCw, X, CheckCircle,
  AlertCircle, ImagePlus, MapPin, Loader2
} from "lucide-react";
import type { NavigateProps } from "../../lib/types";
import { useNativeCamera } from "../../hooks/useNativeCamera";
import { api } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import "./SubmissionScreen.css";

const MIN_PHOTOS = 1;

const SubmissionScreen: React.FC<NavigateProps> = ({ navigate }) => {
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Resident form state
  const [ownerName, setOwnerName] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState(""); // 👈 New state

  const {
    fileInputRef, photos, error, openNativeCamera,
    handleFileChange, removePhoto, resetAll,
  } = useNativeCamera();

  // Submission is valid if photos exist, GPS is found, and ALL form fields are filled
  const canSubmit = 
    photos.length >= MIN_PHOTOS && 
    location !== null && 
    ownerName.trim() !== "" && 
    address.trim() !== "" &&
    contactNumber.trim() !== ""; // 👈 Added validation
    
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
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
    );
  }, []);

  const handleProcessSubmit = async (): Promise<void> => {
    if (isBusy || !canSubmit) return;
    setIsLoading(true);
    try {
      // 👈 Pass the contact number to the API
      const analysisResult = await api.analyzeImages(photos, location, ownerName, address, contactNumber);
      
      await api.saveAssessment(userId || "anonymous-resident", analysisResult);
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
        <button className="sub__captain-login-btn" onClick={() => navigate("/auth")}>
          <Shield size={14} />
          <span>Captain Login</span>
        </button>
      </header>

      <main className="sub__body">
        <h1 className="sub__headline">
          Suriin ang <em>iyong bahay</em> ngayon.
        </h1>

        <p className="sub__subtext">
          Punan ang iyong detalye at kumuha ng {MIN_PHOTOS} larawan ng iyong tahanan para sa libreng AI structural assessment.
        </p>
        
        {/* Resident Form Input */}
        <div className="sub__resident-form">
          <div className="sub__input-group">
            <label>Pangalan</label>
            <input 
              type="text" 
              placeholder="Hal: Juan Dela Cruz" 
              value={ownerName} 
              onChange={(e) => setOwnerName(e.target.value)}
              disabled={isBusy}
            />
          </div>
          
          {/* 👈 New Contact Number Input */}
          <div className="sub__input-group">
            <label>Contact Number</label>
            <input 
              type="tel" 
              placeholder="Hal: 09123456789" 
              value={contactNumber} 
              onChange={(e) => setContactNumber(e.target.value)}
              disabled={isBusy}
            />
          </div>

          <div className="sub__input-group">
            <label>Kumpletong Tirahan</label>
            <input 
              type="text" 
              placeholder="Hal: 123 Rizal St., Brgy. 654" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)}
              disabled={isBusy}
            />
          </div>
        </div>

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

        <div className="sub__progress" aria-label={`${photos.length} ng ${MIN_PHOTOS} larawan`}>
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
            ) : photos.length >= MIN_PHOTOS && (!ownerName || !address || !contactNumber) ? (
              "Punan ang mga detalye sa itaas"
            ) : (
              `${remaining} larawan pa ang kailangan`
            )}
          </span>
        </div>

        {error && (
          <div className="sub__alert" role="alert">
            <AlertCircle size={14} strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

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

              <Camera size={54} strokeWidth={1.2} className="sub__viewfinder-icon" />
              <span className="sub__viewfinder-label">Pindutin para buksan ang kamera</span>
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