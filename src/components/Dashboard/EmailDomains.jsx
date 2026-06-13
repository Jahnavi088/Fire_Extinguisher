import React, { useState, useEffect, useMemo } from 'react';
import { ApiService } from '../../services/apiService';
import './UserManagement.css'; // Reuse User Management dashboard styles

const PAGE_SIZE = 10;

const EmailDomains = ({ onBack }) => {
  const [domains, setDomains] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [newDomain, setNewDomain] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [domsRes, compsRes] = await Promise.all([
        ApiService.getAdminEmailDomains(),
        ApiService.getAdminCompanies().catch(() => [])
      ]);
      const domsList = Array.isArray(domsRes) ? domsRes : (domsRes?.data || domsRes?.domains || domsRes?.items || []);
      const compsList = Array.isArray(compsRes) ? compsRes : (compsRes?.companies || compsRes?.data || []);
      setDomains(domsList);
      setCompanies(compsList);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load email domains.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDomainsOnly = async () => {
    try {
      const res = await ApiService.getAdminEmailDomains();
      const list = Array.isArray(res) ? res : (res?.data || res?.domains || res?.items || []);
      setDomains(list);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDomains = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return domains;
    return domains.filter(d => (d.domain || '').toLowerCase().includes(q));
  }, [domains, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredDomains.length / PAGE_SIZE));
  const pagedDomains = filteredDomains.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => {
    setEditTarget(null);
    setNewDomain('');
    setSelectedCompanyId('');
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (dom) => {
    setEditTarget(dom);
    setNewDomain(dom.domain || '');
    setSelectedCompanyId(dom.company_id || dom.companyId || '');
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    const domainName = newDomain.trim();
    if (!domainName) {
      setFormError('Domain name is required.');
      return;
    }

    const exists = domains.some(d =>
      d.domain.toLowerCase() === domainName.toLowerCase() &&
      (!editTarget || d.id !== editTarget.id)
    );
    if (exists) {
      setFormError('This domain already exists.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      if (editTarget) {
        await ApiService.updateAdminEmailDomain(editTarget.id, domainName, selectedCompanyId);
        showToast('Domain updated successfully.');
      } else {
        await ApiService.createAdminEmailDomain(domainName, selectedCompanyId);
        showToast('Domain created successfully.');
      }
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setFormError(err.message || 'Failed to save domain.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (dom) => {
    setDeleteConfirm(dom);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      await ApiService.deleteAdminEmailDomain(deleteConfirm.id);
      await fetchData();
      showToast('Domain deleted successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to delete domain.', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="setup-page">
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
      {/* Header */}
      <div className="setup-header">
        <button className="setup-back-btn" onClick={onBack} title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="setup-header-info" style={{ flex: 1 }}>
          <div>
            <div className="setup-title">Email Domains</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="um-content-wrap" style={{ maxWidth: '800px', margin: '0', width: '100%' }}>
        {loading ? (
          <div className="um-state-block"><div className="um-spinner" /><span>Loading domains...</span></div>
        ) : error ? (
          <div className="um-state-block um-error-block">
            <span>⚠️ {error}</span>
            <button className="um-retry-btn" onClick={fetchData}>Retry</button>
          </div>
        ) : (
          <>
            <table className="um-table">
              <thead>
                <tr>
                  <th colSpan="3" style={{ background: '#f8f9fa', border: 'none' }}></th>
                  <th colSpan="1" style={{ background: '#f8f9fa', textAlign: 'right', border: 'none' }}>
                    <button className="um-add-btn" onClick={openAdd} style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-block', margin: 0 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px', marginRight: '4px', verticalAlign: 'middle' }}>
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      <span style={{ verticalAlign: 'middle' }}>Add Domain</span>
                    </button>
                  </th>
                </tr>
                <tr>
                  <th className="um-th-num" style={{ width: '80px' }}>S.NO</th>
                  <th>Domain Name</th>
                  <th>Company Name</th>
                  <th className="um-th-actions" style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDomains.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      <span style={{ fontSize: '36px', display: 'block', marginBottom: '12px' }}>🌐</span>
                      {search ? 'No domains match your search.' : 'No domains found. Click "Add Domain" to get started.'}
                    </td>
                  </tr>
                ) : (
                  pagedDomains.map((dom, idx) => (
                    <tr key={dom.id || idx}>
                      <td className="um-td-num">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td>
                        <span className="um-name" style={{ fontWeight: '500', color: '#000000' }}>{dom.domain}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: '#000', fontWeight: '500' }}>
                          {dom.company_name || dom.companyName || companies.find(c => String(c.id || c.company_id) === String(dom.company_id || dom.companyId))?.name || '—'}
                        </span>
                      </td>
                      <td>
                        <div className="um-actions" style={{ justifyContent: 'center' }}>
                          <button className="um-action-btn edit" onClick={() => openEdit(dom)} title="Edit domain" style={{ marginRight: '6px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button className="um-action-btn delete" onClick={() => confirmDelete(dom)} title="Delete domain">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" /><path d="M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="um-pagination">
                <button className="um-pg-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
                <button className="um-pg-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                <span className="um-pg-info">Page {page} of {totalPages}</span>
                <button className="um-pg-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
                <button className="um-pg-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="um-overlay" onClick={() => setShowForm(false)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <div className="um-modal-head">
              <div className="um-modal-title">
                <span style={{ fontSize: 20, marginRight: '8px' }}>🌐</span> {editTarget ? 'Edit Email Domain' : 'Add New Domain'}
              </div>
              <button className="um-modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="um-modal-body">
              {formError && <div className="um-form-error">⚠️ {formError}</div>}
              <div className="um-form-grid" style={{ display: 'block' }}>
                <div className="um-form-field">
                  <label>Email Domain Name <span className="um-req">*</span></label>
                  <input
                    value={newDomain}
                    onChange={e => setNewDomain(e.target.value)}
                    placeholder="e.g. company.com"
                    autoFocus
                  />
                </div>
                <div className="um-form-field" style={{ marginTop: '14px' }}>
                  <label>Company Name</label>
                  <select
                    value={selectedCompanyId}
                    onChange={e => setSelectedCompanyId(e.target.value)}
                  >
                    <option value="" style={{ background: '#1e293b' }}>— Select Company —</option>
                    {companies.map(c => (
                      <option key={c.id || c.company_id} value={c.id || c.company_id} style={{ background: '#1e293b' }}>{c.name || c.company_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="um-modal-foot">
              <button className="um-btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="um-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? <><div className="um-btn-spinner" /> Saving...</> : (editTarget ? 'Save Changes' : 'Add Domain')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="um-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="um-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="um-modal-head">
              <div className="um-modal-title">
                <span style={{ fontSize: 20, marginRight: '8px' }}>⚠️</span> Confirm Deletion
              </div>
              <button className="um-modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div className="um-modal-body">
              <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px', lineHeight: '1.5' }}>
                Are you sure you want to delete the domain <strong>"{deleteConfirm.domain}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="um-modal-foot">
              <button className="um-btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="um-btn-save" style={{ background: '#ef4444', color: '#fff' }} onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailDomains;
