import React, { useState, useRef } from 'react';
import './CompanyManagement.css';

const initialCompanies = [
  { id: 1, name: 'Garrev Industries Ltd.', logo: null, email: 'info@garrev.com', address: '123 Safety St, Industrial Zone', phone: '+1-555-0101' },
  { id: 2, name: 'SafeGuard Corp.', logo: null, email: 'contact@safeguard.net', address: '456 Security Ave, Business District', phone: '+1-555-0202' },
];

const CompanyManagement = ({ onBack }) => {
  const [companies, setCompanies] = useState(initialCompanies);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [addForm, setAddForm] = useState({ name: '', companyId: '', logo: null, logoPreview: null, email: '', address: '', phone: '' });
  const [editForm, setEditForm] = useState({ name: '', companyId: '', logo: null, logoPreview: null, email: '', address: '', phone: '' });
  const addFileRef = useRef();
  const editFileRef = useRef();

  const nextId = () => Math.max(0, ...companies.map((c) => c.id)) + 1;

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

  const saveAdd = () => {
    if (!addForm.name.trim()) return;
    setCompanies((prev) => [
      ...prev,
      { 
        id: nextId(), 
        companyId: addForm.companyId.trim(),
        name: addForm.name.trim(), 
        logo: addForm.logoPreview,
        email: addForm.email.trim(),
        address: addForm.address.trim(),
        phone: addForm.phone.trim()
      },
    ]);
    closeAdd();
  };

  const openEdit = (company) => {
    setEditTarget(company);
    setEditForm({ 
      name: company.name, 
      companyId: company.companyId || '',
      logo: null, 
      logoPreview: company.logo,
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

  const saveEdit = () => {
    if (!editForm.name.trim()) return;
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === editTarget.id
          ? { 
              ...c, 
              name: editForm.name.trim(), 
              companyId: editForm.companyId.trim(),
              logo: editForm.logoPreview,
              email: editForm.email.trim(),
              address: editForm.address.trim(),
              phone: editForm.phone.trim()
            }
          : c
      )
    );
    closeEdit();
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this company?')) return;
    setCompanies((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="cm-page">
      <div className="cm-header">
        <button className="cm-back-btn" onClick={onBack} title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="cm-header-info">
          <span className="cm-header-icon">🏢</span>
          <div>
            <div className="cm-title">Company Management</div>
            <div className="cm-subtitle">Manage registered companies on the platform</div>
          </div>
        </div>
        <button className="cm-add-btn" onClick={openAdd}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Company
        </button>
      </div>

      <div className="cm-body">
        <div className="cm-table-wrap">
          <table className="cm-table">
            <thead>
              <tr>
                <th className="cm-th cm-th-id">ID</th>
                <th className="cm-th">Company Details</th>
                <th className="cm-th">Email / Address</th>
                <th className="cm-th cm-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={3} className="cm-empty-row">No companies found. Click "Add Company" to get started.</td>
                </tr>
              ) : (
                companies
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((company) => (
                  <tr key={company.id} className="cm-tr">
                    <td className="cm-td cm-td-id">{company.id}</td>
                    <td className="cm-td">
                      <div className="cm-company-cell">
                        <div className="cm-logo-thumb">
                          {company.logo ? (
                            <img src={company.logo} alt={company.name} />
                          ) : (
                            <span className="cm-logo-placeholder">🏢</span>
                          )}
                        </div>
                        <div className="cm-info-cell">
                          <div className="cm-company-name">{company.name}</div>
                          <div className="cm-company-sub">
                            {company.companyId && <span className="cm-id-badge">{company.companyId}</span>}
                            {company.phone || 'No phone'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="cm-td">
                      <div className="cm-email-text">{company.email || 'N/A'}</div>
                      <div className="cm-address-text">{company.address || 'No address'}</div>
                    </td>
                    <td className="cm-td cm-td-actions">
                      <button className="cm-action-btn cm-edit-btn" title="Edit" onClick={() => openEdit(company)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className="cm-action-btn cm-delete-btn" title="Delete" onClick={() => handleDelete(company.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" /><path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {companies.length > itemsPerPage && (
          <div className="cm-pagination">
            <button 
              className="cm-pg-btn" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="cm-pg-info">
              Page {currentPage} of {Math.ceil(companies.length / itemsPerPage)}
            </span>
            <button 
              className="cm-pg-btn" 
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(companies.length / itemsPerPage), p + 1))}
              disabled={currentPage === Math.ceil(companies.length / itemsPerPage)}
            >
              Next
            </button>
          </div>
        )}
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
                  placeholder="e.g. Garrev Industries Ltd."
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
              <button className="cm-save-btn" onClick={saveAdd}>Save</button>
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
                  placeholder="e.g. Garrev Industries Ltd."
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
              <button className="cm-save-btn" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManagement;
