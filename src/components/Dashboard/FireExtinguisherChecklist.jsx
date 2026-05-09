import React, { useState, useMemo } from 'react';
import './FireExtinguisherChecklist.css';

const CHECKLIST_DATA = [
  // IDENTIFICATION
  { id: 1,  category: 'Identification',    question: 'Is the fire extinguisher assigned an ID?',              critical: true  },
  { id: 2,  category: 'Identification',    question: 'Is the extinguisher located in the designated area?',   critical: true  },
  { id: 3,  category: 'Identification',    question: 'Is the extinguisher type appropriate for the location?',critical: true  },
  { id: 4,  category: 'Identification',    question: 'Is the capacity clearly mentioned?',                    critical: false },
  // ACCESSIBILITY
  { id: 5,  category: 'Accessibility',     question: 'Is the extinguisher easily accessible?',                critical: true  },
  { id: 6,  category: 'Accessibility',     question: 'Is it free from any obstruction?',                     critical: true  },
  { id: 7,  category: 'Accessibility',     question: 'Is the extinguisher clearly visible?',                  critical: false },
  { id: 8,  category: 'Accessibility',     question: 'Is the label readable and intact?',                    critical: false },
  // PHYSICAL CONDITION
  { id: 9,  category: 'Physical Condition',question: 'Is there any physical damage (dents/cracks)?',         critical: true  },
  { id: 10, category: 'Physical Condition',question: 'Is there any sign of rust or corrosion?',              critical: false },
  { id: 11, category: 'Physical Condition',question: 'Is the safety pin in place?',                          critical: true  },
  { id: 12, category: 'Physical Condition',question: 'Is the tamper seal intact?',                           critical: true  },
  { id: 13, category: 'Physical Condition',question: 'Is the pressure gauge in the green zone?',             critical: true  },
  { id: 14, category: 'Physical Condition',question: 'Is the hose/nozzle in good condition?',                critical: false },
  { id: 15, category: 'Physical Condition',question: 'Is there any leakage?',                                critical: true  },
  { id: 16, category: 'Physical Condition',question: 'Is the handle/lever functioning properly?',            critical: false },
  { id: 17, category: 'Physical Condition',question: 'Are wheels (if applicable) in good condition?',        critical: false },
  // DOCUMENTATION
  { id: 18, category: 'Documentation',    question: 'Is the last inspection date updated?',                  critical: false },
  { id: 19, category: 'Documentation',    question: 'Is the next inspection date valid?',                    critical: false },
  { id: 20, category: 'Documentation',    question: 'Is the extinguisher within expiry date?',               critical: true  },
  { id: 21, category: 'Documentation',    question: 'Is the last refilling date recorded?',                  critical: false },
  { id: 22, category: 'Documentation',    question: 'Is the hydrostatic test up to date?',                   critical: false },
  // COMPLIANCE
  { id: 23, category: 'Compliance',       question: 'Are operating instructions clearly visible?',           critical: false },
  { id: 24, category: 'Compliance',       question: 'Is proper signage provided nearby?',                    critical: false },
  { id: 25, category: 'Compliance',       question: 'Is the extinguisher suitable for fire risk in this area?', critical: true },
  // SERVICE
  { id: 26, category: 'Service',          question: 'Is the extinguisher in good working condition?',        critical: true  },
  { id: 27, category: 'Service',          question: 'Does it require servicing?',                            critical: false },
  { id: 28, category: 'Service',          question: 'Does it need replacement?',                             critical: false },
  // SIGN-OFF
  { id: 29, category: 'Sign-off',         question: 'Are remarks recorded?',                                 critical: false },
  { id: 30, category: 'Sign-off',         question: 'Are inspector name and signature recorded?',            critical: false },
];

const CATEGORY_ICONS = {
  'Identification':    '🔖',
  'Accessibility':     '🚪',
  'Physical Condition':'🔍',
  'Documentation':     '📄',
  'Compliance':        '✅',
  'Service':           '🔧',
  'Sign-off':          '✍️',
};

const CATEGORY_ORDER = [
  'Identification', 'Accessibility', 'Physical Condition',
  'Documentation', 'Compliance', 'Service', 'Sign-off',
];

const ANSWER_OPTIONS = ['True', 'False', 'NA'];

export default function FireExtinguisherChecklist({ onBack }) {
  const [answers, setAnswers] = useState({});
  const [remarks, setRemarks] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(
    Object.fromEntries(CATEGORY_ORDER.map(c => [c, true]))
  );

  const setAnswer = (id, val) =>
    setAnswers(prev => ({ ...prev, [id]: prev[id] === val ? null : val }));

  const toggleCategory = (cat) =>
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));

  const stats = useMemo(() => {
    const total    = CHECKLIST_DATA.length;
    const critical = CHECKLIST_DATA.filter(i => i.critical).length;
    const answered = Object.values(answers).filter(v => v !== null && v !== undefined).length;
    return { total, critical, answered };
  }, [answers]);

  const resultStats = useMemo(() => {
    if (!submitted) return null;
    const passed        = CHECKLIST_DATA.filter(i => answers[i.id] === 'True').length;
    const failed        = CHECKLIST_DATA.filter(i => answers[i.id] === 'False').length;
    const na            = CHECKLIST_DATA.filter(i => answers[i.id] === 'NA').length;
    const criticalFailed = CHECKLIST_DATA.filter(i => i.critical && answers[i.id] === 'False').length;
    const score = Math.round((passed / CHECKLIST_DATA.length) * 100);
    return { passed, failed, na, criticalFailed, score };
  }, [submitted, answers]);

  const grouped = useMemo(() =>
    CATEGORY_ORDER.map(cat => ({
      cat,
      items: CHECKLIST_DATA.filter(i => i.category === cat),
    })),
  []);

  const handleSubmit = () => {
    const unanswered = CHECKLIST_DATA.filter(i => !answers[i.id]);
    if (unanswered.length > 0) {
      alert(`Please answer all ${unanswered.length} remaining item(s) before submitting.`);
      return;
    }

    const passed        = CHECKLIST_DATA.filter(i => answers[i.id] === 'True').length;
    const failed        = CHECKLIST_DATA.filter(i => answers[i.id] === 'False').length;
    const na            = CHECKLIST_DATA.filter(i => answers[i.id] === 'NA').length;
    const criticalFailed = CHECKLIST_DATA.filter(i => i.critical && answers[i.id] === 'False').length;

    const record = {
      id: Date.now(),
      submittedAt: new Date().toISOString(),
      passed,
      failed,
      na,
      criticalFailed,
      total: CHECKLIST_DATA.length,
      critical: CHECKLIST_DATA.filter(i => i.critical).length,
      items: CHECKLIST_DATA.map(i => ({
        id: i.id,
        category: i.category,
        question: i.question,
        critical: i.critical,
        answer: answers[i.id],
        remark: remarks[i.id] || '',
      })),
    };

    try {
      const existing = JSON.parse(localStorage.getItem('fe_inspection_history') || '[]');
      localStorage.setItem('fe_inspection_history', JSON.stringify([record, ...existing]));
      window.dispatchEvent(new CustomEvent('fe-inspection-saved'));
    } catch { /* storage full or unavailable */ }

    setSubmitted(true);
  };

  const handleReset = () => {
    setAnswers({});
    setRemarks({});
    setSubmitted(false);
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
            <div className="fec-title">Fire Extinguisher — Inspection Checklist</div>
            <div className="fec-subtitle">Equipment Module: Fire Extinguisher &nbsp;|&nbsp; SOS Platform</div>
          </div>
        </div>
        <div className="fec-header-actions">
          {submitted && (
            <button className="fec-reset-btn" onClick={handleReset}>Reset</button>
          )}
          {!submitted && (
            <button className="fec-submit-btn" onClick={handleSubmit}>
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
            <span className="fec-progress-pct">{Math.round((stats.answered / stats.total) * 100)}%</span>
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
            <div className="fec-rc-label">Inspection Score</div>
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
            {grouped.map(({ cat, items }) => (
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
                              className={`fec-ans-btn fec-ans-${opt.toLowerCase()} ${ans === opt ? 'selected' : ''}`}
                              onClick={() => !submitted && setAnswer(item.id, opt)}
                              disabled={submitted}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="fec-td-crit">
                        {item.critical
                          ? <span className="fec-crit-badge">YES ⚠</span>
                          : <span className="fec-no-badge">No</span>}
                      </td>
                      <td className="fec-td-status">
                        {ans === 'True'  && <span className="fec-status-pass">YES</span>}
                        {ans === 'False' && <span className="fec-status-fail">NO</span>}
                        {ans === 'NA'    && <span className="fec-status-na">N/A</span>}
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
        Equipment Module: Fire Extinguisher &nbsp;|&nbsp; SOS Platform
      </div>
    </div>
  );
}
