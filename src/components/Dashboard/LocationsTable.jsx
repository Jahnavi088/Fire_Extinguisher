import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/apiService';
import './LocationsTable.css';

const LocationsTable = ({ user, onBack }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      setError(null);
      const storedUserStr = localStorage.getItem('auth_user');
      const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
      const currentUser = user || storedUser;
      const companyId = currentUser?.company_id || currentUser?.companyId || currentUser?.company?.id;
      const userBranchId = currentUser?.branch_id;
      const userBuildingId = currentUser?.building_id;
      const userFloorId = currentUser?.floor_id;
      const userZoneId = currentUser?.zone_id;
      const userDeptId = currentUser?.department_id;
      const userRole = (currentUser?.role || '').toLowerCase();
      const restrictedRoles = ['agm', 'supervisor', 'inspector', 'user'];

      // For non-admin roles, show only operator-mapping assigned locations
      if (restrictedRoles.includes(userRole) && currentUser?.id) {
        try {
          const mappingsRes = await ApiService.getOperatorMappings({ user_id: currentUser.id });
          const mappings = Array.isArray(mappingsRes)
            ? mappingsRes
            : (mappingsRes?.data || mappingsRes?.items || []);

          if (mappings.length > 0) {
            const flat = mappings.map((m, i) => {
              const name = m.zone_name || m.floor_name || m.building_name || m.branch_name || `Location ${i + 1}`;
              const type = m.zone_name ? 'Zone' : m.floor_name ? 'Floor' : m.building_name ? 'Building' : 'Branch';
              const parent = m.zone_name
                ? (m.floor_name || m.building_name || '—')
                : m.floor_name
                  ? (m.building_name || m.branch_name || '—')
                  : m.building_name
                    ? (m.branch_name || '—')
                    : '—';
              return {
                id: `om-${m.id || i}`,
                name,
                type,
                parent,
                rawId: m.zone_id || m.floor_id || m.building_id || m.branch_id,
              };
            });
            setLocations(flat);
            setLoading(false);
            return;
          }
          // Fall through to company-wide fetch if no assignments found
        } catch {
          // Fall through to company-wide fetch on error
        }
      }

      if (!companyId) {
        setError('No company assigned to the current user.');
        setLoading(false);
        return;
      }

      try {
        const flatLocations = [];

        const treeData = await ApiService.getLocationTree(companyId);
        let branchesList = Array.isArray(treeData) ? treeData : (treeData?.branches || treeData?.data || []);
        
        branchesList = branchesList.filter(b => !companyId || String(b.company_id) === String(companyId));
        if (userBranchId) branchesList = branchesList.filter(b => String(b.id) === String(userBranchId));

        branchesList.forEach(b => {
          flatLocations.push({ id: `branch-${b.id}`, name: b.branch_name || b.name, type: 'Branch', parent: '-', rawId: b.id });
          
          let bList = Array.isArray(b.buildings) ? b.buildings : [];
          if (userBuildingId) bList = bList.filter(bld => String(bld.id) === String(userBuildingId));
          
          bList.forEach(bld => {
            flatLocations.push({ id: `bldg-${bld.id}`, name: bld.building_name || bld.name, type: 'Building', parent: b.branch_name || b.name, rawId: bld.id });
            
            let fList = Array.isArray(bld.floors) ? bld.floors : [];
            if (userFloorId) fList = fList.filter(f => String(f.id) === String(userFloorId));
            
            fList.forEach(f => {
              flatLocations.push({ id: `floor-${f.id}`, name: f.floor_name || f.name, type: 'Floor', parent: bld.building_name || bld.name, rawId: f.id });
              
              let zList = Array.isArray(f.zones) ? f.zones : [];
              if (userZoneId) zList = zList.filter(z => String(z.id) === String(userZoneId));
              
              zList.forEach(z => {
                flatLocations.push({ id: `zone-${z.id}`, name: z.zone_name || z.name, type: 'Zone', parent: f.floor_name || f.name, rawId: z.id });
                
                let dList = Array.isArray(z.departments) ? z.departments : [];
                if (userDeptId) dList = dList.filter(d => String(d.id) === String(userDeptId));
                
                dList.forEach(d => {
                  flatLocations.push({ id: `dept-${d.id}`, name: d.department_name || d.name, type: 'Department', parent: z.zone_name || z.name, rawId: d.id });
                });
              });
            });
          });
        });

        setLocations(flatLocations);
      } catch (err) {
        console.error("Failed to load locations:", err);
        setError("Failed to load locations. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [user]);

  const filteredLocations = locations.filter(loc => {
    const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          loc.parent.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || loc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter]);

  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);
  const paginatedLocations = filteredLocations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="locations-table-page">
      <div className="loc-header">
        <div className="loc-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {onBack && (
              <button 
                onClick={onBack} 
                style={{ 
                  background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', transition: 'all 0.2s', flexShrink: 0
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                title="Back to Dashboard"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
              </button>
            )}
            <div>
              <h2>Assigned Locations</h2>
              <p>View all locations accessible to your company.</p>
            </div>
          </div>
        </div>
        <div className="loc-header-right">
          <div className="loc-filters">
            <select className="loc-type-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="All">All Types</option>
              <option value="Branch">Branch</option>
              <option value="Building">Building</option>
              <option value="Floor">Floor</option>
              <option value="Zone">Zone</option>
              <option value="Department">Department</option>
            </select>
            <div className="loc-search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input 
                type="text" 
                placeholder="Search locations..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="loc-content">
        {loading ? (
          <div className="loc-loading">
            <div className="loc-spinner"></div>
            <span>Loading locations...</span>
          </div>
        ) : error ? (
          <div className="loc-error">⚠️ {error}</div>
        ) : filteredLocations.length === 0 ? (
          <div className="loc-empty">
            <span className="empty-icon">📍</span>
            <p>No locations found matching your criteria.</p>
          </div>
        ) : (
          <>
            <div className="loc-table-container">
              <table className="loc-table">
                <thead>
                  <tr>
                    <th>S.NO</th>
                    <th>Location Name</th>
                    <th>Type</th>
                    <th>Parent Hierarchy</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLocations.map((loc, index) => (
                    <tr key={loc.id}>
                      <td className="loc-td-num" style={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace', textAlign: 'center', width: '60px' }}>
                        {String((currentPage - 1) * itemsPerPage + index + 1).padStart(2, '0')}
                      </td>
                      <td className="loc-cell-name">
                        <span className={`loc-type-dot ${loc.type.toLowerCase()}`}></span>
                        {loc.name}
                      </td>
                      <td><span className="loc-badge">{loc.type}</span></td>
                      <td className="loc-cell-parent">{loc.parent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="loc-pagination">
                <span className="loc-pg-info">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLocations.length)} of {filteredLocations.length} locations
                </span>
                <div className="loc-pg-controls">
                  <button 
                    className="loc-pg-btn" 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <span className="loc-pg-current">Page {currentPage} of {totalPages}</span>
                  <button 
                    className="loc-pg-btn" 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LocationsTable;
