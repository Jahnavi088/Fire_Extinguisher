import { useState, useEffect, useReducer } from 'react';
import { ApiService } from '../../services/apiService';
import './EquipmentAccess.css';

const MODULE_EMOJI = {
  fire_extinguisher: '🧯', sprinkler: '🚿', fpca: '🔔', hose_reel: '🧵',
  hydrant: '🚒', drum_hose: '🛢️', fire_trolley: '🛒', suppression_system: '💨',
  fire_blanket: '🧺', smoke_detector: '🌫️', pa_system: '📢', scba: '🫁',
  ambulance: '🚑', first_aid_kit: '🏥', safety_shower: '🚰', eyewash_station: '👀',
  chemical_shower: '🚿', ppe_station: '🦺', fire_brigade: '👨‍🚒', wind_sock: '📍',
  spill_kit: '⚗️', safety_signage: '⚠️', muster_point: '📌', fire_noc: '📝',
  emergency_door: '🚪', emergency_light: '🔦', volunteers: '🙋', shift_volunteers: '👥',
  trained_shift: '🎓',
};

const ACCESS_LEVELS = [
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'admin',      label: 'Admin'      },
  { value: 'inspector',  label: 'Inspector'  },
  { value: 'user',       label: 'User'       },
];

const getLevelLabel = (val) =>
  ACCESS_LEVELS.find(l => l.value === val)?.label || val || 'User';

function dataReducer(state, action) {
  switch (action.type) {
    case 'success':
      return { loading: false, error: null, users: action.users, assignments: action.assignments };
    case 'error':
      return { loading: false, error: action.error, users: [], assignments: [] };
    case 'add':
      return { ...state, assignments: [action.assignment, ...state.assignments.filter(a => a.id !== action.assignment.id)] };
    case 'remove':
      return { ...state, assignments: state.assignments.filter(a => a.id !== action.id) };
    default:
      return state;
  }
}

const EquipmentAccess = ({ onBack, onScroll, availableModules = [] }) => {
  const [dataState, dispatch] = useReducer(dataReducer, {
    loading: true, error: null, users: [], assignments: [],
  });
  const { loading: usersLoading, error, users, assignments } = dataState;

  const [view,               setView]               = useState('list'); // 'list' or 'form'
  const [currentPage,        setCurrentPage]        = useState(1);
  const itemsPerPage = 10;

  const [selectedUser,       setSelectedUser]       = useState(null);
  const [selectedModule,     setSelectedModule]     = useState(null);
  const [accessLevel,        setAccessLevel]        = useState('user');
  const [userDropdownOpen,   setUserDropdownOpen]   = useState(false);
  const [moduleDropdownOpen, setModuleDropdownOpen] = useState(false);
  const [levelDropdownOpen,  setLevelDropdownOpen]  = useState(false);
  const [saving,             setSaving]             = useState(false);
  const [removing,           setRemoving]           = useState(null);
  const [refreshKey,         setRefreshKey]         = useState(0);

  const modules = availableModules.length > 0 ? availableModules : [];

  /* ── Load users + their module assignments ─────────────────────── */
  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const raw = await ApiService.getAdminUsers();
        if (!active) return;
        const userList = Array.isArray(raw) ? raw : (raw?.users || raw?.data || []);

        const results = await Promise.allSettled(
          userList.map(u => ApiService.getAdminUserModules(u.id).then(d => ({ user: u, data: d })))
        );
        if (!active) return;

        const flat = [];
        results.forEach(r => {
          if (r.status !== 'fulfilled') return;
          const { user, data } = r.value;
          const mods = Array.isArray(data) ? data : (data?.modules || data?.data || []);
          mods.forEach(m => {
            flat.push({
              id:         `${user.id}_${m.module_id || m.id}`,
              userId:     user.id,
              userName:   user.name || user.username || 'Unknown',
              moduleId:   m.module_id || m.id,
              moduleName: m.name || m.module_name || `Module ${m.module_id || m.id}`,
              moduleCode: m.code || m.module_code || '',
              level:      m.access_level || 'user',
              date:       (m.created_at || m.assigned_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
            });
          });
        });

        dispatch({ type: 'success', users: userList, assignments: flat });
      } catch (err) {
        if (active) dispatch({ type: 'error', error: err.message || 'Failed to load data' });
      }
    };
    run();
    return () => { active = false; };
  }, [refreshKey]);

  /* ── Add assignment ───────────────────────────────────────────────── */
  const handleAddAssignment = async () => {
    if (!selectedUser || !selectedModule) {
      alert('Please select both a user and an equipment module.');
      return;
    }
    setSaving(true);
    try {
      const moduleId = selectedModule.module_id || selectedModule.id;
      await ApiService.addAdminUserModule(selectedUser.id, {
        module_id:    moduleId,
        access_level: accessLevel,
      });
      dispatch({
        type: 'add',
        assignment: {
          id:         `${selectedUser.id}_${moduleId}`,
          userId:     selectedUser.id,
          userName:   selectedUser.name || selectedUser.username || 'Unknown',
          moduleId,
          moduleName: selectedModule.name,
          moduleCode: selectedModule.code || '',
          level:      accessLevel,
          date:       new Date().toISOString().split('T')[0],
        },
      });
      setSelectedUser(null);
      setSelectedModule(null);
      setAccessLevel('user');
      setView('list');
    } catch (err) {
      alert(err.message || 'Failed to assign access. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Remove assignment ────────────────────────────────────────────── */
  const handleRemoveAssignment = async (assignment) => {
    if (!window.confirm(`Revoke ${assignment.userName}'s access to ${assignment.moduleName}?`)) return;
    setRemoving(assignment.id);
    try {
      await ApiService.removeAdminUserModule(assignment.userId, assignment.moduleId);
      dispatch({ type: 'remove', id: assignment.id });
    } catch (err) {
      alert(err.message || 'Failed to revoke access. Please try again.');
    } finally {
      setRemoving(null);
    }
  };

  const closeDropdowns = () => {
    setUserDropdownOpen(false);
    setModuleDropdownOpen(false);
    setLevelDropdownOpen(false);
  };

  return (
    <div className="ea-page">
      <div className="setup-header">
        <button className="setup-back-btn" onClick={view === 'list' ? onBack : () => setView('list')} title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="setup-header-info" style={{ flex: 1 }}>
          <div className="setup-header-icon">🔐</div>
          <div>
            <div className="setup-title">{view === 'list' ? 'Equipment Access' : 'Assign New Access'}</div>
            <div className="setup-subtitle">
              {view === 'list' 
                ? 'Superadmin Portal — Manage user permissions and equipment assignments'
                : 'Link a user to a specific safety module and define their access level'}
            </div>
          </div>
        </div>
        {view === 'list' && (
          <button className="ea-add-nav-btn" onClick={() => setView('form')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" />
            </svg>
            Assign Access
          </button>
        )}
      </div>

      {error && (
        <div className="ea-error-bar">
          ⚠️ {error}
          <button onClick={() => setRefreshKey(k => k + 1)} className="ea-retry-btn">Retry</button>
        </div>
      )}

      <div className="ea-body">
        {view === 'list' ? (
          <div className="ea-card ea-list-card full">
            <div className="ea-card-header">
              <span className="ea-card-icon">📋</span>
              <div className="ea-card-title">Current Access Assignments</div>
              {usersLoading
                ? <div className="ea-badge-spinner" />
                : <div className="ea-badge">{assignments.length} Total</div>
              }
            </div>

            {usersLoading ? (
              <div className="ea-list-loading">
                <div className="ea-spinner" />
                <span>Loading assignments...</span>
              </div>
            ) : (
              <>
                <div className="ea-table-wrap" onScroll={onScroll}>
                  <table className="ea-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Equipment</th>
                        <th>Level</th>
                        <th>Assigned Date</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.length > 0 ? assignments
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map(a => (
                        <tr key={a.id}>
                          <td>
                            <div className="ea-user-cell">
                              <div className="ea-user-avatar">{(a.userName || '?').charAt(0).toUpperCase()}</div>
                              <span>{a.userName}</span>
                            </div>
                          </td>
                          <td>
                            <span className="ea-module-tag">
                              {MODULE_EMOJI[a.moduleCode] || '📦'} {a.moduleName}
                            </span>
                          </td>
                          <td>
                            <span className={`ea-level-tag ${(a.level || '').toLowerCase()}`}>
                              {getLevelLabel(a.level)}
                            </span>
                          </td>
                          <td>{a.date}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="ea-delete-btn"
                              onClick={() => handleRemoveAssignment(a)}
                              disabled={removing === a.id}
                              title="Revoke Access"
                            >
                              {removing === a.id ? '⏳' : '🗑️'}
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="ea-empty">
                            {error ? 'Could not load assignments.' : 'No access assignments found.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {assignments.length > itemsPerPage && (
                  <div className="ea-pagination">
                    <button 
                      className="ea-pg-btn" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <span className="ea-pg-info">
                      Page {currentPage} of {Math.ceil(assignments.length / itemsPerPage)}
                    </span>
                    <button 
                      className="ea-pg-btn" 
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(assignments.length / itemsPerPage), p + 1))}
                      disabled={currentPage === Math.ceil(assignments.length / itemsPerPage)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="ea-form-page">
            <div className="ea-card ea-form-card focused">
              <div className="ea-card-header">
                <span className="ea-card-icon">➕</span>
                <div className="ea-card-title">Register Equipment Access</div>
              </div>

              <div className="ea-form">
                <div className="ea-field">
                  <label className="ea-label">Select User</label>
                  <div className="ea-dropdown-wrap">
                    <div
                      className={`ea-dropdown-trigger ${userDropdownOpen ? 'open' : ''}`}
                      onClick={() => { setUserDropdownOpen(v => !v); setModuleDropdownOpen(false); setLevelDropdownOpen(false); }}
                    >
                      <span className="ea-trigger-text">
                        {usersLoading ? (
                          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Loading users...</span>
                        ) : selectedUser ? (
                          <><span className="ea-trigger-icon">👤</span>{selectedUser.name || selectedUser.username}</>
                        ) : 'Choose a user...'}
                      </span>
                      <svg className="ea-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                    {userDropdownOpen && !usersLoading && (
                      <div className="ea-dropdown-options">
                        {users.length === 0 ? (
                          <div className="ea-option-empty">No users found</div>
                        ) : users.map(u => (
                          <div
                            key={u.id}
                            className={`ea-option ${selectedUser?.id === u.id ? 'selected' : ''}`}
                            onClick={() => { setSelectedUser(u); setUserDropdownOpen(false); }}
                          >
                            <div className="ea-option-main">
                              <span className="ea-option-name">{u.name || u.username}</span>
                              <span className="ea-option-sub">{u.role || 'User'}</span>
                            </div>
                            {selectedUser?.id === u.id && <span className="ea-check">✓</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="ea-field">
                  <label className="ea-label">Select Equipment Module</label>
                  <div className="ea-dropdown-wrap">
                    <div
                      className={`ea-dropdown-trigger ${moduleDropdownOpen ? 'open' : ''}`}
                      onClick={() => { setModuleDropdownOpen(v => !v); setUserDropdownOpen(false); setLevelDropdownOpen(false); }}
                    >
                      <span className="ea-trigger-text">
                        {selectedModule ? (
                          <><span className="ea-trigger-icon">{MODULE_EMOJI[selectedModule.code] || '📦'}</span>{selectedModule.name}</>
                        ) : 'Choose equipment...'}
                      </span>
                      <svg className="ea-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                    {moduleDropdownOpen && (
                      <div className="ea-dropdown-options">
                        {modules.map(m => {
                          const mId  = m.module_id || m.id;
                          const selId = selectedModule?.module_id || selectedModule?.id;
                          return (
                            <div
                              key={mId}
                              className={`ea-option ${selId === mId ? 'selected' : ''}`}
                              onClick={() => { setSelectedModule(m); setModuleDropdownOpen(false); }}
                            >
                              <div className="ea-option-main">
                                <span className="ea-option-icon">{MODULE_EMOJI[m.code] || '📦'}</span>
                                <span className="ea-option-name">{m.name}</span>
                              </div>
                              {selId === mId && <span className="ea-check">✓</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="ea-field">
                  <label className="ea-label">Access Level</label>
                  <div className="ea-dropdown-wrap">
                    <div
                      className={`ea-dropdown-trigger ${levelDropdownOpen ? 'open' : ''}`}
                      onClick={() => { setLevelDropdownOpen(v => !v); setUserDropdownOpen(false); setModuleDropdownOpen(false); }}
                    >
                      <span className="ea-trigger-text">{getLevelLabel(accessLevel)}</span>
                      <svg className="ea-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                    {levelDropdownOpen && (
                      <div className="ea-dropdown-options">
                        {ACCESS_LEVELS.map(level => (
                          <div
                            key={level.value}
                            className={`ea-option ${accessLevel === level.value ? 'selected' : ''}`}
                            onClick={() => { setAccessLevel(level.value); setLevelDropdownOpen(false); }}
                          >
                            <div className="ea-option-main">
                              <span className="ea-option-name">{level.label}</span>
                            </div>
                            {accessLevel === level.value && <span className="ea-check">✓</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="ea-form-footer">
                  <button className="ea-cancel-btn" onClick={() => setView('list')}>Cancel</button>
                  <button className="ea-submit-btn" onClick={handleAddAssignment} disabled={saving || usersLoading}>
                    {saving ? <><span className="ea-btn-spinner" /> Assigning...</> : <><span>🔗</span> Assign Access</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {(userDropdownOpen || moduleDropdownOpen || levelDropdownOpen) && (
        <div className="ea-overlay" onClick={closeDropdowns} />
      )}
    </div>
  );
};

export default EquipmentAccess;
