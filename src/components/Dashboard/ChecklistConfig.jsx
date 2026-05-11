import { useState, useEffect } from 'react';
import './ChecklistConfig.css';
import { ApiService } from '../../services/apiService';

const CATEGORIES = [
  'Identification',
  'Accessibility',
  'Physical Condition',
  'Documentation',
  'Compliance',
  'Service',
  'Sign-off'
];

const EMPTY_FORM = { question: '', category: 'Identification', is_critical: false };

export default function ChecklistConfig({ onBack }) {
  const [checklistTypes, setChecklistTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typesLoading, setTypesLoading] = useState(true);
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load available checklist types on mount
  useEffect(() => {
    setTypesLoading(true);
    ApiService.getAdminChecklists()
      .then(res => {
        const types = Array.isArray(res) ? res : (res?.data || res?.types || res?.checklists || []);
        setChecklistTypes(types);
        if (types.length > 0) {
          const first = types[0]?.type || types[0]?.code || types[0]?.slug || types[0];
          setSelectedType(typeof first === 'string' ? first : String(first));
        }
      })
      .catch(() => setChecklistTypes([]))
      .finally(() => setTypesLoading(false));
  }, []);

  // Load questions when selected type changes
  useEffect(() => {
    if (!selectedType) return;
    setLoading(true);
    setError('');
    ApiService.getAdminChecklistsByType(selectedType)
      .then(res => {
        const items = Array.isArray(res) ? res : (res?.items || res?.data || []);
        setQuestions(items);
      })
      .catch(() => {
        setQuestions([]);
        setError('Failed to load checklist items.');
      })
      .finally(() => setLoading(false));
  }, [selectedType]);

  const handleSave = async () => {
    if (!formData.question?.trim()) return alert('Question text is required');
    setSaving(true);
    try {
      if (editingId) {
        const res = await ApiService.updateAdminChecklistItem(editingId, formData);
        const updated = res?.data || res;
        setQuestions(questions.map(q => q.id === editingId ? { ...q, ...updated } : q));
      } else {
        const res = await ApiService.createAdminChecklistItem(selectedType, formData);
        const created = res?.data || res;
        setQuestions([...questions, created]);
      }
      goBackToList();
    } catch {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await ApiService.deleteAdminChecklistItem(id);
      setQuestions(questions.filter(q => q.id !== id));
    } catch {
      alert('Failed to delete. Please try again.');
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setView('form');
  };

  const openEdit = (q) => {
    setEditingId(q.id);
    setFormData({
      question: q.question || q.text || '',
      category: q.category || 'Identification',
      is_critical: q.is_critical || q.critical || false,
    });
    setView('form');
  };

  const goBackToList = () => {
    setView('list');
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const typeLabel = (t) => {
    if (typeof t === 'string') return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return t?.label || t?.name || t?.type || String(t);
  };

  const typeValue = (t) =>
    typeof t === 'string' ? t : (t?.type || t?.code || t?.slug || String(t));

  return (
    <div className="cfg-page">
      <div className="cfg-header">
        <button className="cfg-back-btn" onClick={view === 'list' ? onBack : goBackToList}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="cfg-header-info">
          <div className="cfg-title-row">
            <span className="cfg-icon">⚙️</span>
            <div className="cfg-title">{view === 'list' ? 'Checklist Configurator' : (editingId ? 'Edit Question' : 'Add New Question')}</div>
          </div>
          <div className="cfg-subtitle">
            {view === 'list'
              ? 'Superadmin Portal — Manage master checklist questions and response types'
              : 'Define the question text, category, and criticality for the field inspection'}
          </div>
        </div>
        {view === 'list' && (
          <button className="cfg-add-btn" onClick={openAdd} disabled={!selectedType}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Question
          </button>
        )}
      </div>

      {/* Module type selector */}
      {view === 'list' && (
        <div className="cfg-type-bar">
          <label className="cfg-type-label">Module Checklist:</label>
          {typesLoading ? (
            <span className="cfg-type-loading">Loading modules...</span>
          ) : checklistTypes.length === 0 ? (
            <span className="cfg-type-loading">No checklist types available</span>
          ) : (
            <select
              className="cfg-type-select"
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
            >
              {checklistTypes.map(t => (
                <option key={typeValue(t)} value={typeValue(t)}>
                  {typeLabel(t)}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="cfg-body">
        {view === 'list' ? (
          <div className="cfg-list-card">
            {error && <div className="cfg-error-msg">{error}</div>}
            <div className="cfg-table-wrap">
              <table className="cfg-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px', textAlign: 'center' }}>S.No</th>
                    <th>Question Text</th>
                    <th>Category</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Critical</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        Loading...
                      </td>
                    </tr>
                  ) : questions.length > 0 ? questions.map((q, idx) => (
                    <tr key={q.id}>
                      <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>{idx + 1}</td>
                      <td className="cfg-q-text">{q.question || q.text}</td>
                      <td><span className="cfg-cat-badge">{q.category || '—'}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`cfg-crit-tag ${(q.is_critical || q.critical) ? 'yes' : 'no'}`}>
                          {(q.is_critical || q.critical) ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td>
                        <div className="cfg-actions">
                          <button className="cfg-action-btn edit" onClick={() => openEdit(q)} title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button className="cfg-action-btn delete" onClick={() => handleDelete(q.id)} title="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        No questions registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="5">
                      <div className="cfg-pagination">
                        <span className="cfg-pg-info">Total <strong>{questions.length}</strong> questions</span>
                        <div className="cfg-pg-controls">
                          <button className="cfg-pg-btn" disabled>← Previous</button>
                          <button className="cfg-pg-btn" disabled>Next →</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="cfg-form-page">
            <div className="cfg-form-card">
              <div className="cfg-card-title">{editingId ? 'Edit Master Question' : 'Register New Question'}</div>
              <div className="cfg-form-grid">
                <div className="cfg-field">
                  <label>Question Text</label>
                  <textarea
                    className="cfg-input"
                    value={formData.question}
                    onChange={e => setFormData({ ...formData, question: e.target.value })}
                    placeholder="e.g. Is the tamper seal intact?"
                  />
                </div>
                <div className="cfg-field">
                  <label>Category</label>
                  <select
                    className="cfg-input"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="cfg-field check">
                  <input
                    type="checkbox"
                    id="crit"
                    checked={formData.is_critical}
                    onChange={e => setFormData({ ...formData, is_critical: e.target.checked })}
                  />
                  <label htmlFor="crit">Mark as Critical (Failure triggers alert)</label>
                </div>
                <div className="cfg-info-box">
                  <strong>Standardized Response:</strong> All field questions use the (Yes / No / NA) response set.
                </div>
              </div>
              <div className="cfg-form-actions">
                <button className="cfg-cancel-btn" onClick={goBackToList} disabled={saving}>Cancel</button>
                <button className="cfg-save-btn" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : (editingId ? 'Update Question' : 'Save Question')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
