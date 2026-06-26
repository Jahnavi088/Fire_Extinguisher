import { useState, useEffect } from 'react';
import { ApiService } from '../../services/apiService';

const AssignedLocations = ({ user, onBack }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    ApiService.getOperatorMappings({ user_id: user.id })
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data || res?.items || res?.mappings || []);
        setLocations(list);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const getLocationLabel = (loc) => {
    const parts = [
      loc.department_name || loc.department,
      loc.zone_name || loc.zone,
      loc.floor_name || loc.floor,
      loc.building_name || loc.building,
    ].filter(Boolean);
    return parts[0] || loc.location_name || 'Location';
  };

  const getBreadcrumb = (loc) => {
    const parts = [
      loc.branch_name || loc.branch,
      loc.building_name || loc.building,
      loc.floor_name || loc.floor,
      loc.zone_name || loc.zone,
      loc.department_name || loc.department,
    ].filter(Boolean);
    return parts.join(' › ');
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: '800px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: '1px solid #e2e8f0',
            borderRadius: '8px', padding: '7px 14px',
            fontSize: '13px', fontWeight: '600', color: '#374151', cursor: 'pointer',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>My Assigned Locations</h2>
          <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>
            {user?.name || user?.username || 'Inspector'}
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', padding: '40px 0' }}>
          <div style={{
            width: '20px', height: '20px',
            border: '2px solid #e2e8f0', borderTopColor: '#2563eb',
            borderRadius: '50%', animation: 'loc-spin 0.7s linear infinite'
          }} />
          <span style={{ fontSize: '14px' }}>Loading locations…</span>
          <style>{`@keyframes loc-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ padding: '32px 0', color: '#dc2626', fontSize: '14px' }}>
          Failed to load locations. Please try again.
        </div>
      )}

      {/* Empty */}
      {!loading && !error && locations.length === 0 && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>📍</div>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>No locations assigned yet.</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>Contact your administrator to get locations assigned.</div>
        </div>
      )}

      {/* Location list */}
      {!loading && !error && locations.length > 0 && (
        <>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', fontWeight: '500' }}>
            {locations.length} location{locations.length !== 1 ? 's' : ''} assigned
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {locations.map((loc, i) => {
              const label = getLocationLabel(loc);
              const breadcrumb = getBreadcrumb(loc);
              return (
                <div
                  key={loc.id || i}
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: '#eff6ff', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0, fontSize: '18px',
                  }}>
                    📍
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{label}</div>
                    {breadcrumb && (
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>{breadcrumb}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default AssignedLocations;
