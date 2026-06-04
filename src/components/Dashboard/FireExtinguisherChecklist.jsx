import React, { useState, useMemo, useEffect } from 'react';
import './FireExtinguisherChecklist.css';
import { ApiService } from '../../services/apiService';

const CATEGORY_ICONS = {
  'Identification':    '🔖',
  'Accessibility':     '🚪',
  'Physical Condition':'🔍',
  'Documentation':     '📄',
  'Compliance':        '✅',
  'Service':           '🔧',
  'Sign-off':          '✍️',
  'General':           '📋'
};

const ANSWER_OPTIONS = ['Yes', 'No', 'N/A'];

export default function FireExtinguisherChecklist({ selectedEq, equipmentType, displayName, onBack }) {
  const [checklistData, setChecklistData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [remarks, setRemarks] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  // SOS code of the specific equipment unit being inspected
  const [equipmentSosCode, setEquipmentSosCode] = useState('');

  const module_id = selectedEq?.module_id || 30;
  // equipmentType prop takes priority (sidebar-driven); fall back to module-based
  const useTypeApi = !!equipmentType;

  useEffect(() => {
    setLoading(true);
    setChecklistData([]);
    setAnswers({});
    setRemarks({});
    setSubmitted(false);

    const fetch = useTypeApi
      ? ApiService.getChecklistsByType(equipmentType)
      : ApiService.getModuleChecklists(module_id);

    fetch
      .then(res => {
        const items = Array.isArray(res) ? res : (res?.items || res?.data || res?.checklist_items || []);
        setChecklistData(items);
        const cats = [...new Set(items.map(i => i.category || 'General'))];
        setExpandedCategories(Object.fromEntries(cats.map(c => [c, true])));
      })
      .catch(err => {
        console.error('Failed to fetch checklist:', err);
        setChecklistData([]);
      })
      .finally(() => setLoading(false));
  }, [equipmentType, module_id, useTypeApi]);

  const setAnswer = (id, val) =>
    setAnswers(prev => ({ ...prev, [id]: prev[id] === val ? null : val }));

  const toggleCategory = (cat) =>
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));

  const stats = useMemo(() => {
    const total    = checklistData.length;
    const critical = checklistData.filter(i => i.is_critical || i.critical).length;
    const answered = Object.values(answers).filter(v => v !== null && v !== undefined).length;
    return { total, critical, answered };
  }, [answers, checklistData]);

  const resultStats = useMemo(() => {
    if (!submitted || checklistData.length === 0) return null;
    const passed        = checklistData.filter(i => answers[i.id] === 'Yes').length;
    const failed        = checklistData.filter(i => answers[i.id] === 'No').length;
    const na            = checklistData.filter(i => answers[i.id] === 'N/A').length;
    const criticalFailed = checklistData.filter(i => (i.is_critical || i.critical) && answers[i.id] === 'No').length;
    const score = Math.round((passed / checklistData.length) * 100);
    return { passed, failed, na, criticalFailed, score };
  }, [submitted, answers, checklistData]);

  const grouped = useMemo(() => {
    const cats = [...new Set(checklistData.map(i => i.category || 'General'))];
    return cats.map(cat => ({
      cat,
      items: checklistData.filter(i => (i.category || 'General') === cat),
    }));
  }, [checklistData]);

  const handleSubmit = async () => {
    if (!equipmentSosCode.trim()) {
      alert('Please enter the Equipment SOS Code before submitting.');
      return;
    }
    const unanswered = checklistData.filter(i => !answers[i.id]);
    if (unanswered.length > 0) {
      alert(`Please answer all ${unanswered.length} remaining item(s) before submitting.`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        inspector_name: ApiService.getUser()?.name || 'Inspector',
        inspector_id: ApiService.getUser()?.id,
        submitted_by_id: ApiService.getUser()?.id,
        user_id: ApiService.getUser()?.id,
        remarks: '[PENDING] Submitted via Web Dashboard',
        status: 'PENDING',
        approval_status: 'PENDING',
        answers: checklistData.map(i => ({
          checklist_item_id: i.id,
          answer: answers[i.id] === 'Yes' ? 'true' : (answers[i.id] === 'No' ? 'false' : 'na'),
          remarks: remarks[i.id] || ''
        })),
        signature: {
          meaning: "I certify that this inspection was conducted accurately and completely.",
          device_id: 1 // Default for web
        }
      };

      // Use the specific equipment SOS code — submit to backend
      const extPayload = {
        ...payload,
        module_id: module_id,
        equipment_name: displayName || selectedEq?.name || 'Fire Extinguisher'
      };
      try {
        await ApiService.createInspection(equipmentSosCode.trim(), extPayload);
      } catch (apiErr) {
        console.warn('Backend submission failed, falling back to local queue:', apiErr);
        await ApiService.queueInspection(equipmentSosCode.trim(), extPayload);
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Failed to submit inspection. Please check the SOS code and your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setRemarks({});
    setSubmitted(false);
    setEquipmentSosCode('');
  };

  return (
    <div className="fec-page" onScroll={e => e.stopPropagation()}>
      {/* Header */}
      <div className="fec-header">
        <button className="fec-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Back
        </button>
        <div className="fec-header-info">
          <span className="fec-header-icon">🧯</span>
          <div>
            <div className="fec-title">{displayName || selectedEq?.name || 'Equipment'} — Inspection Checklist</div>
            <div className="fec-subtitle">Equipment Module: {selectedEq?.name} &nbsp;|&nbsp; SOS Platform</div>
          </div>
        </div>
        <div className="fec-header-actions">
          {/* Equipment SOS Code input — required before submitting */}
          {!submitted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>SOS Code:</label>
              <input
                type="text"
                placeholder="e.g. ESEXT26270055"
                value={equipmentSosCode}
                onChange={e => setEquipmentSosCode(e.target.value.toUpperCase())}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid ' + (equipmentSosCode.trim() ? 'rgba(40,167,69,0.5)' : 'rgba(255,100,100,0.4)'),
                  borderRadius: '8px',
                  padding: '6px 12px',
                  color: '#fff',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  width: '185px',
                  outline: 'none',
                }}
              />
            </div>
          )}
          {submitted && (
            <button className="fec-reset-btn" onClick={handleReset}>Reset</button>
          )}
          {!submitted && (
            <button
              className="fec-submit-btn"
              onClick={handleSubmit}
              disabled={!equipmentSosCode.trim()}
              style={{ opacity: equipmentSosCode.trim() ? 1 : 0.45, cursor: equipmentSosCode.trim() ? 'pointer' : 'not-allowed' }}
            >
              Submit Inspection
            </button>
          )}
        </div>
      </div>

      {/* Live progress stats bar */}
      <div className="fec-stats-bar">
        <div className="fec-stat-chip fec-stat-answered">
          <span className="fec-stat-num">{stats.answered}</span>
          <span className="fec-stat-sep">/</span>
          <span className="fec-stat-denom">{stats.total}</span>
          <span className="fec-stat-lbl">Answered</span>
        </div>
        <div className="fec-stat-chip fec-stat-critical">
          <span className="fec-stat-num">{stats.critical}</span>
          <span className="fec-stat-lbl">Critical Items</span>
        </div>
        <div className="fec-stat-chip fec-stat-remaining">
          <span className="fec-stat-num">{stats.total - stats.answered}</span>
          <span className="fec-stat-lbl">Remaining</span>
        </div>
        <div className="fec-progress-track">
          <div className="fec-progress-label">
            <span>Completion</span>
            <span className="fec-progress-pct">{stats.total > 0 ? Math.round((stats.answered / stats.total) * 100) : 0}%</span>
          </div>
          <div className="fec-progress-bar">
            <div
              className="fec-progress-fill"
              style={{ width: `${(stats.answered / stats.total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {submitted && (
        <div className="fec-success-banner">
          <span>✅</span> Inspection submitted successfully! Review the results below.
        </div>
      )}

      {/* Result summary cards (shown after submit) */}
      {submitted && resultStats && (
        <div className="fec-result-cards">
          <div className="fec-result-card fec-rc-pass">
            <div className="fec-rc-icon">✅</div>
            <div className="fec-rc-num">{resultStats.passed}</div>
            <div className="fec-rc-label">Passed</div>
          </div>
          <div className="fec-result-card fec-rc-fail">
            <div className="fec-rc-icon">❌</div>
            <div className="fec-rc-num">{resultStats.failed}</div>
            <div className="fec-rc-label">Failed</div>
          </div>
          <div className="fec-result-card fec-rc-na">
            <div className="fec-rc-icon">➖</div>
            <div className="fec-rc-num">{resultStats.na}</div>
            <div className="fec-rc-label">Not Applicable</div>
          </div>
          <div className={`fec-result-card fec-rc-critical ${resultStats.criticalFailed > 0 ? 'fec-rc-alert' : 'fec-rc-safe'}`}>
            <div className="fec-rc-icon">{resultStats.criticalFailed > 0 ? '⚠️' : '🛡️'}</div>
            <div className="fec-rc-num">{resultStats.criticalFailed}</div>
            <div className="fec-rc-label">Critical Fails</div>
          </div>
          <div className="fec-result-card fec-rc-score">
            <div className="fec-rc-icon">📊</div>
            <div className="fec-rc-num">{resultStats.score}<span className="fec-rc-pct">%</span></div>
            <div className="fec-rc-label">Checklist Score</div>
          </div>
        </div>
      )}

      {/* Checklist Table */}
      <div className="fec-table-wrap">
        <table className="fec-table">
          <thead>
            <tr>
              <th className="fec-th-num">#</th>
              <th className="fec-th-q">Inspection Question</th>
              <th className="fec-th-ans">Answer</th>
              <th className="fec-th-crit">Critical</th>
              <th className="fec-th-status">Status</th>
              <th className="fec-th-remarks">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="fec-loading-cell">
                  <div className="fec-loader-wrap">
                    <div className="fec-spinner"></div>
                    <span>Fetching inspection criteria...</span>
                  </div>
                </td>
              </tr>
            )}
            {!loading && checklistData.length === 0 && (
              <tr>
                <td colSpan={6} className="fec-empty-cell">
                  <div className="fec-empty-msg">
                    <span>📋</span>
                    <div className="fec-empty-title">No criteria defined for {selectedEq?.name || 'this module'}</div>
                    <div className="fec-empty-sub">Please contact the administrator to configure the inspection checklist.</div>
                  </div>
                </td>
              </tr>
            )}
            {!loading && grouped.map(({ cat, items }) => (
              <React.Fragment key={cat}>
                {/* Category header row */}
                <tr
                  className="fec-cat-row"
                  onClick={() => toggleCategory(cat)}
                >
                  <td colSpan={7}>
                    <span className="fec-cat-icon">{CATEGORY_ICONS[cat]}</span>
                    <span className="fec-cat-name">{cat.toUpperCase()}</span>
                    <span className="fec-cat-count">
                      {items.filter(i => answers[i.id]).length} / {items.length} answered
                    </span>
                    <svg
                      className={`fec-cat-chevron ${expandedCategories[cat] ? 'open' : ''}`}
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </td>
                </tr>

                {/* Item rows */}
                {expandedCategories[cat] && items.map((item) => {
                  const ans = answers[item.id];
                  const rowClass = [
                    'fec-item-row',
                    submitted && ans === 'True'  ? 'fec-row-pass' : '',
                    submitted && ans === 'False' ? 'fec-row-fail' : '',
                    submitted && ans === 'NA'    ? 'fec-row-na'   : '',
                    submitted && !ans            ? 'fec-row-missing' : '',
                  ].filter(Boolean).join(' ');

                  return (
                    <tr key={item.id} className={rowClass}>
                      <td className="fec-td-num">{item.id}</td>
                      <td className="fec-td-q">{item.question}</td>
                      <td className="fec-td-ans">
                        <div className="fec-ans-group">
                          {ANSWER_OPTIONS.map(opt => (
                            <button
                              key={opt}
                              className={`fec-ans-btn fec-ans-${opt === 'N/A' ? 'na' : opt.toLowerCase()} ${ans === opt ? 'selected' : ''}`}
                              onClick={() => !submitted && setAnswer(item.id, opt)}
                              disabled={submitted}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="fec-td-crit">
                        {(item.is_critical || item.critical)
                          ? <span className="fec-crit-badge">YES ⚠</span>
                          : <span className="fec-no-badge">No</span>}
                      </td>
                      <td className="fec-td-status">
                        {ans === 'Yes'  && <span className="fec-status-pass">YES</span>}
                        {ans === 'No' && <span className="fec-status-fail">NO</span>}
                        {ans === 'N/A'    && <span className="fec-status-na">N/A</span>}
                        {!ans           && <span className="fec-status-pending">—</span>}
                      </td>
                      <td className="fec-td-remarks">
                        <input
                          className="fec-remark-input"
                          placeholder="Add note..."
                          value={remarks[item.id] || ''}
                          onChange={e => setRemarks(prev => ({ ...prev, [item.id]: e.target.value }))}
                          disabled={submitted}
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

      {/* Footer */}
      <div className="fec-footer">
        Total: {stats.total} items &nbsp;|&nbsp; Critical: {stats.critical} &nbsp;|&nbsp;
        Equipment Module: {displayName || selectedEq?.name || 'General'} &nbsp;|&nbsp; SOS Platform
      </div>
    </div>
  );
}
