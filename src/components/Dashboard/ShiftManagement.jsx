import React, { useState, useEffect, useMemo } from 'react';
import { ApiService } from '../../services/apiService';
import './UserManagement.css'; // Reuse User Management table styles

const PAGE_SIZE = 10;

const ShiftManagement = ({ onBack }) => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('templates'); // 'templates', 'assignments', 'my_shifts'
  const [shifts, setShifts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Search
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editTemplateTarget, setEditTemplateTarget] = useState(null);
  const [templateForm, setTemplateForm] = useState({ name: '', startTime: '09:00', endTime: '17:00' });
  
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({ inspectorId: '', shiftId: '', date: new Date().toISOString().split('T')[0] });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Selected date for Daily Assignments view
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const currentUser = ApiService.getUser();
    setUser(currentUser);
    
    // Auto adjust tab based on role
    if (currentUser?.role === 'inspector' || currentUser?.role === 'user') {
      setActiveTab('my_shifts');
    } else if (currentUser?.role === 'supervisor') {
      setActiveTab('assignments');
    } else {
      setActiveTab('templates');
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const currentUser = ApiService.getUser();
      const promises = [
        ApiService.getAdminShifts().catch(() => []),
        ApiService.getAdminShiftAssignments().catch(() => [])
      ];

      // Only fetch user list if they are authorized to assign shifts
      if (currentUser?.role !== 'inspector') {
        promises.push(ApiService.getAdminUsers().catch(() => []));
      } else {
        promises.push(Promise.resolve([]));
      }

      const [shiftsRes, assignmentsRes, usersRes] = await Promise.all(promises);
      
      const shiftsList = Array.isArray(shiftsRes) ? shiftsRes : (shiftsRes?.shifts || shiftsRes?.data || shiftsRes?.items || []);
      const assignmentsList = Array.isArray(assignmentsRes) ? assignmentsRes : (assignmentsRes?.assignments || assignmentsRes?.data || assignmentsRes?.items || []);
      
      setShifts(shiftsList);
      setAssignments(assignmentsList);
      
      // Filter out only inspector accounts
      const inspectorUsers = (Array.isArray(usersRes) ? usersRes : (usersRes?.users || usersRes?.data || []))
        .filter(u => u.role === 'inspector');
      setInspectors(inspectorUsers);
      
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load shifts and assignments.');
    } finally {
      setLoading(false);
    }
  };

  const fetchShiftsOnly = async () => {
    try {
      const res = await ApiService.getAdminShifts();
      const list = Array.isArray(res) ? res : (res?.shifts || res?.data || res?.items || []);
      setShifts(list);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAssignmentsOnly = async () => {
    try {
      const res = await ApiService.getAdminShiftAssignments();
      const list = Array.isArray(res) ? res : (res?.assignments || res?.data || res?.items || []);
      setAssignments(list);
    } catch (e) {
      console.error(e);
    }
  };

  // Roles permissions check helpers
  const canDefineTemplates = useMemo(() => {
    return ['superadmin', 'admin', 'agm'].includes(user?.role);
  }, [user]);

  const canAssignShifts = useMemo(() => {
    return ['superadmin', 'admin', 'agm', 'supervisor'].includes(user?.role);
  }, [user]);

  // -- Shift Templates Modal Save --
  const handleSaveTemplate = async () => {
    const name = templateForm.name.trim();
    if (!name) {
      setFormError('Shift name is required.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        shift_name: name,
        start_time: templateForm.startTime,
        end_time: templateForm.endTime
      };

      if (editTemplateTarget) {
        await ApiService.updateAdminShift(editTemplateTarget.id, payload);
      } else {
        await ApiService.createAdminShift(payload);
      }
      setShowTemplateForm(false);
      await fetchShiftsOnly();
    } catch (err) {
      setFormError(err.message || 'Failed to save shift template.');
    } finally {
      setSaving(false);
    }
  };

  const openAddTemplate = () => {
    setEditTemplateTarget(null);
    setTemplateForm({ name: '', startTime: '09:00', endTime: '17:00' });
    setFormError('');
    setShowTemplateForm(true);
  };

  const openEditTemplate = (s) => {
    setEditTemplateTarget(s);
    setTemplateForm({ name: s.shift_name || s.name, startTime: s.start_time || '09:00', endTime: s.end_time || '17:00' });
    setFormError('');
    setShowTemplateForm(true);
  };

  const handleDeleteTemplate = async (id, name) => {
    if (!window.confirm(`Delete shift template "${name}"?`)) return;
    try {
      await ApiService.deleteAdminShift(id);
      await fetchShiftsOnly();
    } catch (err) {
      alert(err.message || 'Failed to delete template.');
    }
  };

  // -- Shift Assignments Save --
  const handleSaveAssignment = async () => {
    if (!assignmentForm.inspectorId) {
      setFormError('Please select an inspector.');
      return;
    }
    if (!assignmentForm.shiftId) {
      setFormError('Please select a shift template.');
      return;
    }
    if (!assignmentForm.date) {
      setFormError('Please select a date.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const inspectorObj = inspectors.find(i => String(i.id) === String(assignmentForm.inspectorId));
      const shiftObj = shifts.find(s => String(s.id) === String(assignmentForm.shiftId));

      const payload = {
        user_id: Number(assignmentForm.inspectorId),
        shift_id: Number(assignmentForm.shiftId),
        date: assignmentForm.date,
        // UI Helpers
        inspector_name: inspectorObj ? (inspectorObj.name || inspectorObj.username || '') : `ID: ${assignmentForm.inspectorId}`,
        shift_name: shiftObj ? (shiftObj.shift_name || shiftObj.name) : 'Unknown Shift',
        start_time: shiftObj ? shiftObj.start_time : '00:00',
        end_time: shiftObj ? shiftObj.end_time : '00:00',
      };

      await ApiService.createAdminShiftAssignment(payload);
      setShowAssignForm(false);
      await fetchAssignmentsOnly();
    } catch (err) {
      setFormError(err.message || 'Failed to assign shift.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssignment = async (id, inspectorName, shiftName) => {
    if (!window.confirm(`Remove shift "${shiftName}" from ${inspectorName}?`)) return;
    try {
      await ApiService.deleteAdminShiftAssignment(id);
      await fetchAssignmentsOnly();
    } catch (err) {
      alert(err.message || 'Failed to remove assignment.');
    }
  };

  // Filters daily assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => a.date === filterDate);
  }, [assignments, filterDate]);

  // Filters my shifts (only where current inspector user matches user_id)
  const myAssignedShifts = useMemo(() => {
    if (!user) return [];
    return assignments.filter(a => String(a.user_id) === String(user.id));
  }, [assignments, user]);

  return (
    <div className="setup-page">
      {/* Header */}
      <div className="setup-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className="setup-back-btn" onClick={onBack} title="Back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div className="setup-header-info">
            <div className="setup-title">Shift Management</div>
          </div>
        </div>

        {/* Navigation tabs in header (top right) */}
        {['superadmin', 'admin', 'agm'].includes(user?.role) && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className={`um-pg-btn ${activeTab === 'templates' ? 'fe-page-active' : ''}`}
              onClick={() => { setActiveTab('templates'); setPage(1); }}
              style={{ padding: '8px 16px', background: activeTab === 'templates' ? '#3b82f6' : 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer' }}
            >
              📋 Shift Templates
            </button>
            <button 
              className={`um-pg-btn ${activeTab === 'assignments' ? 'fe-page-active' : ''}`}
              onClick={() => { setActiveTab('assignments'); setPage(1); }}
              style={{ padding: '8px 16px', background: activeTab === 'assignments' ? '#3b82f6' : 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer' }}
            >
              📅 Daily Assignments
            </button>
          </div>
        )}
      </div>

      {/* Main page content wrapper */}
      <div className="um-content-wrap">


        {loading ? (
          <div className="um-state-block"><div className="um-spinner" /><span>Loading shift data...</span></div>
        ) : error ? (
          <div className="um-state-block um-error-block">
            <span>⚠️ {error}</span>
            <button className="um-retry-btn" onClick={fetchData}>Retry</button>
          </div>
        ) : (
          <>
            {/* TAB: SHIFT TEMPLATES */}
            {activeTab === 'templates' && (
              <div>
                <table className="um-table" style={{ width: '100%', marginTop: '10px' }}>
                  <thead>
                    <tr>
                      <th colSpan="3" style={{ background: '#f8f9fa', border: 'none' }}></th>
                      <th colSpan={canDefineTemplates ? "2" : "1"} style={{ background: '#f8f9fa', textAlign: 'right', border: 'none' }}>
                        {canDefineTemplates && (
                          <button className="um-add-btn" onClick={openAddTemplate} style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-block', margin: 0 }}>
                            + Add Shift Template
                          </button>
                        )}
                      </th>
                    </tr>
                    <tr>
                      <th className="um-th-num" style={{ width: '60px', textAlign: 'center' }}>S.NO</th>
                      <th>Shift Name</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Start Time</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>End Time</th>
                      {canDefineTemplates && <th className="um-th-actions" style={{ width: '110px', textAlign: 'center' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.length === 0 ? (
                      <tr>
                        <td colSpan={canDefineTemplates ? 5 : 4} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                          <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🕒</span>
                          No shift templates configured.
                        </td>
                      </tr>
                    ) : (
                      shifts.map((s, idx) => (
                        <tr key={s.id || idx}>
                          <td className="um-td-num" style={{ textAlign: 'center' }}>{idx + 1}</td>
                          <td>
                            <span className="um-name" style={{ fontWeight: '600', color: '#000' }}>{s.shift_name || s.name}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}><span style={{ color: '#000', fontWeight: '500' }}>{s.start_time}</span></td>
                          <td style={{ textAlign: 'center' }}><span style={{ color: '#000', fontWeight: '500' }}>{s.end_time}</span></td>
                          {canDefineTemplates && (
                            <td style={{ textAlign: 'center' }}>
                              <div className="um-actions" style={{ justifyContent: 'center' }}>
                                <button className="um-action-btn edit" onClick={() => openEditTemplate(s)} title="Edit template" style={{ marginRight: '6px' }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                                <button className="um-action-btn delete" onClick={() => handleDeleteTemplate(s.id, s.shift_name || s.name)} title="Delete template">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                    <path d="M10 11v6" /><path d="M14 11v6" />
                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB: DAILY ASSIGNMENTS */}
            {activeTab === 'assignments' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ margin: 0, color: '#fff' }}>Daily Shifts</h3>
                    <input 
                      type="date" 
                      value={filterDate}
                      onChange={e => setFilterDate(e.target.value)}
                      style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '6px',
                        borderRadius: '4px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  {canAssignShifts && (
                    <button 
                      className="um-add-btn" 
                      onClick={() => {
                        setAssignmentForm({ inspectorId: '', shiftId: '', date: filterDate });
                        setFormError('');
                        setShowAssignForm(true);
                      }} 
                      style={{ margin: 0 }}
                    >
                      + Assign Shift
                    </button>
                  )}
                </div>

                {filteredAssignments.length === 0 ? (
                  <div className="um-state-block">
                    <span className="um-empty-icon">📅</span>
                    <p>No inspectors assigned to shifts for {filterDate}.</p>
                  </div>
                ) : (
                  <table className="um-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th className="um-th-num" style={{ width: '60px', textAlign: 'center' }}>S.NO</th>
                        <th>Inspector Name</th>
                        <th>Shift Assigned</th>
                        <th style={{ width: '180px', textAlign: 'center' }}>Shift Hours</th>
                        {canAssignShifts && <th className="um-th-actions" style={{ width: '110px', textAlign: 'center' }}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssignments.map((a, idx) => (
                        <tr key={a.id || idx}>
                          <td className="um-td-num" style={{ textAlign: 'center' }}>{idx + 1}</td>
                          <td>
                            <span className="um-name" style={{ fontWeight: '600', color: '#000' }}>{a.inspector_name}</span>
                          </td>
                          <td><span style={{ color: '#000', fontWeight: '500' }}>{a.shift_name}</span></td>
                          <td style={{ textAlign: 'center' }}><span style={{ color: '#000', fontWeight: '500' }}>{a.start_time} - {a.end_time}</span></td>
                          {canAssignShifts && (
                            <td style={{ textAlign: 'center' }}>
                              <div className="um-actions" style={{ justifyContent: 'center' }}>
                                <button 
                                  className="um-action-btn delete" 
                                  onClick={() => handleDeleteAssignment(a.id, a.inspector_name, a.shift_name)} 
                                  title="Remove assignment"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                    <path d="M10 11v6" /><path d="M14 11v6" />
                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB: MY SHIFTS (INSPECTORS VIEW) */}
            {activeTab === 'my_shifts' && (
              <div>
                <h3 style={{ marginBottom: '14px', color: '#fff' }}>My Assigned Roster</h3>

                {myAssignedShifts.length === 0 ? (
                  <div className="um-state-block">
                    <span className="um-empty-icon">🔒</span>
                    <p>You have no shift assignments scheduled.</p>
                  </div>
                ) : (
                  <table className="um-table">
                    <thead>
                      <tr>
                        <th className="um-th-num" style={{ width: '60px' }}>S.NO</th>
                        <th>Date</th>
                        <th>Shift Name</th>
                        <th>Shift Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myAssignedShifts.map((a, idx) => (
                        <tr key={a.id || idx}>
                          <td className="um-td-num">{idx + 1}</td>
                          <td>
                            <span className="um-name" style={{ fontWeight: '600', color: '#000' }}>{a.date}</span>
                          </td>
                          <td><span style={{ color: '#000', fontWeight: '500' }}>{a.shift_name}</span></td>
                          <td><span style={{ color: '#000', fontWeight: '500' }}>{a.start_time} - {a.end_time}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL: Shift Template Add/Edit Form */}
      {showTemplateForm && (
        <div className="um-overlay" onClick={() => setShowTemplateForm(false)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <div className="um-modal-head">
              <div className="um-modal-title">
                <span style={{ fontSize: 20, marginRight: '8px' }}>🕒</span> {editTemplateTarget ? 'Edit Shift Template' : 'Add Shift Template'}
              </div>
              <button className="um-modal-close" onClick={() => setShowTemplateForm(false)}>×</button>
            </div>
            <div className="um-modal-body">
              {formError && <div className="um-form-error" style={{ color: '#ef4444', marginBottom: '10px' }}>⚠️ {formError}</div>}
              <div className="um-form-grid" style={{ display: 'block' }}>
                <div className="um-form-field">
                  <label>Shift Template Name <span className="um-req">*</span></label>
                  <input
                    value={templateForm.name}
                    onChange={e => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Day Shift, Evening Shift"
                    autoFocus
                    style={{ color: '#000' }}
                  />
                </div>
                <div className="um-form-field" style={{ marginTop: '14px' }}>
                  <label>Start Time <span className="um-req">*</span></label>
                  <input
                    type="time"
                    value={templateForm.startTime}
                    onChange={e => setTemplateForm(prev => ({ ...prev, startTime: e.target.value }))}
                    style={{ color: '#000' }}
                  />
                </div>
                <div className="um-form-field" style={{ marginTop: '14px' }}>
                  <label>End Time <span className="um-req">*</span></label>
                  <input
                    type="time"
                    value={templateForm.endTime}
                    onChange={e => setTemplateForm(prev => ({ ...prev, endTime: e.target.value }))}
                    style={{ color: '#000' }}
                  />
                </div>
              </div>
            </div>
            <div className="um-modal-foot">
              <button className="um-btn-cancel" onClick={() => setShowTemplateForm(false)}>Cancel</button>
              <button className="um-btn-save" onClick={handleSaveTemplate} disabled={saving}>
                {saving ? 'Saving...' : (editTemplateTarget ? 'Save Changes' : 'Create Template')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Shift Assignment Form */}
      {showAssignForm && (
        <div className="um-overlay" onClick={() => setShowAssignForm(false)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <div className="um-modal-head">
              <div className="um-modal-title">
                <span style={{ fontSize: 20, marginRight: '8px' }}>📅</span> Assign Shift to Inspector
              </div>
              <button className="um-modal-close" onClick={() => setShowAssignForm(false)}>×</button>
            </div>
            <div className="um-modal-body">
              {formError && <div className="um-form-error" style={{ color: '#ef4444', marginBottom: '10px' }}>⚠️ {formError}</div>}
              <div className="um-form-grid" style={{ display: 'block' }}>
                <div className="um-form-field">
                  <label>Select Inspector <span className="um-req">*</span></label>
                  <select
                    value={assignmentForm.inspectorId}
                    onChange={e => setAssignmentForm(prev => ({ ...prev, inspectorId: e.target.value }))}
                    style={{
                      background: 'rgba(30, 41, 59, 0.5)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      padding: '8px',
                      width: '100%',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="" style={{ background: '#1e293b' }}>— Select Inspector —</option>
                    {inspectors.map(i => (
                      <option key={i.id} value={i.id} style={{ background: '#1e293b' }}>
                        {i.name || i.username} ({i.username || i.email || 'No email'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="um-form-field" style={{ marginTop: '14px' }}>
                  <label>Select Shift Template <span className="um-req">*</span></label>
                  <select
                    value={assignmentForm.shiftId}
                    onChange={e => setAssignmentForm(prev => ({ ...prev, shiftId: e.target.value }))}
                    style={{
                      background: 'rgba(30, 41, 59, 0.5)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      padding: '8px',
                      width: '100%',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="" style={{ background: '#1e293b' }}>— Select Shift Template —</option>
                    {shifts.map(s => (
                      <option key={s.id} value={s.id} style={{ background: '#1e293b' }}>
                        {s.shift_name || s.name} ({s.start_time} - {s.end_time})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="um-form-field" style={{ marginTop: '14px' }}>
                  <label>Assignment Date <span className="um-req">*</span></label>
                  <input
                    type="date"
                    value={assignmentForm.date}
                    onChange={e => setAssignmentForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="um-modal-foot">
              <button className="um-btn-cancel" onClick={() => setShowAssignForm(false)}>Cancel</button>
              <button className="um-btn-save" onClick={handleSaveAssignment} disabled={saving}>
                {saving ? 'Assigning...' : 'Assign Shift'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftManagement;
