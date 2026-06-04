import React, { useState, useMemo } from 'react';
import './Checklist.css';
import { ApiService } from '../../services/apiService';

const ProfessionalChecklist = ({ module, items, onBack, onComplete }) => {
  const [answers, setAnswers] = useState({});
  const [remarks, setRemarks] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = {};
    items.forEach(item => {
      const cat = item.category || 'General Inspection';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [items]);

  const handleAnswer = (itemId, val) => {
    setAnswers(prev => ({ ...prev, [itemId]: val }));
  };

  const handleRemark = (itemId, val) => {
    setRemarks(prev => ({ ...prev, [itemId]: val }));
  };

  const handleSubmit = async () => {
    const total = items.length;
    const answeredCount = Object.keys(answers).length;

    if (answeredCount < total) {
      if (!window.confirm(`You have only answered ${answeredCount} out of ${total} items. Submit anyway?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        inspector_name: ApiService.getUser()?.name || 'Inspector',
        inspector_id: ApiService.getUser()?.id,
        submitted_by_id: ApiService.getUser()?.id,
        user_id: ApiService.getUser()?.id,
        remarks: '[PENDING] Submitted via Professional Checklist',
        status: 'PENDING',
        approval_status: 'PENDING',
        answers: items.map(item => ({
          checklist_item_id: item.id,
          answer: answers[item.id] === 'True' ? 'true' : (answers[item.id] === 'False' ? 'false' : 'na'),
          remarks: remarks[item.id] || ''
        })),
        signature: {
          meaning: "I certify that this inspection was conducted accurately and completely.",
          device_id: 1
        }
      };

      const extPayload = {
        ...payload,
        module_id: module.module_id || module.id,
        equipment_name: module.name || 'Equipment'
      };
      try {
        await ApiService.createInspection(String(module.module_id || module.id), extPayload);
      } catch (apiErr) {
        console.warn('Backend submission failed, falling back to local queue:', apiErr);
        await ApiService.queueInspection(String(module.module_id || module.id), extPayload);
      }
      alert('Inspection submitted successfully!');
      if (onComplete) onComplete();
      onBack();
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Failed to submit inspection. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCritical = items.filter(i => i.is_critical).length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="cl-page">
      <div className="cl-header">
        <div className="cl-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="fe-back-btn" onClick={onBack} style={{ padding: '8px', minWidth: 'auto', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            </button>
            <div>
              <h2>{module.name} Inspection</h2>
              <p>Module: {module.code?.toUpperCase()} | Total Items: {items.length} | Critical: {totalCritical}</p>
            </div>
          </div>
        </div>
        <div className="cl-stats-bar">
          <div>Progress: {answeredCount} / {items.length}</div>
          <div style={{ color: answeredCount === items.length ? '#4ade80' : '#fbbf24' }}>
            {answeredCount === items.length ? '● Ready' : '○ Incomplete'}
          </div>
        </div>
      </div>

      <div className="cl-container">
        <table className="cl-table">
          <thead className="cl-table-head">
            <tr>
              <th className="cl-col-num">#</th>
              <th className="cl-col-q">Inspection Question / Checklist Item</th>
              <th className="cl-col-ans">Answer Type</th>
              <th className="cl-col-crit">Critical?</th>
              <th className="cl-col-notes">Inspector Notes (Field)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedItems).map(([category, catItems], groupIdx) => (
              <React.Fragment key={category}>
                <tr className="cl-category-row">
                  <td colSpan={5}>▸ {category}</td>
                </tr>
                {catItems.map((item, idx) => {
                  const itemIdx = items.indexOf(item) + 1;
                  return (
                    <tr key={item.id} className="cl-row">
                      <td className="cl-col-num">{itemIdx}</td>
                      <td className="cl-col-q">{item.question || item.item_text || item.checklist_name || item.name}</td>
                      <td className="cl-col-ans">
                        <div className="cl-ans-pill-group">
                          <div 
                            className={`cl-ans-pill ${answers[item.id] === 'True' ? 'active true' : ''}`}
                            onClick={() => handleAnswer(item.id, 'True')}
                          >True</div>
                          <div 
                            className={`cl-ans-pill ${answers[item.id] === 'False' ? 'active false' : ''}`}
                            onClick={() => handleAnswer(item.id, 'False')}
                          >False</div>
                          <div 
                            className={`cl-ans-pill ${answers[item.id] === 'NA' ? 'active na' : ''}`}
                            onClick={() => handleAnswer(item.id, 'NA')}
                          >N/A</div>
                        </div>
                      </td>
                      <td className="cl-col-crit">
                        {item.is_critical ? (
                          <span className="cl-crit-badge">YES ⚠</span>
                        ) : (
                          <span className="cl-crit-badge no">No</span>
                        )}
                      </td>
                      <td className="cl-col-notes">
                        <input 
                          type="text" 
                          className="cl-notes-input" 
                          placeholder="Add remark..."
                          value={remarks[item.id] || ''}
                          onChange={(e) => handleRemark(item.id, e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cl-footer">
        <button className="cl-submit-btn" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Inspection'}
          {!submitting && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
        </button>
      </div>
    </div>
  );
};

export default ProfessionalChecklist;
