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
  trained_shift: '🎓', sand_bucket: '🪣',
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

const EquipmentAccess = ({ onBack, onScroll, availableModules = [], isSuperAdmin = false, initialSearchQuery = '', initialSelectedUserId = null, onOpenModule }) => {
  const [dataState, dispatch] = useReducer(dataReducer, {
    loading: true, error: null, users: [], assignments: [],
  });
  const { loading: usersLoading, error, users, assignments } = dataState;

  const [view, setView] = useState('list'); // 'list' or 'form'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    if (initialSelectedUserId && users.length > 0) {
      const user = users.find(u => String(u.id) === String(initialSelectedUserId));
      if (user) {
        setSelectedUsers([user]);
        setView('form');
      }
    }
  }, [initialSelectedUserId, users]);

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);
  const [viewingUserModules, setViewingUserModules] = useState(null);
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

  // New specific equipment state
  const [managingSpecificEquipment, setManagingSpecificEquipment] = useState(null);
  const [specificEqTab, setSpecificEqTab] = useState('individual'); // 'individual' or 'location'
  const [eqSearchQuery, setEqSearchQuery] = useState('');
  const [specificEqLoading, setSpecificEqLoading] = useState(false);
  const [availableEq, setAvailableEq] = useState([]);
  const [selectedEqIds, setSelectedEqIds] = useState(new Set());
  const [specificEqSaving, setSpecificEqSaving] = useState(false);
  
  // For location tab
  const [locationOptions, setLocationOptions] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [assigningLocation, setAssigningLocation] = useState(false);
  const [removingAllEq, setRemovingAllEq] = useState(false);

  const handleOpenSpecificEq = async (assignment) => {
    setManagingSpecificEquipment(assignment);
    setSpecificEqTab('individual');
    setEqSearchQuery('');
    setSelectedLocationId('');
    setLocationOptions([]);
    setSpecificEqLoading(true);
    try {
      const [availableRes, assignedRes] = await Promise.all([
        ApiService.getEquipment({ module_id: assignment.moduleId, limit: 1000 }).catch(e => {
          console.warn('getEquipment failed:', e);
          return [];
        }),
        ApiService.getUserSpecificEquipment(assignment.userId, assignment.moduleId).catch(e => {
          console.warn('getUserSpecificEquipment failed:', e);
          return [];
        }),
      ]);

      const availableList = availableRes.items || availableRes.data || (Array.isArray(availableRes) ? availableRes : []);
      const assignedList = assignedRes.items || assignedRes.data || (Array.isArray(assignedRes) ? assignedRes : []);

      setAvailableEq(availableList);
      const assignedIds = new Set(assignedList.map(e => String(e.id || e.equipment_id || e.sos_code || e.equipment_code)));
      setSelectedEqIds(assignedIds);
    } catch (err) {
      alert("Failed to load specific equipment.");
    } finally {
      setSpecificEqLoading(false);
    }
  };


  const getAccessLevelOptionLabel = (val) =>
    accessLevels.find(l => l.value === val)?.label || val || 'User';

  // Lazy-load branches when "By Location" tab is opened, filtered by company_id via _injectCompanyId
  useEffect(() => {
    if (specificEqTab !== 'location' || !managingSpecificEquipment) return;
    if (locationOptions.length > 0) return;

    const user = ApiService.getUser();
    const companyId = user?.company_id;

    setLocationLoading(true);
    ApiService.getBranches(companyId ? { company_id: companyId } : {})
      .then(res => {
        const rawList = Array.isArray(res)
          ? res
          : (res?.data || res?.branches || res?.items || []);
        const list = Array.isArray(rawList) ? rawList : [];
        setLocationOptions(list.map(b => ({ id: b.id, name: b.name || b.branch_name || `Branch ${b.id}` })));
      })
      .catch(() => setLocationOptions([]))
      .finally(() => setLocationLoading(false));
  }, [specificEqTab, managingSpecificEquipment]);

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

  useEffect(() => {
    if (!userDropdownOpen) {
      setUserSearchQuery('');
    }
  }, [userDropdownOpen]);

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

  // Filter dropdown users: only show users assigned to the current Admin's company and matching the search query
  const filteredUsersForDropdown = users.filter(u => {
    if (!currentUser) return true;
    if (currentUser.role === 'superadmin') return true;
    if (!adminCompanyId) return true; // Fallback to showing all if we can't find the company ID yet
    return String(u.company_id) === String(adminCompanyId);
  }).filter(u => {
    const q = userSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = (u.name || u.username || '').toLowerCase();
    const role = (u.role || '').toLowerCase();
    return name.includes(q) || role.includes(q);
  });

  const [adminModules, setAdminModules] = useState([]);
  const [adminModulesLoading, setAdminModulesLoading] = useState(false);

  useEffect(() => {
    const adminId = currentUser?.id || currentUser?.user_id;
    if (!adminId || currentUser?.role === 'superadmin') return;

    let targetId = adminId;

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

  // Pre-populate selectedModules with currently assigned modules when exactly one user is selected
  useEffect(() => {
    if (selectedUsers.length === 1) {
      const userId = selectedUsers[0].id;
      const userAssignments = assignments.filter(a => String(a.userId) === String(userId));
      const preselected = modules.filter(m =>
        userAssignments.some(a => String(a.moduleId) === String(m.module_id || m.id))
      );
      setSelectedModules(preselected);
    } else {
      setSelectedModules([]);
    }
  }, [selectedUsers, assignments, modules]);

  /* ── Load users + their module assignments ─────────────────────── */
  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        let userList = [];
        const role = (currentUser?.role || '').toLowerCase();
        const currentUserId = currentUser?.id || currentUser?.user_id;

        const raw = await ApiService.getAdminUsers();
        if (!active) return;
        userList = Array.isArray(raw) ? raw : (raw?.users || raw?.data || []);

        // Deduplicate user list by ID
        const seen = new Set();
        const uniqueUserList = [];
        userList.forEach(u => {
          if (u && u.id && !seen.has(u.id)) {
            seen.add(u.id);
            uniqueUserList.push(u);
          }
        });

        const results = await Promise.allSettled(
          uniqueUserList.map(u => ApiService.getAdminUserModules(u.id).then(d => ({ user: u, data: d })))
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
    if (selectedUsers.length === 0) {
      alert('Please select at least one user.');
      return;
    }
    setSaving(true);
    try {
      const promises = [];

      selectedUsers.forEach(user => {
        const userAssignments = assignments.filter(a => String(a.userId) === String(user.id));
        const assignedIds = new Set(userAssignments.map(a => String(a.moduleId)));
        const selectedIds = new Set(selectedModules.map(m => String(m.module_id || m.id)));

        // Modules to add: selected, but not currently assigned
        selectedModules.forEach(m => {
          const moduleId = m.module_id || m.id;
          if (!assignedIds.has(String(moduleId))) {
            promises.push(
              ApiService.addAdminUserModule(user.id, {
                module_id: moduleId,
                access_level: accessLevel,
              })
            );
          }
        });

        // Modules to remove: currently assigned, but not selected
        userAssignments.forEach(a => {
          if (!selectedIds.has(String(a.moduleId))) {
            promises.push(
              ApiService.removeAdminUserModule(user.id, a.moduleId)
            );
          }
        });
      });

      await Promise.all(promises);

      // Reload assignments list from server
      setRefreshKey(k => k + 1);

      setSelectedUsers([]);
      setSelectedModules([]);
      setAccessLevel('user');
      setView('list');
      showToast('Access assigned successfully.');
    } catch (err) {
      alert(err.message || 'Failed to update access assignments. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmRemoveAssignment = (assignment) => {
    setDeleteConfirm(assignment);
  };

  const executeRemoveAssignment = async () => {
    if (!deleteConfirm) return;
    setRemoving(deleteConfirm.id);
    try {
      await ApiService.removeAdminUserModule(deleteConfirm.userId, deleteConfirm.moduleId);
      dispatch({ type: 'remove', id: deleteConfirm.id });
      showToast('Access revoked successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to revoke access. Please try again.', 'error');
    } finally {
      setRemoving(null);
      setDeleteConfirm(null);
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
      showToast('Access level updated successfully.');
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
    <div className="setup-page ea-page">
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff', padding: '12px 20px', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '8px',
          fontWeight: '500', animation: 'fe-fade 0.3s ease-out'
        }}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          {toast.message}
        </div>
      )}
      {deleteConfirm && (
        <div className="ea-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="ea-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="ea-modal-header" style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
              <span className="ea-modal-card-icon" style={{ fontSize: '20px' }}>⚠️</span>
              <div className="ea-modal-card-title" style={{ color: '#991b1b' }}>Confirm Revocation</div>
            </div>
            <div className="ea-modal-body">
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: '#1f2937' }}>
                Are you sure you want to revoke <strong>{deleteConfirm.userName}</strong>'s access to <strong>{deleteConfirm.moduleName}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="ea-modal-footer">
              <button className="ea-cancel-btn" style={{ color: '#374151', border: '1px solid #d1d5db', background: '#fff' }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="ea-submit-btn" style={{ background: '#ef4444', color: '#fff', border: 'none' }} onClick={executeRemoveAssignment} disabled={removing === deleteConfirm.id}>
                {removing === deleteConfirm.id ? 'Revoking...' : 'Revoke Access'}
              </button>
            </div>
          </div>
        </div>
      )}
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
            <div className="um-search-wrap" style={{ margin: 0 }}>
              <svg className="um-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="um-search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="um-search-clear" onClick={() => setSearchQuery('')}>×</button>
              )}
            </div>

            <button className="um-add-btn" onClick={() => setView('form')}>
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
                                    className="ea-action-btn specific-eq"
                                    onClick={() => handleOpenSpecificEq(a)}
                                    title="Manage Specific Equipment"
                                    style={{ color: '#3b82f6' }}
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                      <line x1="9" y1="3" x2="9" y2="21"></line>
                                    </svg>
                                  </button>
                                  <button
                                    className="ea-action-btn view-module"
                                    onClick={() => {
                                      const u = users.find(usr => String(usr.id) === String(a.userId));
                                      if (u) {
                                        setViewingUserModules(u);
                                      } else {
                                        alert('User details not found.');
                                      }
                                    }}
                                    title="View Assigned Modules"
                                    style={{ color: '#10b981' }}
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                  </button>
                                  <button
                                    className="ea-action-btn delete"
                                    onClick={() => confirmRemoveAssignment(a)}
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
                      <div className="ea-dropdown-options with-search">
                        <div className="ea-dropdown-search-container" onClick={e => e.stopPropagation()}>
                          <svg className="ea-dropdown-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                          </svg>
                          <input
                            type="text"
                            className="ea-dropdown-search-input"
                            placeholder="Search by name or role..."
                            value={userSearchQuery}
                            onChange={e => setUserSearchQuery(e.target.value)}
                            autoFocus
                          />
                          {userSearchQuery && (
                            <button className="ea-dropdown-search-clear-btn" onClick={() => setUserSearchQuery('')}>×</button>
                          )}
                        </div>
                        <div className="ea-dropdown-options-list">
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
                    {moduleDropdownOpen && (
                      <div className="ea-dropdown-options">
                        {displayModules.map(m => {
                          const mId = m.module_id || m.id;
                          const isSelected = selectedModules.some(item => String(item.module_id || item.id) === String(mId));
                          return (
                            <div
                              key={mId}
                              className={`ea-option ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                const exists = selectedModules.some(item => String(item.module_id || item.id) === String(mId));
                                if (exists) {
                                  setSelectedModules(selectedModules.filter(item => String(item.module_id || item.id) !== String(mId)));
                                } else {
                                  setSelectedModules([...selectedModules, m]);
                                }
                              }}
                            >
                              <div className="ea-option-row">
                                <input
                                  type="checkbox"
                                  className="ea-module-checkbox"
                                  checked={isSelected}
                                  readOnly
                                  onClick={e => e.stopPropagation()}
                                />
                                <span className="ea-option-icon">{MODULE_EMOJI[m.code] || '📦'}</span>
                                <span className="ea-option-name">{m.name}</span>
                              </div>
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

      {viewingUserModules && (() => {
        const userAssignments = assignments.filter(a => String(a.userId) === String(viewingUserModules.id));
        return (
          <div className="ea-modal-overlay" onClick={() => setViewingUserModules(null)}>
            <div className="ea-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
              <div className="ea-modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="ea-modal-card-icon">🗂️</span>
                <div className="ea-modal-card-title" style={{ fontSize: '18px' }}>
                  Assigned Modules — {viewingUserModules.name || viewingUserModules.username}
                </div>
                <button className="ea-modal-close-btn" onClick={() => setViewingUserModules(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '20px', cursor: 'pointer', outline: 'none' }}>&times;</button>
              </div>
              <div className="ea-modal-body" style={{ maxHeight: '350px', overflowY: 'auto', padding: '16px 20px' }}>
                {userAssignments.length === 0 ? (
                  <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '20px 0' }}>No modules assigned.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {userAssignments.map(a => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                        <span style={{ fontSize: '18px' }}>{MODULE_EMOJI[a.moduleCode] || '📦'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>{a.moduleName}</div>
                          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Assigned on: {a.date}</div>
                        </div>
                        <span className={`ea-level-tag ${(a.level || '').toLowerCase()}`} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>
                          {getLevelLabel(a.level)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="ea-modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="ea-submit-btn" onClick={() => setViewingUserModules(null)} style={{ padding: '8px 16px', fontSize: '13px' }}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {(userDropdownOpen || moduleDropdownOpen || levelDropdownOpen) && (
        <div className="ea-overlay" onClick={closeDropdowns} />
      )}

      {managingSpecificEquipment && (
        <div className="ea-modal-overlay" onClick={() => setManagingSpecificEquipment(null)}>
          <div className="ea-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="ea-modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="ea-modal-card-icon">📋</span>
                  <div className="ea-modal-card-title" style={{ fontSize: '18px' }}>
                    Specific Equipment — {managingSpecificEquipment.userName}
                  </div>
                </div>
                <button className="ea-modal-close-btn" onClick={() => setManagingSpecificEquipment(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '20px', cursor: 'pointer', outline: 'none' }}>&times;</button>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <button 
                  onClick={() => setSpecificEqTab('individual')} 
                  style={{ background: 'none', border: 'none', color: specificEqTab === 'individual' ? '#fff' : 'rgba(255,255,255,0.5)', borderBottom: specificEqTab === 'individual' ? '2px solid #3b82f6' : '2px solid transparent', paddingBottom: '10px', fontSize: '14px', cursor: 'pointer' }}
                >
                  Individual Items
                </button>
                <button 
                  onClick={() => setSpecificEqTab('location')} 
                  style={{ background: 'none', border: 'none', color: specificEqTab === 'location' ? '#fff' : 'rgba(255,255,255,0.5)', borderBottom: specificEqTab === 'location' ? '2px solid #3b82f6' : '2px solid transparent', paddingBottom: '10px', fontSize: '14px', cursor: 'pointer' }}
                >
                  By Location
                </button>
              </div>
            </div>

            <div className="ea-modal-body" style={{ maxHeight: '450px', overflowY: 'auto', padding: '16px 20px' }}>
              {specificEqTab === 'individual' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                      Selected: {selectedEqIds.size} / {availableEq.length}
                    </div>
                    <input 
                      type="text" 
                      placeholder="Search equipment..." 
                      value={eqSearchQuery}
                      onChange={(e) => setEqSearchQuery(e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', width: '200px' }}
                    />
                  </div>
                  {specificEqLoading ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>Loading equipment...</div>
                  ) : availableEq.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No equipment found for this module.</div>
                  ) : (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {availableEq.filter(eq => {
                         const code = eq.equipment_code || eq.sos_code || eq.id || '';
                         const name = eq.equipment_name || eq.name || '';
                         const loc = eq.location_name || eq.building_name || '';
                         const q = eqSearchQuery.toLowerCase();
                         return String(code).toLowerCase().includes(q) || String(name).toLowerCase().includes(q) || String(loc).toLowerCase().includes(q);
                      }).map(eq => {
                        const eqApiId = eq.id || eq.equipment_id;
                        const eqId = String(eqApiId || eq.sos_code || eq.equipment_code);
                        const isSelected = selectedEqIds.has(eqId);
                        return (
                          <label key={eqId} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', cursor: 'pointer', border: isSelected ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid transparent' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newSet = new Set(selectedEqIds);
                                if (e.target.checked) newSet.add(eqId);
                                else newSet.delete(eqId);
                                setSelectedEqIds(newSet);
                              }}
                              style={{ accentColor: '#3b82f6', width: '18px', height: '18px' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600', color: '#fff', fontSize: '14px' }}>{eq.equipment_code || eq.sos_code || eqId}</div>
                              {(eq.equipment_name || eq.name) && (
                                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{eq.equipment_name || eq.name}</div>
                              )}
                              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{eq.location_name || eq.building_name || 'No location'}</div>
                            </div>
                            {isSelected && (
                              <button
                                onClick={async (e) => {
                                  e.preventDefault();
                                  try {
                                    await ApiService.removeUserSpecificEquipmentItem(managingSpecificEquipment.userId, eqApiId || eqId);
                                    const newSet = new Set(selectedEqIds);
                                    newSet.delete(eqId);
                                    setSelectedEqIds(newSet);
                                  } catch (err) {
                                    alert('Failed to remove individual item');
                                  }
                                }}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}
                              >
                                Remove
                              </button>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {specificEqTab === 'location' && (
                <div style={{ padding: '20px 0' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Select Location / Building</label>
                  {locationLoading ? (
                    <div style={{ color: '#94a3b8', fontSize: '13px', padding: '10px 0' }}>Loading locations...</div>
                  ) : (
                  <select
                    value={selectedLocationId}
                    onChange={e => setSelectedLocationId(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '14px' }}
                  >
                    <option value="">-- Choose a location --</option>
                    {locationOptions.length === 0 ? (
                      <option disabled value="">No locations found</option>
                    ) : locationOptions.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                  )}
                  <button 
                    onClick={async () => {
                      if (!selectedLocationId) return alert('Select a location first.');
                      setAssigningLocation(true);
                      try {
                        await ApiService.assignEquipmentByLocation(managingSpecificEquipment.userId, {
                          module_id: managingSpecificEquipment.moduleId,
                          location_id: selectedLocationId
                        });
                        showToast('Location assigned successfully.');
                        setManagingSpecificEquipment(null);
                      } catch (err) {
                        alert(err.message || 'Failed to assign location.');
                      } finally {
                        setAssigningLocation(false);
                      }
                    }}
                    disabled={assigningLocation || !selectedLocationId || locationLoading}
                    style={{ marginTop: '20px', width: '100%', padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: (assigningLocation || !selectedLocationId || locationLoading) ? 'not-allowed' : 'pointer' }}
                  >
                    {assigningLocation ? 'Assigning...' : 'Assign Entire Location'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="ea-modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                onClick={async () => {
                  if (window.confirm('Are you sure you want to remove ALL equipment assignments for this module?')) {
                    setRemovingAllEq(true);
                    try {
                      await ApiService.removeAllUserSpecificEquipment(managingSpecificEquipment.userId, managingSpecificEquipment.moduleId);
                      showToast('All equipment removed.');
                      setManagingSpecificEquipment(null);
                    } catch (err) {
                      alert('Failed to remove all equipment');
                    } finally {
                      setRemovingAllEq(false);
                    }
                  }
                }}
                disabled={removingAllEq}
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {removingAllEq ? 'Removing...' : 'Remove All Equipment'}
              </button>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="ea-cancel-btn" onClick={() => setManagingSpecificEquipment(null)} style={{ padding: '8px 16px', fontSize: '13px' }}>Cancel</button>
                {specificEqTab === 'individual' && (
                  <button 
                    className="ea-submit-btn" 
                    onClick={async () => {
                      setSpecificEqSaving(true);
                      try {
                        const equipmentIds = Array.from(selectedEqIds).map(id => {
                          const n = Number(id);
                          return Number.isFinite(n) && n > 0 ? n : id;
                        });
                        await ApiService.replaceUserSpecificEquipment(managingSpecificEquipment.userId, {
                          module_id: managingSpecificEquipment.moduleId,
                          equipment_ids: equipmentIds
                        });
                        showToast('Equipment assigned successfully.');
                        setManagingSpecificEquipment(null);
                      } catch (err) {
                        alert(err.message || 'Failed to assign equipment.');
                      } finally {
                        setSpecificEqSaving(false);
                      }
                    }} 
                    disabled={specificEqSaving || specificEqLoading}
                    style={{ padding: '8px 16px', fontSize: '13px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: (specificEqSaving || specificEqLoading) ? 'not-allowed' : 'pointer' }}
                  >
                    {specificEqSaving ? 'Saving...' : 'Save Specific Equipment'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EquipmentAccess;
