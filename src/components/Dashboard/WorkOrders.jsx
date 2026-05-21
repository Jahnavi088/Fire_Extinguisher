import React, { useState, useEffect } from 'react';
import './WorkOrders.css';
import { ApiService } from '../../services/apiService';

const WorkOrders = ({ onBack, prefill, clearPrefill }) => {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', equipment_id: '', priority: 'medium', assignee: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadOrders(); }, []);

  useEffect(() => {
    if (prefill) {
      setForm(prev => ({ ...prev, equipment_id: prefill }));
      setShowModal(true);
      if (clearPrefill) clearPrefill();
    }
  }, [prefill, clearPrefill]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getWorkOrders();
      const items = res?.items || (Array.isArray(res) ? res : res?.work_orders || res?.data || []);
      setWorkOrders(items);
      setError(null);
    } catch (e) {
      setError('Failed to load work orders.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.equipment_id.trim()) return;
    setSubmitting(true);
    try {
      let numericId = null;
      const eqInput = form.equipment_id.trim();

      // If it looks like a number, check if it's already an integer database ID
      if (/^\d+$/.test(eqInput)) {
        numericId = parseInt(eqInput, 10);
      } else {
        // Look up by SOS Code
        try {
          const eqDetails = await ApiService.getEquipmentBySosCode(eqInput);
          if (eqDetails && eqDetails.id) {
            numericId = eqDetails.id;
          }
        } catch (lookupErr) {
          console.warn('Failed lookup by SOS Code, trying Admin Equipment lookup...', lookupErr);
          try {
            const adminEqDetails = await ApiService.getAdminEquipmentBySosCode(eqInput);
            if (adminEqDetails && adminEqDetails.id) {
              numericId = adminEqDetails.id;
            }
          } catch (adminLookupErr) {
            console.error('Admin equipment lookup failed too:', adminLookupErr);
          }
        }
      }

      if (!numericId) {
        throw new Error(`Equipment with SOS Code/Reference "${eqInput}" could not be found. Please check the code and try again.`);
      }

      const payload = {
        ...form,
        equipment_id: numericId
      };

      await ApiService.createWorkOrder(payload);
      alert('Work Order created successfully!');
      setShowModal(false);
      setForm({ title: '', description: '', equipment_id: '', priority: 'medium', assignee: '' });
      loadOrders();
    } catch (e) {
      alert('Failed to create work order: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await ApiService.updateWorkOrder(id, { status });
      setWorkOrders(prev => prev.map(wo => wo.id === id ? { ...wo, status } : wo));
    } catch (e) {
      alert('Failed to update status: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this work order?')) return;
    try {
      await ApiService.deleteWorkOrder(id);
      setWorkOrders(prev => prev.filter(wo => wo.id !== id));
    } catch (e) {
      alert('Failed to delete work order: ' + e.message);
    }
  };

  const priorityClass = (p) => {
    switch (p?.toLowerCase()) {
      case 'high': return 'p-high';
      case 'medium': return 'p-medium';
      case 'low': return 'p-low';
      default: return '';
    }
  };

  const statusClass = (s) => {
    switch (s?.toLowerCase()) {
      case 'open': return 's-open';
      case 'in progress': return 's-progress';
      case 'completed': return 's-completed';
      default: return '';
    }
  };

  return (
    <div className="ea-page">
      <div className="setup-header">
        <button className="setup-back-btn" onClick={onBack} title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="setup-header-info" style={{ flex: 1 }}>
          <div className="setup-header-icon">🛠️</div>
          <div>
            <div className="setup-title">Work Orders</div>
            <div className="setup-subtitle">Maintenance Management — Track and resolve system deficiencies</div>
          </div>
        </div>
        <button className="ea-add-nav-btn" onClick={() => setShowModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Work Order
        </button>
      </div>

      <div className="wo-stats-bar">
        <div className="wo-stat-card">
          <span className="wo-stat-val">{workOrders.filter(w => w.status === 'open').length}</span>
          <span className="wo-stat-label">Open Tasks</span>
        </div>
        <div className="wo-stat-card">
          <span className="wo-stat-val">{workOrders.filter(w => w.status === 'in progress').length}</span>
          <span className="wo-stat-label">In Progress</span>
        </div>
        <div className="wo-stat-card">
          <span className="wo-stat-val">{workOrders.filter(w => w.status === 'completed').length}</span>
          <span className="wo-stat-label">Completed</span>
        </div>
      </div>

      <div className="ea-body">
        {loading ? (
          <div className="ea-list-loading">
            <div className="ea-spinner" />
            <span>Fetching maintenance schedule...</span>
          </div>
        ) : error ? (
          <div className="ea-error-bar">⚠️ {error}</div>
        ) : (
          <div className="wo-table-wrap">
            <table className="wo-table">
              <thead>
                <tr>
                  <th>Task &amp; Description</th>
                  <th>Equipment ID</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="wo-empty">No active work orders.</td>
                  </tr>
                ) : workOrders.map(wo => (
                  <tr key={wo.id}>
                    <td>
                      <div className="wo-task-title">{wo.title}</div>
                      <div className="wo-task-desc">{wo.description}</div>
                    </td>
                    <td><code className="wo-code">{wo.equipment_id}</code></td>
                    <td><span className={`wo-badge ${priorityClass(wo.priority)}`}>{wo.priority?.toUpperCase()}</span></td>
                    <td>{wo.assignee || 'Unassigned'}</td>
                    <td><span className={`wo-badge ${statusClass(wo.status || 'open')}`}>{(wo.status || 'open').toUpperCase()}</span></td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select
                        className="wo-action-select"
                        value={wo.status || 'open'}
                        onChange={e => handleStatusChange(wo.id, e.target.value)}
                        style={{ flex: 1 }}
                      >
                        <option value="open">Set Open</option>
                        <option value="in progress">Set Progress</option>
                        <option value="completed">Complete</option>
                      </select>
                      <button
                        className="wo-delete-btn"
                        onClick={() => handleDelete(wo.id)}
                        title="Delete Work Order"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc3545',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px',
                          borderRadius: '4px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(220, 53, 69, 0.15)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="cm-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="cm-modal-card" onClick={e => e.stopPropagation()}>
            <div className="cm-modal-header">
              <span className="cm-modal-icon">🛠️</span>
              <span className="cm-modal-title">New Work Order</span>
            </div>
            <div className="cm-modal-body">
              <div className="cm-field">
                <label className="cm-label">Task Title</label>
                <input className="cm-input" type="text" placeholder="e.g. Recharge Fire Extinguisher"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="cm-field">
                <label className="cm-label">Equipment ID / Reference</label>
                <input className="cm-input" type="text" placeholder="e.g. FE-001"
                  value={form.equipment_id} onChange={e => setForm({ ...form, equipment_id: e.target.value })} />
              </div>
              <div className="cm-field">
                <label className="cm-label">Description</label>
                <textarea className="cm-input" rows="3" placeholder="Describe the maintenance required..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="cm-row">
                <div className="cm-field">
                  <label className="cm-label">Priority</label>
                  <select className="cm-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="cm-field">
                  <label className="cm-label">Assign To</label>
                  <input className="cm-input" type="text" placeholder="Technician Name"
                    value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="cm-modal-actions">
              <button className="cm-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="cm-save-btn" onClick={handleCreate} disabled={submitting || !form.title.trim()}>
                {submitting ? 'Creating...' : 'Create Work Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrders;
