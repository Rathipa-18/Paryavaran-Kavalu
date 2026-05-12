import { useState, useEffect, useCallback } from 'react';

interface FusedLocation {
  lat: number;
  lng: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

interface LocationState {
  location: FusedLocation | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Custom hook that implements a robust location provider for web, 
 * analogous to Android's FusedLocationProviderClient.
 * 
 * Uses navigator.geolocation under the hood with high accuracy settings.
 */
export function useFusedLocation() {
  const [state, setState] = useState<LocationState>({
    location: null,
    error: null,
    isLoading: true,
  });

  const updateLocation = useCallback((position: GeolocationPosition) => {
    setState({
      location: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      },
      error: null,
      isLoading: false,
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = "An unknown error occurred while retrieving location.";
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "User denied the request for Geolocation.";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location information is unavailable.";
        break;
      case error.TIMEOUT:
        errorMessage = "The request to get user location timed out.";
        break;
    }
    setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setState({
        location: null,
        error: "Geolocation is not supported by this browser.",
        isLoading: false,
      });
      return;
    }

    // High accuracy options mimicking "PRIORITY_HIGH_ACCURACY" in FusedLocationProvider
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 30000, // Increased to 30s to allow GPS lock
      maximumAge: 0,
    };

    // Get last known location immediately
    navigator.geolocation.getCurrentPosition(updateLocation, handleError, options);

    // Start watching for location updates
    const watchId = navigator.geolocation.watchPosition(updateLocation, handleError, options);

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [updateLocation, handleError]);

  return state;
}
