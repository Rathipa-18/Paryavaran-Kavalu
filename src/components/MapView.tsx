import { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { WasteReport, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { MapPin, Info, CheckCircle2, Search, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Custom Circle component for @vis.gl/react-google-maps
type CircleProps = google.maps.CircleOptions & {
  center: google.maps.LatLngLiteral;
  radius: number;
};

const Circle = forwardRef((props: CircleProps, ref) => {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;
    circleRef.current = new google.maps.Circle({
      ...props,
      map
    });

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
      }
    };
  }, [map]);

  useEffect(() => {
    if (circleRef.current) {
      const { center, radius, ...options } = props;
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(radius);
      circleRef.current.setOptions(options);
    }
  }, [props.center, props.radius]);

  useImperativeHandle(ref, () => circleRef.current);

  return null;
});

const API_KEY = 
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface MapViewProps {
  userProfile: UserProfile | null;
  reports: WasteReport[];
  selectedReport: WasteReport | null;
  onReportClick: (report: WasteReport | null) => void;
  onMarkAsCleaned: (report: WasteReport, coords?: { lat: number; lng: number }) => void;
  userCoords: { lat: number; lng: number; accuracy?: number | null } | null;
}

interface MapInnerProps extends MapViewProps {}

function MapInner({ userProfile, reports, selectedReport, onReportClick, onMarkAsCleaned, userCoords }: MapInnerProps) {
  const map = useMap();
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Cleaned'>('All');
  const hasAutoCentered = useRef(false);

  const filteredReports = reports.filter(r => filter === 'All' || r.status === filter);

  useEffect(() => {
    if (map && userCoords && !hasAutoCentered.current) {
      map.setCenter(userCoords);
      map.setZoom(17);
      hasAutoCentered.current = true;
    }
  }, [map, userCoords]);

  const handleLocateMe = () => {
    if (map && userCoords) {
      map.setCenter(userCoords);
      map.setZoom(17);
    }
  };

  const isAuthority = userProfile?.role === 'authority';

  return (
    <div className="h-full w-full relative">
      <Map
        defaultCenter={userCoords || { lat: 20.5937, lng: 78.9629 }}
        defaultZoom={userCoords ? 15 : 5}
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
        disableDefaultUI={true}
        gestureHandling="greedy"
        onClick={() => onReportClick(null)}
      >
        {filteredReports.map((report) => (
          <AdvancedMarker
            key={report.id}
            position={{ lat: report.lat, lng: report.lng }}
            onClick={(e) => {
              if (e.stopPropagation) e.stopPropagation();
              onReportClick(report);
            }}
          >
            <Pin
              background={report.status === 'Cleaned' ? '#16a34a' : '#dc2626'}
              borderColor={report.status === 'Cleaned' ? '#14532d' : '#7f1d1d'}
              glyphColor="#fff"
            />
          </AdvancedMarker>
        ))}

        {userCoords && (
          <Circle
            center={userCoords}
            radius={userCoords.accuracy || 50}
            options={{
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
              strokeColor: '#3b82f6',
              strokeOpacity: 0.3,
              strokeWeight: 1,
              clickable: false,
              editable: false,
            }}
          />
        )}

        {userCoords && (
          <AdvancedMarker position={userCoords} zIndex={2}>
            <div className="relative">
              <div className="absolute -inset-2 bg-blue-500/20 rounded-full animate-ping" />
              <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg relative z-10" />
            </div>
          </AdvancedMarker>
        )}
      </Map>

      {/* Map Controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-3 z-10">
        {/* Map Legend */}
        <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-stone-100 flex flex-col gap-2 pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
            <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">Pending Blackspot</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600 shadow-[0_0_8px_rgba(22,163,74,0.5)]" />
            <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">Cleaned Area</span>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2">
          {(['All', 'Pending', 'Cleaned'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg border transition-all",
                filter === f 
                  ? "bg-stone-900 border-stone-900 text-white" 
                  : "bg-white/90 backdrop-blur-md border-stone-100 text-stone-600 hover:bg-stone-50"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Locate Me Button */}
      {userCoords && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLocateMe();
          }}
          className="absolute top-4 right-4 w-12 h-12 bg-white rounded-2xl shadow-xl border border-stone-100 flex items-center justify-center hover:bg-stone-50 transition-colors group z-10"
          title="Center on my location"
        >
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse group-hover:scale-125 transition-transform" />
        </button>
      )}

      {/* Selected Report Preview Overlay */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-6 left-6 right-6 md:left-auto md:w-96 bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-100 z-20"
          >
            <div className="h-44 bg-stone-100 relative">
              {selectedReport.imageUrl ? (
                <img
                  src={selectedReport.imageUrl || undefined}
                  alt="Waste spot"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400">
                  <MapPin className="w-8 h-8 opacity-20" />
                </div>
              )}
              <div className={cn(
                "absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm",
                selectedReport.status === 'Cleaned' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {selectedReport.status}
              </div>
              <button 
                onClick={() => onReportClick(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-serif font-bold text-stone-900">{selectedReport.wasteType} Waste</h3>
                <span className="text-xs text-stone-400 font-medium">{selectedReport.reportedAt ? new Date(selectedReport.reportedAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
              </div>
              <p className="text-stone-600 text-sm leading-relaxed mb-6">
                {selectedReport.description || "No description provided for this blackspot."}
              </p>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center uppercase font-bold text-[10px] text-stone-400 border border-stone-200">
                  {selectedReport.reportedByName[0]}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Reported By</p>
                  <p className="text-xs font-bold text-stone-800">{selectedReport.reportedByName}</p>
                </div>
              </div>

              {isAuthority && selectedReport.status === 'Pending' && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">Verify Cleanup</p>
                  <button
                    onClick={() => onMarkAsCleaned(selectedReport)}
                    className="w-full bg-stone-900 hover:bg-stone-800 text-white p-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Mark as Cleaned
                  </button>
                  
                  {userCoords && (
                    <button
                      onClick={() => onMarkAsCleaned(selectedReport, userCoords)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white p-4 rounded-2xl font-bold transition-all shadow-lg flex flex-col items-center justify-center gap-0.5"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Cleaned at Current Location
                      </div>
                      <span className="text-[9px] opacity-70 font-medium">Updates exact GPS coordinates of cleanup</span>
                    </button>
                  )}
                </div>
              )}

              {selectedReport.status === 'Cleaned' && (
                <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest leading-none mb-1">Status</p>
                    <p className="text-xs font-bold text-green-800">Verified Cleaned Area</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MapView(props: MapViewProps) {
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    // Hook into Google Maps global auth failure callback
    (window as any).gm_authFailure = () => {
      console.error("Google Maps Authentication Failed: ApiTargetBlockedMapError or similar.");
      setAuthError(true);
    };
    return () => {
      delete (window as any).gm_authFailure;
    };
  }, []);

  if (!hasValidKey || authError) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] w-full bg-stone-50 font-sans p-6 text-stone-800">
        <div className="max-w-lg w-full bg-white p-8 rounded-3xl shadow-xl border border-stone-200">
          <h2 className="text-3xl font-serif font-bold text-stone-900 mb-4">
            {authError ? "Maps API Key Blocked" : "Google Maps API Key Required"}
          </h2>
          
          {authError && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl mb-6 flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">!</div>
              <p className="text-sm text-red-800 leading-tight">
                <b>ApiTargetBlockedMapError:</b> Your API key is working but the request is being blocked by your Google Cloud Console settings.
              </p>
            </div>
          )}

          <p className="mb-6 text-stone-600">To fix this, please check these settings in your <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" rel="noopener" className="text-stone-900 font-bold underline">Google Cloud Console</a>:</p>
          
          <div className="space-y-4 text-stone-700">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <p className="font-bold">Verify API Key Value</p>
                <p className="text-xs mt-1 text-stone-500">Ensure the key you copied is <b>API key 2</b> (Paryavaran-Kavalu) and not the Android one.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold">2</span>
              <div>
                <p className="font-bold">API Restrictions</p>
                <p className="text-xs mt-1 text-stone-500">Edit your API Key and ensure <b>"Maps JavaScript API"</b> is explicitly <b>ALLOWED</b> in the restrictions list.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold">2</span>
              <div>
                <p className="font-bold">Website Restrictions (Referrers)</p>
                <p className="text-xs mt-1 text-stone-500">Set this to <b>"None"</b> temporarily to verify it works, or add <code>https://*.run.app/*</code> to the allowed list.</p>
              </div>
            </div>
            {!hasValidKey && (
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <p className="font-bold">Add Secret</p>
                  <p className="text-xs mt-1 text-stone-500">Open <b>Settings</b> &gt; <b>Secrets</b> and add <code>GOOGLE_MAPS_PLATFORM_KEY</code>.</p>
                </div>
              </div>
            )}
          </div>
          <p className="mt-8 text-xs text-stone-400 italic font-medium">Refresh the page after updating your settings in Google Cloud Console.</p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <MapInner {...props} />
    </APIProvider>
  );
}
