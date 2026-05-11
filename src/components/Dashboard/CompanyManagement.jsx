import { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/apiService';
import './CompanyManagement.css';

const API_BASE = 'https://ehs.garrev.com';
const resolveLogoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

const CompanyManagement = ({ onBack }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const [addForm, setAddForm] = useState({ name: '', companyId: '', logo: null, logoPreview: null, email: '', address: '', phone: '' });
  const [editForm, setEditForm] = useState({ name: '', companyId: '', logo: null, logoPreview: null, email: '', address: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const addFileRef = useRef();
  const editFileRef = useRef();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getAdminCompanies();
      setCompanies(Array.isArray(data) ? data : (data?.companies || data?.data || []));
      setError(null);
    } catch (err) {
      setError('Failed to load companies. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e, isEdit) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (isEdit) {
        setEditForm((f) => ({ ...f, logo: file, logoPreview: ev.target.result }));
      } else {
        setAddForm((f) => ({ ...f, logo: file, logoPreview: ev.target.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const openAdd = () => {
    setAddForm({ name: '', companyId: '', logo: null, logoPreview: null, email: '', address: '', phone: '' });
    setShowAddModal(true);
  };

  const closeAdd = () => {
    setShowAddModal(false);
    setAddForm({ name: '', companyId: '', logo: null, logoPreview: null, email: '', address: '', phone: '' });
  };

  const saveAdd = async () => {
    if (!addForm.name.trim()) return;
    const requestedRef = addForm.companyId.trim();
    const requestedName = addForm.name.trim();

    if (!requestedRef) {
      alert('Please enter a unique Company ID.');
      return;
    }

    setSaving(true);
    try {
      // Fetch fresh list to avoid stale duplicate checks
      const freshData = await ApiService.getAdminCompanies();
      const allCompanies = Array.isArray(freshData) ? freshData : (freshData?.companies || freshData?.data || []);

      const duplicateId = allCompanies.find((company) => {
        const id = String(company.company_ref || company.company_id || company.companyId || '').trim().toLowerCase();
        return id === requestedRef.toLowerCase();
      });

      if (duplicateId) {
        alert(`Company ID "${requestedRef}" is already registered to "${duplicateId.name}". Please use a unique ID.`);
        setSaving(false);
        return;
      }

      const duplicateName = allCompanies.find((company) => {
        const name = String(company.name || '').trim().toLowerCase();
        return name === requestedName.toLowerCase();
      });

      if (duplicateName) {
        alert(`A company named "${requestedName}" is already registered. Please use a unique name.`);
        setSaving(false);
        return;
      }

      const company = await ApiService.createAdminCompany({
        name: requestedName,
        company_ref: requestedRef,
        email: addForm.email.trim(),
        address: addForm.address.trim(),
        phone: addForm.phone.trim()
      });

      const companyId = company?.data?.id || company?.id;
      if (addForm.logo && companyId) {
        const formData = new FormData();
        formData.append('logo', addForm.logo);
        await ApiService.uploadCompanyLogo(companyId, formData);
      }

      await fetchCompanies();
      closeAdd();
    } catch (err) {
      const msg = err.message || '';
      const isGeneric500 = msg === 'HTTP error! status: 500' || msg === `HTTP error! status: 500`;
      if (isGeneric500) {
        alert('Server Error (500): The server failed to save this company. The Company ID or Name may already be taken. Please try a different ID or name.');
      } else {
        alert(msg || 'Failed to create company.');
      }
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (company) => {
    setEditTarget(company);
    setEditForm({
      name: company.name,
      companyId: company.company_ref || '',
      logo: null,
      logoPreview: resolveLogoUrl(company.logo),
      email: company.email || '',
      address: company.address || '',
      phone: company.phone || ''
    });
    setShowEditModal(true);
  };

  const closeEdit = () => {
    setShowEditModal(false);
    setEditTarget(null);
    setEditForm({ name: '', companyId: '', logo: null, logoPreview: null, email: '', address: '', phone: '' });
  };

  const saveEdit = async () => {
    if (!editForm.name.trim() || !editTarget) return;
    const requestedRef = editForm.companyId.trim();
    const requestedName = editForm.name.trim();

    const originalRef = String(editTarget.company_ref || editTarget.company_id || editTarget.companyId || '').trim();
    const originalName = String(editTarget.name || '').trim();
    const refChanged = requestedRef !== originalRef;
    const nameChanged = requestedName !== originalName;

    const otherCompanies = companies.filter(c => c.id !== editTarget.id);

    if (refChanged) {
      const duplicateId = otherCompanies.find((company) => {
        const id = String(company.company_ref || company.company_id || company.companyId || '').trim().toLowerCase();
        return id === requestedRef.toLowerCase();
      });
      if (duplicateId) {
        alert(`Company ID "${requestedRef}" is already used by "${duplicateId.name}".`);
        return;
      }
    }

    if (nameChanged) {
      const duplicateName = otherCompanies.find((company) => {
        const name = String(company.name || '').trim().toLowerCase();
        return name === requestedName.toLowerCase();
      });
      if (duplicateName) {
        alert(`A company named "${requestedName}" already exists.`);
        return;
      }
    }

    setSaving(true);
    try {
      // Only include name/company_ref in payload if they changed, to avoid
      // server-side uniqueness check false positives on the same record.
      const payload = {
        email: editForm.email.trim(),
        address: editForm.address.trim(),
        phone: editForm.phone.trim()
      };
      if (nameChanged) payload.name = requestedName;
      if (refChanged) payload.company_ref = requestedRef;

      await ApiService.updateAdminCompany(editTarget.id, payload);

      if (editForm.logo) {
        const formData = new FormData();
        formData.append('logo', editForm.logo);
        await ApiService.uploadCompanyLogo(editTarget.id, formData);
      }

      await fetchCompanies();
      closeEdit();
    } catch (err) {
      const msg = err.message || '';
      const isGeneric500 = msg === 'HTTP error! status: 500';
      if (isGeneric500) {
        alert('Server Error (500): Failed to update company. The Company ID or Name may conflict with an existing record.');
      } else {
        alert(msg || 'Failed to update company.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this company?')) return;
    try {
      await ApiService.deleteAdminCompany(id);
      await fetchCompanies();
    } catch (err) {
      alert(err.message || 'Failed to delete company.');
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
          <div className="setup-header-icon">🏢</div>
          <div>
            <div className="setup-title">Company Management</div>
            <div className="setup-subtitle">Enterprise Portal — Manage registered clients and safety partners</div>
          </div>
        </div>
        <button className="ea-add-nav-btn" onClick={openAdd}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Company
        </button>
      </div>

      <div className="ea-body">
        <div className="ea-integrated-list">
          {loading ? (
            <div className="ea-list-loading">
              <div className="ea-spinner" />
              <span>Synchronizing company data...</span>
            </div>
          ) : error ? (
            <div className="ea-error-bar">
              ⚠️ {error}
              <button onClick={fetchCompanies} className="ea-retry-btn">Retry</button>
            </div>
          ) : (
            <div className="ea-table-wrap">
              <table className="ea-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px', textAlign: 'center' }}>S.No</th>
                    <th>Company Details</th>
                    <th>Contact Info</th>
                    <th>Address</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="ea-empty">No companies found. Click "Add Company" to get started.</td>
                    </tr>
                  ) : (
                    companies
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((company, idx) => (
                        <tr key={company.id} className="cm-tr">
                          <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </td>
                          <td>
                            <div className="cm-company-cell">
                              <div className="cm-logo-thumb">
                                {resolveLogoUrl(company.logo) ? (
                                  <img src={resolveLogoUrl(company.logo)} alt={company.name} />
                                ) : (
                                  <span className="cm-logo-placeholder">🏢</span>
                                )}
                              </div>
                              <div className="cm-info-cell">
                                <div className="ea-user-name">{company.name}</div>
                                <div className="cm-company-sub">
                                  {(company.company_ref || company.company_id || company.companyId) && (
                                    <span className="cm-id-badge">{company.company_ref || company.company_id || company.companyId}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="cm-email-text">{company.email || 'N/A'}</div>
                            <div className="cm-phone-text" style={{ fontSize: '11.5px', color: '#64748b' }}>{company.phone || 'No phone'}</div>
                          </td>
                          <td className="ea-date-cell" style={{ maxWidth: '200px', whiteSpace: 'normal' }}>
                            {company.address || '—'}
                          </td>
                          <td>
                            <div className="ea-actions">
                              <button className="cm-action-btn cm-edit-btn" title="Edit" onClick={() => openEdit(company)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button className="ea-action-btn delete" title="Delete" onClick={() => handleDelete(company.id)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
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
                <tfoot>
                  <tr>
                    <td colSpan={5}>
                      {companies.length > itemsPerPage && (
                        <div className="ea-pagination">
                          <button
                            className="ea-pg-btn"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            ← Previous
                          </button>
                          <span className="ea-pg-info">
                            Page <strong>{currentPage}</strong> of {Math.ceil(companies.length / itemsPerPage)}
                          </span>
                          <button
                            className="ea-pg-btn"
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(companies.length / itemsPerPage), p + 1))}
                            disabled={currentPage === Math.ceil(companies.length / itemsPerPage)}
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
          )}
        </div>
      </div>

      {/* ADD COMPANY MODAL */}
      {showAddModal && (
        <div className="cm-modal-overlay" onClick={closeAdd}>
          <div className="cm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <span className="cm-modal-icon">🏢</span>
              <span className="cm-modal-title">Add Company</span>
            </div>
            <div className="cm-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="cm-field">
                <label className="cm-label">Company Name <span className="cm-required">*</span></label>
                <input
                  className="cm-input"
                  type="text"
                  placeholder="e.g. Continental Hospitals"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Company ID <span className="cm-required">*</span></label>
                <input
                  className="cm-input"
                  type="text"
                  placeholder="e.g. CH-2024-001"
                  value={addForm.companyId}
                  onChange={(e) => setAddForm((f) => ({ ...f, companyId: e.target.value }))}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Company Gmail</label>
                <input
                  className="cm-input"
                  type="email"
                  placeholder="e.g. contact@company.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Company Address</label>
                <textarea
                  className="cm-input cm-textarea"
                  placeholder="Street, City, State, ZIP"
                  value={addForm.address}
                  onChange={(e) => setAddForm((f) => ({ ...f, address: e.target.value }))}
                  style={{ minHeight: '60px', resize: 'vertical' }}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Contact Number</label>
                <input
                  className="cm-input"
                  type="tel"
                  placeholder="+1 234 567"
                  value={addForm.phone}
                  onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Company Logo</label>
                <div className="cm-logo-upload" onClick={() => addFileRef.current.click()}>
                  {addForm.logoPreview ? (
                    <img src={addForm.logoPreview} alt="Preview" className="cm-logo-preview-img" />
                  ) : (
                    <div className="cm-logo-upload-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span>Click to upload logo</span>
                    </div>
                  )}
                </div>
                <input
                  ref={addFileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleLogoChange(e, false)}
                />
              </div>
            </div>
            <div className="cm-modal-actions">
              <button className="cm-cancel-btn" onClick={closeAdd}>Cancel</button>
              <button className="cm-save-btn" onClick={saveAdd} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT COMPANY MODAL */}
      {showEditModal && (
        <div className="cm-modal-overlay" onClick={closeEdit}>
          <div className="cm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <span className="cm-modal-icon">✏️</span>
              <span className="cm-modal-title">Edit Company</span>
            </div>
            <div className="cm-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="cm-field">
                <label className="cm-label">Company Name <span className="cm-required">*</span></label>
                <input
                  className="cm-input"
                  type="text"
                  placeholder="e.g. Continental Hospitals"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Company ID <span className="cm-required">*</span></label>
                <input
                  className="cm-input"
                  type="text"
                  placeholder="e.g. CH-2024-001"
                  value={editForm.companyId}
                  onChange={(e) => setEditForm((f) => ({ ...f, companyId: e.target.value }))}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Company Gmail</label>
                <input
                  className="cm-input"
                  type="email"
                  placeholder="e.g. contact@company.com"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Company Address</label>
                <textarea
                  className="cm-input cm-textarea"
                  placeholder="Street, City, State, ZIP"
                  value={editForm.address}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                  style={{ minHeight: '60px', resize: 'vertical' }}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Contact Number</label>
                <input
                  className="cm-input"
                  type="tel"
                  placeholder="+1 234 567"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Company Logo</label>
                <div className="cm-logo-upload" onClick={() => editFileRef.current.click()}>
                  {editForm.logoPreview ? (
                    <img src={editForm.logoPreview} alt="Preview" className="cm-logo-preview-img" />
                  ) : (
                    <div className="cm-logo-upload-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span>Click to upload logo</span>
                    </div>
                  )}
                </div>
                <input
                  ref={editFileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleLogoChange(e, true)}
                />
              </div>
            </div>
            <div className="cm-modal-actions">
              <button className="cm-cancel-btn" onClick={closeEdit}>Cancel</button>
              <button className="cm-save-btn" onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManagement;
