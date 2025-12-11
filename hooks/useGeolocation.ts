
import { useState, useEffect } from 'react';
import { LocationData } from '../types';

export const useGeolocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Геолокация не поддерживается вашим браузером");
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      // Basic filtering to avoid jitters could be added here, but raw data is usually preferred for navigation
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        heading: position.coords.heading,
        speed: position.coords.speed
      });
      setError(null);
    };

    const handleError = (error: GeolocationPositionError) => {
      console.warn("Geolocation error:", error.message);
      setError(error.message);
    };

    // Initial fetch
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    });

    // Watch for changes
    const watcher = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      // Update slightly more aggressively but allow for some timeout
      timeout: 20000, 
      maximumAge: 0 // Do not use cached positions
    });

    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  return { location, error };
};
