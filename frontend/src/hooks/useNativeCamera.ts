// hooks/useNativeCamera.ts
import { useRef, useState, useCallback } from "react";

export const useNativeCamera = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 1. Trigger the native OS camera
  const openNativeCamera = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // 2. Handle the image when the OS hands it back
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return; // User cancelled or closed the camera

    try {
      // Create a temporary local URL to display the image instantly
      const imageUrl = URL.createObjectURL(file);
      setPhotos((prev) => [...prev, imageUrl]);
      setError(null);
    } catch (err) {
      setError("Hindi ma-process ang larawan. Subukan muli.");
      console.log(err);
    }
    
    // Reset input so the same file can be captured again if needed
    e.target.value = '';
  }, []);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => {
      // Clean up memory to avoid leaks
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const resetAll = useCallback(() => {
    photos.forEach(url => URL.revokeObjectURL(url));
    setPhotos([]);
    setError(null);
  }, [photos]);

  return {
    fileInputRef,
    photos,
    error,
    openNativeCamera,
    handleFileChange,
    removePhoto,
    resetAll,
  };
};