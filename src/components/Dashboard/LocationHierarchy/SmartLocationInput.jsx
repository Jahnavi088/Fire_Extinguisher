import React, { useState, useEffect, useRef } from 'react';

// Words that describe the location *type* but aren't part of the place name.
// Stripped before geocoding so "Andheri East Branch" → "Andheri East".
const NOISE_WORDS = new Set([
  'branch','building','office','warehouse','factory','plant','site','location',
  'headquarters','hq','center','centre','unit','floor','block','zone',
  'department','division','sector','wing','shop','store','complex','tower',
  'plaza','mall','park','hub','campus','facility','premises','main','head',
  'corporate','regional','local','new','old','phase','no',
  'limited','ltd','pvt','private','inc','llc','corp','corporation'
]);

function toGeocodeQuery(raw) {
  if (!raw) return '';
  const tokens = raw.trim().split(/\s+/);
  const kept = tokens.filter(t => {
    const lower = t.toLowerCase().replace(/[^a-z]/g, '');
    return lower.length > 1 && !NOISE_WORDS.has(lower);
  });
  return (kept.length > 0 ? kept : tokens).join(' ');
}

const TYPE_ICON = {
  city: '🏙️', town: '🏘️', village: '🏡', suburb: '🏙️',
  neighbourhood: '🏘️', quarter: '🏘️', building: '🏛️',
  industrial: '🏭', commercial: '🏢', administrative: '🗺️',
  road: '🛣️', state: '🗺️', country: '🌍',
};

async function nominatimSearch(rawQuery) {
  const q = toGeocodeQuery(rawQuery);
  if (!q || q.trim().length < 2) return [];
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || []).map(f => {
      const p = f.properties || {};
      const coords = f.geometry?.coordinates || [0, 0];
      
      const addressParts = [
        p.street, p.district || p.locality, p.city || p.county, p.state, p.country
      ].filter(Boolean);
      
      return {
        display_name: p.name || addressParts[0] || 'Unknown Place',
        address: addressParts.join(', '),
        lat: coords[1],
        lon: coords[0],
        type: p.osm_value || 'place',
        raw: p
      };
    });
  } catch {
    return [];
  }
}

/**
 * Smart location name input with OpenStreetMap geocoding autocomplete.
 *
 * Props:
 *  value       — controlled name string
 *  onChange    — (newName: string) => void
 *  placeholder — string
 *  onGeocode   — (lat: number, lng: number, displayName: string) => void
 *                called when user picks a geocoding suggestion
 */
export default function SmartLocationInput({ value, onChange, placeholder, onGeocode }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const timerRef = useRef(null);
  const rootRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const fn = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Debounced geocoding search (skipped when onGeocode is not provided)
  useEffect(() => {
    clearTimeout(timerRef.current);
    setActiveIdx(-1);
    if (!onGeocode || !value || value.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await nominatimSearch(value);
      setSuggestions(results);
      setOpen(results.length > 0);
      setSearching(false);
    }, 500);
    return () => clearTimeout(timerRef.current);
  }, [value]);

  const pick = (place) => {
    const lat = parseFloat(parseFloat(place.lat).toFixed(6));
    const lng = parseFloat(parseFloat(place.lon).toFixed(6));
    onGeocode(lat, lng, place.display_name);
    setOpen(false);
    setSuggestions([]);
  };

  const handleKey = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); pick(suggestions[activeIdx]); }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%' }}>
      {/* Input field */}
      <div style={{ position: 'relative' }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          autoFocus
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKey}
          style={{
            width: '100%',
            padding: '11px 42px 11px 14px',
            borderRadius: 8,
            border: '1.5px solid #d1d5db',
            fontSize: 14,
            color: '#111827',
            background: '#fff',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            transition: 'border-color 0.18s',
          }}
          onFocusCapture={e => e.target.style.borderColor = '#3b82f6'}
          onBlurCapture={e => e.target.style.borderColor = '#d1d5db'}
        />
        <div style={{
          position: 'absolute', right: 13, top: '50%',
          transform: 'translateY(-50%)', pointerEvents: 'none',
          display: 'flex', alignItems: 'center',
        }}>
          {searching
            ? <div style={{
                width: 15, height: 15,
                border: '2px solid #e5e7eb',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'sli-spin 0.6s linear infinite',
              }} />
            : <span style={{ fontSize: 14, color: '#9ca3af' }}>🔍</span>
          }
        </div>
      </div>

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
          zIndex: 10001,
          maxHeight: 300,
          overflowY: 'auto',
          animation: 'sli-fadein 0.15s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '8px 14px',
            fontSize: 10.5,
            fontWeight: 700,
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span>📡</span> Location Suggestions (OpenStreetMap)
          </div>

          {suggestions.map((place, i) => {
            const name = typeof place.display_name === 'string' ? place.display_name : '';
            const addr = typeof place.address === 'string' ? place.address : (place.address ? Object.values(place.address).join(', ') : '');
            const lat = parseFloat(place.lat).toFixed(5);
            const lon = parseFloat(place.lon).toFixed(5);
            return (
              <div
                key={i}
                onClick={() => pick(place)}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  borderBottom: i < suggestions.length - 1 ? '1px solid #f9fafb' : 'none',
                  background: activeIdx === i ? '#f0f9ff' : 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0f9ff'; setActiveIdx(i); }}
                onMouseLeave={e => { e.currentTarget.style.background = activeIdx === i ? '#f0f9ff' : 'transparent'; }}
              >
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>
                  {TYPE_ICON[place.type] || '📍'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {name}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {addr}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#10b981', fontFamily: 'monospace', marginTop: 4, fontWeight: 700 }}>
                    {lat}°N &nbsp; {lon}°E
                  </div>
                </div>
                <span style={{
                  fontSize: 9.5,
                  background: '#f3f4f6',
                  color: '#6b7280',
                  padding: '2px 7px',
                  borderRadius: 4,
                  flexShrink: 0,
                  marginTop: 4,
                  textTransform: 'capitalize',
                }}>
                  {place.type || 'place'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes sli-spin { to { transform: rotate(360deg); } }
        @keyframes sli-fadein { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
