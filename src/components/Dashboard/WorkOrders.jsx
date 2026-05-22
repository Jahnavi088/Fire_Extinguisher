import React, { useState, useEffect } from 'react';
import './WorkOrders.css';
import { ApiService } from '../../services/apiService';

const WorkOrders = ({ onBack, prefill, clearPrefill }) => {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
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

  const openCreate = () => {
    setEditOrder(null);
    setForm({ title: '', description: '', equipment_id: '', priority: 'medium', assignee: '' });
    setShowModal(true);
  };

  const openEdit = (wo) => {
    setEditOrder(wo);
    setForm({
      title: wo.title || '',
      description: wo.description || '',
      equipment_id: String(wo.equipment_id || ''),
      priority: wo.priority || 'medium',
      assignee: wo.assignee || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.equipment_id.trim()) return;
    setSubmitting(true);
    try {
      if (editOrder) {
        await ApiService.updateWorkOrder(editOrder.id, {
          title: form.title,
          description: form.description,
          priority: form.priority,
          assignee: form.assignee,
        });
        setWorkOrders(prev => prev.map(wo => wo.id === editOrder.id ? { ...wo, ...form } : wo));
      } else {
        let numericId = null;
        const eqInput = form.equipment_id.trim();

        if (/^\d+$/.test(eqInput)) {
          numericId = parseInt(eqInput, 10);
        } else {
          try {
            const eqDetails = await ApiService.getEquipmentBySosCode(eqInput);
            if (eqDetails && eqDetails.id) numericId = eqDetails.id;
          } catch (lookupErr) {
            console.warn('Failed lookup by SOS Code, trying Admin Equipment lookup...', lookupErr);
            try {
              const adminEqDetails = await ApiService.getAdminEquipmentBySosCode(eqInput);
              if (adminEqDetails && adminEqDetails.id) numericId = adminEqDetails.id;
            } catch (adminLookupErr) {
              console.error('Admin equipment lookup failed too:', adminLookupErr);
            }
          }
        }

        if (!numericId) {
          throw new Error(`Equipment with SOS Code/Reference "${eqInput}" could not be found. Please check the code and try again.`);
        }

        await ApiService.createWorkOrder({ ...form, equipment_id: numericId });
        loadOrders();
      }

      setShowModal(false);
      setEditOrder(null);
      setForm({ title: '', description: '', equipment_id: '', priority: 'medium', assignee: '' });
    } catch (e) {
      alert((editOrder ? 'Failed to update' : 'Failed to create') + ' work order: ' + e.message);
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
        <button className="ea-add-nav-btn" onClick={openCreate}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Work Order
        </button>
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
          <div className="ea-table-wrap">
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
                    <td>
                      <div className="wo-actions">
                        <select
                          className="wo-action-select"
                          value={wo.status || 'open'}
                          onChange={e => handleStatusChange(wo.id, e.target.value)}
                        >
                          <option value="open">Set Open</option>
                          <option value="in progress">Set Progress</option>
                          <option value="completed">Complete</option>
                        </select>
                        <button className="um-action-btn edit" onClick={() => openEdit(wo)} title="Edit Work Order">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button className="um-action-btn delete" onClick={() => handleDelete(wo.id)} title="Delete Work Order">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" /><path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="cm-modal-overlay" onClick={() => { setShowModal(false); setEditOrder(null); }}>
          <div className="cm-modal-card" onClick={e => e.stopPropagation()}>
            <div className="cm-modal-header">
              <span className="cm-modal-icon">🛠️</span>
              <span className="cm-modal-title">{editOrder ? 'Edit Work Order' : 'New Work Order'}</span>
            </div>
            <div className="cm-modal-body">
              <div className="cm-field">
                <label className="cm-label">Task Title</label>
                <input className="cm-input" type="text" placeholder="e.g. Recharge Fire Extinguisher"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              {!editOrder && (
                <div className="cm-field">
                  <label className="cm-label">Equipment ID / Reference</label>
                  <input className="cm-input" type="text" placeholder="e.g. FE-001"
                    value={form.equipment_id} onChange={e => setForm({ ...form, equipment_id: e.target.value })} />
                </div>
              )}
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
              <button className="cm-cancel-btn" onClick={() => { setShowModal(false); setEditOrder(null); }}>Cancel</button>
              <button className="cm-save-btn" onClick={handleSave} disabled={submitting || !form.title.trim()}>
                {submitting ? (editOrder ? 'Saving...' : 'Creating...') : (editOrder ? 'Save Changes' : 'Create Work Order')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrders;
