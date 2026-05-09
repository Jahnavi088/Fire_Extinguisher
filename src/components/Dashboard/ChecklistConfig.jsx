import { useState } from 'react';
import './ChecklistConfig.css';

const INITIAL_QUESTIONS = [
  { id: 1, text: 'Is the fire extinguisher assigned an ID?', category: 'Identification', critical: true },
  { id: 2, text: 'Is the pressure gauge in the green zone?', category: 'Physical Condition', critical: true },
  { id: 3, text: 'Is the safety pin in place?', category: 'Physical Condition', critical: true },
];

const CATEGORIES = [
  'Identification',
  'Accessibility',
  'Physical Condition',
  'Documentation',
  'Compliance',
  'Service',
  'Sign-off'
];

export default function ChecklistConfig({ onBack }) {
  const [questions, setQuestions] = useState(INITIAL_QUESTIONS);
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ text: '', category: 'Identification', critical: false });

  const handleSave = () => {
    if (!formData.text.trim()) return alert('Question text is required');
    
    if (editingId) {
      setQuestions(questions.map(q => q.id === editingId ? { ...q, ...formData } : q));
    } else {
      setQuestions([...questions, { id: Date.now(), ...formData }]);
    }
    goBackToList();
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({ text: '', category: 'Identification', critical: false });
    setView('form');
  };

  const openEdit = (q) => {
    setEditingId(q.id);
    setFormData({ text: q.text, category: q.category, critical: q.critical });
    setView('form');
  };

  const goBackToList = () => {
    setView('list');
    setEditingId(null);
    setFormData({ text: '', category: 'Identification', critical: false });
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this question?')) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

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
          <button className="cfg-add-btn" onClick={openAdd}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Question
          </button>
        )}
      </div>

      <div className="cfg-body">
        {view === 'list' ? (
          <div className="cfg-list-card">
            <div className="cfg-card-title">Master Checklist Questions ({questions.length})</div>
            <div className="cfg-table-wrap">
              <table className="cfg-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'center' }}>Critical</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map(q => (
                    <tr key={q.id}>
                      <td>{q.text}</td>
                      <td><span className="cfg-cat-badge">{q.category}</span></td>
                      <td style={{ textAlign: 'center' }}>{q.critical ? <span className="cfg-crit">YES</span> : <span className="cfg-no-crit">No</span>}</td>
                      <td className="cfg-actions">
                        <button className="cfg-action-btn cfg-edit-btn" onClick={() => openEdit(q)} title="Edit">✏️</button>
                        <button className="cfg-action-btn cfg-delete-btn" onClick={() => handleDelete(q.id)} title="Delete">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
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
                    value={formData.text} 
                    onChange={e => setFormData({...formData, text: e.target.value})}
                    placeholder="e.g. Is the tamper seal intact?"
                  />
                </div>
                <div className="cfg-field">
                  <label>Category</label>
                  <select 
                    className="cfg-input"
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="cfg-field check">
                  <input 
                    type="checkbox" 
                    id="crit" 
                    checked={formData.critical} 
                    onChange={e => setFormData({...formData, critical: e.target.checked})}
                  />
                  <label htmlFor="crit">Mark as Critical (Failure triggers alert)</label>
                </div>
                <div className="cfg-info-box">
                  <strong>Standardized Response:</strong> All field questions use the (Yes / No / NA) response set.
                </div>
              </div>
              <div className="cfg-form-actions">
                <button className="cfg-cancel-btn" onClick={goBackToList}>Cancel</button>
                <button className="cfg-save-btn" onClick={handleSave}>
                  {editingId ? 'Update Question' : 'Save Question'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
