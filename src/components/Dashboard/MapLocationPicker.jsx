import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import marker images directly from the installed leaflet package.
// Vite bundles these as local assets — works offline, no CDN dependency.
import markerIcon     from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x   from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow   from 'leaflet/dist/images/marker-shadow.png';

// Leaflet's default icon loader breaks under Vite — override it once with our local imports.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl:     markerShadow,
});

// Equipment location pin using the same locally bundled images
const PIN_ICON = new L.Icon({
  iconUrl:       markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl:     markerShadow,
  iconSize:    [25, 41],
  iconAnchor:  [12, 41],
  popupAnchor: [1, -34],
  shadowSize:  [41, 41],
});

// Inner: handles click-to-pin and re-centers when position changes from outside
function MapController({ position, onMapClick }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      onMapClick({
        latitude:      parseFloat(e.latlng.lat.toFixed(6)),
        longitude:     parseFloat(e.latlng.lng.toFixed(6)),
        geo_accuracy_m: null,
      });
    },
  });

  useEffect(() => {
    if (position) {
      map.setView([position.latitude, position.longitude], map.getZoom(), { animate: true });
    }
  }, [position, map]);

  return position
    ? <Marker position={[position.latitude, position.longitude]} icon={PIN_ICON} />
    : null;
}

// ── Public component ──────────────────────────────────────────────────────────
const MapLocationPicker = ({ position, onChange, gpsCapturing, onCaptureGPS, onClear }) => {
  // Default center: center of India
  const defaultCenter = position
    ? [position.latitude, position.longitude]
    : [20.5937, 78.9629];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Status / instruction bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#0d2d4a', borderRadius: 8, padding: '8px 14px',
        fontSize: 12, flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {position ? (
            <>
              <span style={{
                background: 'rgba(16,185,129,0.18)', color: '#10b981',
                border: '1px solid rgba(16,185,129,0.35)', borderRadius: 4,
                padding: '2px 8px', fontSize: 10, fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>📍 Pinned</span>
              <span style={{ fontFamily: 'monospace', color: '#5fd3f3', fontWeight: 700 }}>
                {position.latitude}°N, {position.longitude}°E
              </span>
              {position.geo_accuracy_m != null && (
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                  ± {position.geo_accuracy_m} m
                </span>
              )}
            </>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
              Click on the map to pin the equipment location
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            disabled={gpsCapturing}
            onClick={onCaptureGPS}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px',
              background: 'linear-gradient(135deg,#0a3d6b,#1565c0)',
              color: '#fff', border: 'none', borderRadius: 6,
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', opacity: gpsCapturing ? 0.6 : 1,
            }}
          >
            {gpsCapturing
              ? <><span style={{ display: 'inline-block', width: 10, height: 10, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginRight: 4 }} />Locating…</>
              : '📡 Use My Location'}
          </button>
          {position && (
            <button
              type="button"
              onClick={onClear}
              style={{
                padding: '6px 10px',
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#fca5a5', borderRadius: 6,
                fontSize: 11, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Leaflet Map */}
      <div style={{
        borderRadius: 10, overflow: 'hidden',
        border: '2px solid rgba(95,211,243,0.2)',
        height: 300, width: '100%',
      }}>
        <MapContainer
          center={defaultCenter}
          zoom={position ? 16 : 5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          {/* OpenStreetMap tiles — free, no API key */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController position={position} onMapClick={onChange} />
        </MapContainer>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .leaflet-container { font-family: inherit; }
      `}</style>
    </div>
  );
};

export default MapLocationPicker;
