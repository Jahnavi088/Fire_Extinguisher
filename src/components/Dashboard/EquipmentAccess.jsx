import { useState, useEffect, useReducer, useMemo } from 'react';
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
  { value: 'view', label: 'View Only' },
  { value: 'inspect', label: 'Inspect' },
  { value: 'manage', label: 'Manager' },
  { value: 'admin', label: 'Administrator' },
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
    case 'add_batch':
      return { ...state, assignments: [...action.assignments, ...state.assignments.filter(a => !action.assignments.some(na => na.id === a.id))] };
    case 'remove':
      return { ...state, assignments: state.assignments.filter(a => a.id !== action.id) };
    default:
      return state;
  }
}

const EquipmentAccess = ({ onBack, onScroll, availableModules = [], isSuperAdmin = false }) => {
  const [dataState, dispatch] = useReducer(dataReducer, {
    loading: true, error: null, users: [], assignments: [],
  });
  const { loading: usersLoading, error, users, assignments } = dataState;

  const [view, setView] = useState('list'); // 'list' or 'form'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);
  const [accessLevels, setAccessLevels] = useState(ACCESS_LEVELS);
  const [accessLevel, setAccessLevel] = useState('user');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [moduleDropdownOpen, setModuleDropdownOpen] = useState(false);
  const [levelDropdownOpen, setLevelDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editLevel, setEditLevel] = useState('user');
  const [editLevelDropdownOpen, setEditLevelDropdownOpen] = useState(false);

  const getAccessLevelOptionLabel = (val) =>
    accessLevels.find(l => l.value === val)?.label || val || 'User';

  useEffect(() => {
    ApiService.getAccessLevels()
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.access_levels || res?.levels || res?.data || []);
        if (list.length > 0) {
          const mapped = list.map(item => {
            if (typeof item === 'string') {
              return { value: item, label: item.charAt(0).toUpperCase() + item.slice(1) };
            }
            return {
              value: item.value || item.code || item.id || item,
              label: item.label || item.name || item.value || item.code || item
            };
          });
          setAccessLevels(mapped);
        }
      })
      .catch(err => {
        console.error("Failed to load access levels:", err);
      });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const modules = availableModules.length > 0 ? availableModules : [];

  const currentUser = ApiService.getUser();

  // Bulletproof fallback to find current admin's company_id from user list if not cached in local storage
  let adminCompanyId = currentUser?.company_id;
  if (!adminCompanyId && currentUser && users.length > 0) {
    const self = users.find(u => String(u.id) === String(currentUser.id) || u.username === currentUser.username);
    if (self) {
      adminCompanyId = self.company_id;
    }
  }

  // Filter dropdown users: only show users assigned to the current Admin's company
  const filteredUsersForDropdown = users.filter(u => {
    if (!currentUser) return true;
    if (currentUser.role === 'superadmin') return true;
    if (!adminCompanyId) return true; // Fallback to showing all if we can't find the company ID yet
    return String(u.company_id) === String(adminCompanyId);
  });

  const [adminModules, setAdminModules] = useState([]);
  const [adminModulesLoading, setAdminModulesLoading] = useState(false);

  useEffect(() => {
    const adminId = currentUser?.id || currentUser?.user_id;
    if (!adminId || currentUser?.role === 'superadmin') return;

    let targetId = adminId;
    if (currentUser?.role === 'supervisor') {
      const self = users.find(u => String(u.id) === String(adminId) || u.username === currentUser.username);
      const agmId = self?.agm_id || self?.agmId || currentUser?.agm_id || currentUser?.agmId;
      if (agmId) {
        targetId = agmId;
      }
    }

    setAdminModulesLoading(true);
    ApiService.getAdminUserModules(targetId)
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.modules || res?.data || []);
        setAdminModules(list);
      })
      .catch(err => {
        console.error("Failed to load admin's modules:", err);
      })
      .finally(() => setAdminModulesLoading(false));
  }, [currentUser, users]);

  // Filter dropdown modules: only show modules assigned to the current Admin
  const displayModules = useMemo(() => {
    if (!currentUser) return modules;
    if (currentUser.role === 'superadmin') return modules;

    const allowedIds = new Set(adminModules.map(m => String(m.module_id || m.id)));
    return modules.filter(m => {
      const mId = m.module_id || m.id;
      return allowedIds.has(String(mId));
    });
  }, [modules, currentUser, adminModules]);

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
              id: `${user.id}_${m.module_id || m.id}`,
              userId: user.id,
              userName: user.name || user.username || 'Unknown',
              moduleId: m.module_id || m.id,
              moduleName: m.name || m.module_name || `Module ${m.module_id || m.id}`,
              moduleCode: m.code || m.module_code || '',
              level: m.access_level || 'user',
              date: (m.created_at || m.assigned_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
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
  /* ── Add assignment ───────────────────────────────────────────────── */
  const handleAddAssignment = async () => {
    if (selectedUsers.length === 0 || selectedModules.length === 0) {
      alert('Please select at least one user and at least one equipment module.');
      return;
    }
    setSaving(true);
    try {
      const newAssignments = [];
      const promises = [];

      selectedUsers.forEach(user => {
        selectedModules.forEach(m => {
          const moduleId = m.module_id || m.id;
          promises.push(
            ApiService.addAdminUserModule(user.id, {
              module_id: moduleId,
              access_level: accessLevel,
            }).then(() => {
              newAssignments.push({
                id: `${user.id}_${moduleId}`,
                userId: user.id,
                userName: user.name || user.username || 'Unknown',
                moduleId,
                moduleName: m.name,
                moduleCode: m.code || '',
                level: accessLevel,
                date: new Date().toISOString().split('T')[0],
              });
            })
          );
        });
      });

      await Promise.all(promises);

      dispatch({
        type: 'add_batch',
        assignments: newAssignments,
      });
      setSelectedUsers([]);
      setSelectedModules([]);
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

  /* ── Update assignment ────────────────────────────────────────────── */
  const handleUpdateAssignment = async () => {
    if (!editingAssignment) return;
    setSaving(true);
    try {
      await ApiService.addAdminUserModule(editingAssignment.userId, {
        module_id: editingAssignment.moduleId,
        access_level: editLevel,
      });
      dispatch({
        type: 'add',
        assignment: { ...editingAssignment, level: editLevel }
      });
      setEditingAssignment(null);
    } catch (err) {
      alert(err.message || 'Failed to update access level. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const closeDropdowns = () => {
    setUserDropdownOpen(false);
    setModuleDropdownOpen(false);
    setLevelDropdownOpen(false);
  };

  const filteredAssignments = assignments.filter(a => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      a.userName.toLowerCase().includes(q) ||
      a.moduleName.toLowerCase().includes(q) ||
      getLevelLabel(a.level).toLowerCase().includes(q)
    );
  });

  return (
    <div className="ea-page">
      <div className="setup-header">
        <button className="setup-back-btn" onClick={view === 'list' ? onBack : () => setView('list')} title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="setup-header-info" style={{ flex: 1 }}>

          <div>
            <div className="setup-title">{view === 'list' ? (isSuperAdmin ? 'Module Permissions' : 'Equipment Access') : 'Assign New Access'}</div>
            <div className="setup-subtitle">
              {view === 'list'
                ? (isSuperAdmin ? 'Superadmin Portal — Manage user permissions and module authorizations' : 'Equipment Access Management')
                : 'Link a user to a specific safety module and define their access level'}
            </div>
          </div>
        </div>
        {view === 'list' && (
          <div className="setup-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="ea-search-wrap">
              <svg className="ea-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="ea-search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="ea-search-clear" onClick={() => setSearchQuery('')}>×</button>
              )}
            </div>

            <button className="ea-add-nav-btn" onClick={() => setView('form')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" />
              </svg>
              Assign Access
            </button>
          </div>
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
          <div className="ea-integrated-list">
            {usersLoading ? (
              <div className="ea-list-loading">
                <div className="ea-spinner" />
                <span>Synchronizing permission data...</span>
              </div>
            ) : (
              <>


                <div className="ea-table-wrap" onScroll={onScroll}>
                  <table className="ea-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px', textAlign: 'center' }}>S.No</th>
                        <th>User</th>
                        <th>Equipment</th>
                        <th>Level</th>
                        <th>Assigned Date</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssignments.length > 0 ? filteredAssignments
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((a, idx) => {
                          const dateObj = new Date(a.date);
                          const formattedDate = !isNaN(dateObj)
                            ? `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`
                            : a.date;

                          return (
                            <tr key={a.id}>
                              <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
                                {(currentPage - 1) * itemsPerPage + idx + 1}
                              </td>
                              <td>
                                <div className="ea-user-cell">
                                  <span className="ea-user-name">{a.userName}</span>
                                </div>
                              </td>
                              <td>
                                <div className="ea-module-info">
                                  {a.moduleName}
                                </div>
                              </td>
                              <td>
                                <span className={`ea-level-tag ${(a.level || '').toLowerCase()}`}>
                                  {getLevelLabel(a.level)}
                                </span>
                              </td>
                              <td className="ea-date-cell">{formattedDate}</td>
                              <td style={{ textAlign: 'center' }}>
                                <div className="ea-actions">
                                  <button
                                    className="ea-action-btn edit"
                                    onClick={() => {
                                      setEditingAssignment(a);
                                      setEditLevel(a.level);
                                      setEditLevelDropdownOpen(false);
                                    }}
                                    title="Edit Access"
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                                      <path d="M12 20h9" />
                                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                    </svg>
                                  </button>
                                  <button
                                    className="ea-action-btn delete"
                                    onClick={() => handleRemoveAssignment(a)}
                                    disabled={removing === a.id}
                                    title="Revoke Access"
                                  >
                                    {removing === a.id ? (
                                      <div className="ea-btn-spinner" />
                                    ) : (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }) : (
                        <tr>
                          <td colSpan="6" className="ea-empty">
                            {error ? 'Could not load assignments.' : 'No access assignments found.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="6">
                          {filteredAssignments.length > itemsPerPage && (
                            <div className="ea-pagination">
                              <button
                                className="ea-pg-btn"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                              >
                                ← Previous
                              </button>
                              <span className="ea-pg-info">
                                Page <strong>{currentPage}</strong> of {Math.ceil(filteredAssignments.length / itemsPerPage)}
                              </span>
                              <button
                                className="ea-pg-btn"
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredAssignments.length / itemsPerPage), p + 1))}
                                disabled={currentPage === Math.ceil(filteredAssignments.length / itemsPerPage)}
                              >
                                Next →
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
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
                        ) : selectedUsers.length === 1 ? (
                          <><span className="ea-trigger-icon">👤</span>{selectedUsers[0].name || selectedUsers[0].username}</>
                        ) : selectedUsers.length > 1 ? (
                          `${selectedUsers.length} users selected`
                        ) : 'Choose user(s)...'}
                      </span>
                      <svg className="ea-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                    {userDropdownOpen && !usersLoading && (
                      <div className="ea-dropdown-options">
                        {filteredUsersForDropdown.length === 0 ? (
                          <div className="ea-option-empty">No users found</div>
                        ) : filteredUsersForDropdown.map(u => {
                          const isSelected = selectedUsers.some(item => item.id === u.id);
                          return (
                            <div
                              key={u.id}
                              className={`ea-option ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                const exists = selectedUsers.some(item => item.id === u.id);
                                if (exists) {
                                  setSelectedUsers(selectedUsers.filter(item => item.id !== u.id));
                                } else {
                                  setSelectedUsers([...selectedUsers, u]);
                                }
                              }}
                            >
                              <div className="ea-option-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                  type="checkbox"
                                  className="ea-module-checkbox"
                                  checked={isSelected}
                                  readOnly
                                  onClick={e => e.stopPropagation()}
                                />
                                <span className="ea-option-main">
                                  <span className="ea-option-name">{u.name || u.username}</span>
                                  <span className="ea-option-sub">
                                    {(u.role === 'user' || u.role === 'inspector') ? 'Inspector' : (u.role || 'Inspector')}
                                  </span>
                                </span>
                              </div>
                              {isSelected && <span className="ea-check">✓</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="ea-field">
                  <label className="ea-label">Select Equipment Module(s)</label>
                  <div className="ea-dropdown-wrap">
                    <div
                      className={`ea-dropdown-trigger ${moduleDropdownOpen ? 'open' : ''}`}
                      onClick={() => { setModuleDropdownOpen(v => !v); setUserDropdownOpen(false); setLevelDropdownOpen(false); }}
                    >
                      <span className="ea-trigger-text">
                        {selectedModules.length === 0 ? (
                          'Choose equipment...'
                        ) : selectedModules.length === 1 ? (
                          <><span className="ea-trigger-icon">{MODULE_EMOJI[selectedModules[0].code] || '📦'}</span>{selectedModules[0].name}</>
                        ) : (
                          `${selectedModules.length} modules selected`
                        )}
                      </span>
                      <svg className="ea-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                    {moduleDropdownOpen && (() => {
                      const assignedModuleIds = selectedUsers.length === 1
                        ? assignments.filter(a => String(a.userId) === String(selectedUsers[0].id)).map(a => String(a.moduleId))
                        : [];
                      return (
                        <div className="ea-dropdown-options">
                          {displayModules.map(m => {
                            const mId = m.module_id || m.id;
                            const isAssigned = assignedModuleIds.includes(String(mId));
                            const isSelected = selectedModules.some(item => String(item.module_id || item.id) === String(mId));
                            const isChecked = isAssigned || isSelected;
                            return (
                              <div
                                key={mId}
                                className={`ea-option ${isSelected ? 'selected' : ''} ${isAssigned ? 'already-assigned' : ''}`}
                                onClick={() => {
                                  if (!isAssigned) {
                                    const exists = selectedModules.some(item => String(item.module_id || item.id) === String(mId));
                                    if (exists) {
                                      setSelectedModules(selectedModules.filter(item => String(item.module_id || item.id) !== String(mId)));
                                    } else {
                                      setSelectedModules([...selectedModules, m]);
                                    }
                                  }
                                }}
                              >
                                <div className="ea-option-row">
                                  <input
                                    type="checkbox"
                                    className="ea-module-checkbox"
                                    checked={isChecked}
                                    readOnly
                                    onClick={e => e.stopPropagation()}
                                  />
                                  <span className="ea-option-icon">{MODULE_EMOJI[m.code] || '📦'}</span>
                                  <span className="ea-option-name">{m.name}</span>
                                </div>
                                {isAssigned && (
                                  <span className="ea-assigned-label">Assigned</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="ea-field">
                  <label className="ea-label">Access Level</label>
                  <div className="ea-dropdown-wrap">
                    <div
                      className={`ea-dropdown-trigger ${levelDropdownOpen ? 'open' : ''}`}
                      onClick={() => { setLevelDropdownOpen(v => !v); setUserDropdownOpen(false); setModuleDropdownOpen(false); }}
                    >
                      <span className="ea-trigger-text">{getAccessLevelOptionLabel(accessLevel)}</span>
                      <svg className="ea-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                    {levelDropdownOpen && (
                      <div className="ea-dropdown-options level-dropdown">
                        {accessLevels.map(level => (
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

      {editingAssignment && (
        <div className="ea-modal-overlay" onClick={() => setEditingAssignment(null)}>
          <div className="ea-modal-card" onClick={e => e.stopPropagation()}>
            <div className="ea-modal-header">
              <span className="ea-modal-card-icon">✏️</span>
              <div className="ea-modal-card-title">Update Access Level</div>
            </div>
            <div className="ea-modal-body">
              <div className="ea-field">
                <label className="ea-label">User</label>
                <div className="ea-readonly-val">{editingAssignment.userName}</div>
              </div>
              <div className="ea-field">
                <label className="ea-label">Equipment</label>
                <div className="ea-readonly-val">{editingAssignment.moduleName}</div>
              </div>
              <div className="ea-field">
                <label className="ea-label">Access Level</label>
                <div className="ea-dropdown-wrap">
                  <div
                    className={`ea-dropdown-trigger ${editLevelDropdownOpen ? 'open' : ''}`}
                    onClick={() => setEditLevelDropdownOpen(v => !v)}
                  >
                    <span className="ea-trigger-text">{getAccessLevelOptionLabel(editLevel)}</span>
                    <svg className="ea-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                  {editLevelDropdownOpen && (
                    <div className="ea-dropdown-options level-dropdown">
                      {accessLevels.map(level => (
                        <div
                          key={level.value}
                          className={`ea-option ${editLevel === level.value ? 'selected' : ''}`}
                          onClick={() => { setEditLevel(level.value); setEditLevelDropdownOpen(false); }}
                        >
                          <div className="ea-option-main">
                            <span className="ea-option-name">{level.label}</span>
                          </div>
                          {editLevel === level.value && <span className="ea-check">✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="ea-modal-footer">
              <button className="ea-cancel-btn" onClick={() => setEditingAssignment(null)}>Cancel</button>
              <button className="ea-submit-btn" onClick={handleUpdateAssignment} disabled={saving}>
                {saving ? <><span className="ea-btn-spinner" /> Saving...</> : <>Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {(userDropdownOpen || moduleDropdownOpen || levelDropdownOpen) && (
        <div className="ea-overlay" onClick={closeDropdowns} />
      )}
    </div>
  );
};

export default EquipmentAccess;
