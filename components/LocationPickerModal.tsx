
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Search, Check, Navigation, Image as ImageIcon, Map as MapIcon, Loader2, AlertCircle, LocateFixed, Locate } from 'lucide-react';
import { UI_STRINGS } from '../constants';
import { Language, LocationData } from '../types';
import { getAddressFromCoordinates } from '../services/gemini';
import { getGoogleStreetViewImage } from '../services/external';

declare global {
  interface Window {
    L: any;
    google: any;
    initMap: () => void;
    gm_authFailure: () => void;
  }
}

interface Props {
  initialLocation: LocationData | null;
  onSelectLocation: (loc: LocationData, snapshotUrl?: string) => void;
  onResetToGPS: () => void; // New prop to restore real GPS
  onClose: () => void;
  language: Language;
  googleMapsKey?: string;
}

export const LocationPickerModal: React.FC<Props> = ({ initialLocation, onSelectLocation, onResetToGPS, onClose, language, googleMapsKey }) => {
  const t = UI_STRINGS[language];
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const leafletMapRef = useRef<any>(null);
  
  // 'google' | 'leaflet' | 'loading'
  const [provider, setProvider] = useState<'google' | 'leaflet' | 'loading'>('loading');
  const [center, setCenter] = useState(initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : { lat: 48.8566, lng: 2.3522 });
  const [searchQuery, setSearchQuery] = useState('');
  const [address, setAddress] = useState('');
  const [isStreetView, setIsStreetView] = useState(false);
  const [streetViewError, setStreetViewError] = useState<string | null>(null);
  const [pov, setPov] = useState({ heading: 0, pitch: 0 });

  // 1. DETERMINE PROVIDER & LOAD SCRIPT
  useEffect(() => {
    // Global Auth Failure Handler
    window.gm_authFailure = () => {
        console.error("Google Maps Auth Failure");
        setProvider('leaflet');
    };

    if (!googleMapsKey || googleMapsKey.length < 10) {
        setProvider('leaflet');
        return;
    }

    if (window.google && window.google.maps) {
        setProvider('google');
        return;
    }

    // Load Script
    const scriptId = 'google-maps-script';
    if (!document.getElementById(scriptId)) {
        window.initMap = () => setProvider('google');
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&libraries=places&callback=initMap`;
        script.async = true;
        script.defer = true;
        script.onerror = () => setProvider('leaflet');
        document.head.appendChild(script);
    } else {
        // Script tag exists but not ready? Wait briefly
        const check = setInterval(() => {
            if (window.google && window.google.maps) {
                clearInterval(check);
                setProvider('google');
            }
        }, 200);
        setTimeout(() => { clearInterval(check); if(provider === 'loading') setProvider('leaflet'); }, 5000);
    }
  }, [googleMapsKey]);

  // 2. INITIALIZE MAP (Provider Changed)
  useEffect(() => {
      if (!mapRef.current) return;

      // CLEANUP
      if (googleMapRef.current) {
          googleMapRef.current = null; // Cannot fully destroy GM
      }
      if (leafletMapRef.current) {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
      }
      mapRef.current.innerHTML = ''; // Clear container

      // INIT GOOGLE
      if (provider === 'google' && window.google) {
          try {
              const map = new window.google.maps.Map(mapRef.current, {
                  center,
                  zoom: 15,
                  backgroundColor: '#e5e3df',
                  disableDefaultUI: true,
                  zoomControl: true,
                  zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_BOTTOM },
                  clickableIcons: false
              });
              googleMapRef.current = map;

              // Events
              map.addListener('idle', () => {
                  const c = map.getCenter();
                  if (c) handleCenterChange({ lat: c.lat(), lng: c.lng() });
              });

              // Street View Setup
              const sv = map.getStreetView();
              sv.addListener('visible_changed', () => {
                  const vis = sv.getVisible();
                  setIsStreetView(vis);
                  // Trigger resize on map when SV closes
                  if (!vis) window.google.maps.event.trigger(map, 'resize');
              });
              sv.addListener('position_changed', () => {
                  if (sv.getVisible()) {
                      const pos = sv.getPosition();
                      if (pos) setCenter({ lat: pos.lat(), lng: pos.lng() });
                  }
              });
              sv.addListener('pov_changed', () => setPov(sv.getPov()));

              // FORCE RESIZE (Fix Black Screen)
              [200, 500, 1000].forEach(ms => {
                  setTimeout(() => {
                      if (googleMapRef.current) window.google.maps.event.trigger(map, 'resize');
                  }, ms);
              });
              
              updateAddress(center.lat, center.lng);

          } catch (e) {
              console.error(e);
              setProvider('leaflet');
          }
      }

      // INIT LEAFLET
      if (provider === 'leaflet' && window.L) {
          const map = window.L.map(mapRef.current).setView([center.lat, center.lng], 15);
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
          leafletMapRef.current = map;
          
          // Marker logic would go here, but we use a fixed center pin overlay for better UX
          map.on('moveend', () => {
              const c = map.getCenter();
              handleCenterChange({ lat: c.lat, lng: c.lng });
          });
          
          setTimeout(() => map.invalidateSize(), 300);
          updateAddress(center.lat, center.lng);
      }
  }, [provider]);

  // -- LOGIC --

  const handleCenterChange = (newCenter: {lat: number, lng: number}) => {
      // Small debounce
      if (Math.abs(newCenter.lat - center.lat) > 0.0001 || Math.abs(newCenter.lng - center.lng) > 0.0001) {
          setCenter(newCenter);
          updateAddress(newCenter.lat, newCenter.lng);
      }
  };

  const updateAddress = (lat: number, lng: number) => {
      getAddressFromCoordinates(lat, lng, googleMapsKey).then(setAddress);
  };

  const handleSearch = async () => {
      if (!searchQuery) return;
      try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
          const data = await res.json();
          if (data && data.length > 0) {
              const newCenter = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
              setCenter(newCenter);
              setAddress(data[0].display_name);

              if (provider === 'google' && googleMapRef.current) {
                  googleMapRef.current.setCenter(newCenter);
                  googleMapRef.current.setZoom(16);
              } else if (provider === 'leaflet' && leafletMapRef.current) {
                  leafletMapRef.current.setView([newCenter.lat, newCenter.lng], 16);
              }
          }
      } catch(e) { console.error(e); }
  };

  const toggleStreetView = () => {
      if (!window.google || !googleMapRef.current) return;
      const sv = googleMapRef.current.getStreetView();
      
      if (isStreetView) {
          sv.setVisible(false);
      } else {
          // Check coverage
          const svc = new window.google.maps.StreetViewService();
          svc.getPanorama({ location: center, radius: 50 }, (data: any, status: string) => {
              if (status === 'OK') {
                  sv.setPosition(data.location.latLng);
                  sv.setPov({ heading: 0, pitch: 0 });
                  sv.setVisible(true);
                  setStreetViewError(null);
              } else {
                  setStreetViewError("No Street View available here");
                  setTimeout(() => setStreetViewError(null), 3000);
              }
          });
      }
  };

  // Center map on real device GPS (without setting it as manual location yet)
  const handleLocateMe = () => {
      if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition((pos) => {
              const newCenter = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setCenter(newCenter);
              if (provider === 'google' && googleMapRef.current) {
                  googleMapRef.current.setCenter(newCenter);
                  googleMapRef.current.setZoom(17);
              } else if (provider === 'leaflet' && leafletMapRef.current) {
                  leafletMapRef.current.setView([newCenter.lat, newCenter.lng], 17);
              }
              updateAddress(newCenter.lat, newCenter.lng);
          });
      }
  };

  // Full reset: Close modal and revert to GPS mode in App
  const handleResetToRealGPS = () => {
      onResetToGPS();
  };

  const handleConfirm = () => {
      let snapshotUrl: string | undefined;
      if (provider === 'google' && isStreetView && googleMapsKey) {
          snapshotUrl = getGoogleStreetViewImage(center.lat, center.lng, pov.heading, pov.pitch, googleMapsKey);
      }
      onSelectLocation({
          latitude: center.lat,
          longitude: center.lng,
          address,
          heading: isStreetView ? pov.heading : null
      }, snapshotUrl);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black animate-in fade-in duration-300">
        
        {/* TOP BAR */}
        <div className="absolute top-4 left-0 right-0 z-20 flex justify-center px-4 pointer-events-none">
           <div className="flex items-center gap-2 w-full max-w-lg pointer-events-auto">
               <button onClick={onClose} className="bg-slate-900/90 text-white p-3 rounded-xl border border-white/10 hover:bg-slate-800">
                   <ArrowLeft size={20} />
               </button>
               <div className="flex-1 bg-slate-900/90 backdrop-blur-md rounded-xl shadow-2xl border border-white/10 flex items-center p-1">
                   <input 
                     type="text" 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                     placeholder={t.mapSearchPlaceholder}
                     className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none px-3 py-2"
                   />
                   <button onClick={handleSearch} className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">
                       <Search size={18} />
                   </button>
               </div>
           </div>
       </div>

       {/* PROVIDER TOGGLE */}
       <div className="absolute top-4 right-4 z-20 pointer-events-auto">
            <button 
                onClick={() => setProvider(provider === 'google' ? 'leaflet' : 'google')}
                className="bg-slate-900/90 text-white px-3 py-2 rounded-xl border border-white/10 shadow-lg text-xs font-bold uppercase"
            >
                {provider === 'google' ? 'Google' : 'OSM'}
            </button>
       </div>

       {/* MAP CONTAINER */}
       <div className="flex-1 relative w-full h-full bg-[#242f3e] overflow-hidden">
           {provider === 'loading' && (
               <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900 text-white">
                   <Loader2 className="animate-spin mr-2" /> Loading...
               </div>
           )}

           {/* The Map Div */}
           <div ref={mapRef} className="w-full h-full absolute inset-0 bg-[#e5e3df]" style={{ height: '100%', width: '100%' }} />

           {/* Center Pin Overlay (Only for Map Mode) */}
           {!isStreetView && provider !== 'loading' && (
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none -mt-8">
                   <Navigation size={40} className="text-blue-500 fill-blue-500 drop-shadow-2xl" />
               </div>
           )}

           {/* CONTROLS OVERLAY */}
           <div className="absolute right-4 bottom-4 z-10 flex flex-col gap-2 items-end">
               
               {/* Locate Me FAB (Centers Map) */}
               {!isStreetView && (
                    <button 
                        onClick={handleLocateMe}
                        className="p-3 rounded-full shadow-xl bg-slate-900 text-white border border-white/10 hover:bg-slate-800 transition-all"
                        title="Center map on my device"
                    >
                        <Locate size={20} />
                    </button>
               )}

               {streetViewError && (
                   <div className="bg-red-500/90 text-white text-[10px] p-2 rounded-lg mb-2 shadow-lg flex items-center gap-1 animate-in fade-in slide-in-from-bottom-2">
                       <AlertCircle size={12}/> {streetViewError}
                   </div>
               )}

               {/* Street View Toggle */}
               {provider === 'google' && (
                   <button 
                      onClick={toggleStreetView}
                      className={`p-3 rounded-xl shadow-xl font-bold text-xs uppercase flex items-center gap-2 hover:scale-105 transition-all ${isStreetView ? 'bg-amber-500 text-black' : 'bg-white text-slate-900'}`}
                   >
                       {isStreetView ? <MapIcon size={16}/> : <ImageIcon size={16} />}
                       {isStreetView ? "Exit" : t.mapModeStreet}
                   </button>
               )}
           </div>
       </div>

       {/* FOOTER */}
       <div className="bg-slate-900 p-6 border-t border-white/10 z-30">
           <div className="max-w-xl mx-auto flex flex-col gap-4">
               <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 mt-0.5 border border-blue-500/20">
                        <Navigation size={22} />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] uppercase text-slate-500 font-bold tracking-[0.2em] mb-1">{t.mapManualMode}</p>
                        <p className="text-white text-sm font-medium leading-relaxed opacity-90 line-clamp-2">
                            {address || `${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`}
                        </p>
                    </div>
               </div>
               
               <div className="flex gap-3">
                   {/* Reset to GPS Button */}
                   <button 
                      onClick={handleResetToRealGPS}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-xl border border-white/5 flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                   >
                       <LocateFixed size={18} />
                       <span className="text-xs uppercase tracking-wider">Use Device GPS</span>
                   </button>

                   {/* Set Location Button */}
                   <button 
                      onClick={handleConfirm}
                      className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
                   >
                      {isStreetView ? <ImageIcon size={20} /> : <Check size={20} />}
                      <span>{isStreetView ? t.mapSetLocationSnapshot : t.mapSetLocation}</span>
                   </button>
               </div>
           </div>
       </div>
    </div>
  );
};
