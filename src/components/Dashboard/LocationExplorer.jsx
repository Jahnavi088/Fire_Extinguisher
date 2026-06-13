import React, { useState, useEffect, useMemo } from 'react';
import { ApiService } from '../../services/apiService';
import './LocationExplorer.css';

// SVG Icons
const Icons = {
  Company: () => (
    <svg className="node-icon icon-company" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>
  ),
  Branch: () => (
    <svg className="node-icon icon-branch" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v6h20zM2 10v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V10H2z" /><path d="M6 14h.01M10 14h.01M14 14h.01M18 14h.01M6 18h.01M10 18h.01M14 18h.01M18 18h.01" /></svg>
  ),
  Building: () => (
    <svg className="node-icon icon-building" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M15 3v18M3 9h18M3 15h18" /></svg>
  ),
  Floor: () => (
    <svg className="node-icon icon-floor" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /><path d="M7 6v6M17 12v6" /></svg>
  ),
  Zone: () => (
    <svg className="node-icon icon-zone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="M12 6v12M6 12h12" /></svg>
  ),
  Department: () => (
    <svg className="node-icon icon-department" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  Equipment: () => (
    <svg className="node-icon icon-equipment" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="5" width="14" height="17" rx="2" /><path d="M9 2v3M15 2v3M8 10h8M8 14h8" /></svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
  )
};

// Initial Mock Hierarchy Structure
const HIERARCHY_DATA = {
  id: 'c-1',
  name: 'Cipla Limited',
  type: 'Company',
  compliance: 96,
  dueInspections: 8,
  equipmentCounts: { total: 550, extinguishers: 250, sprinklers: 200, hoseReels: 100 },
  users: [
    { name: 'Jahnavi AGM', role: 'AGM', email: 'j.agm@cipla.com' },
    { name: 'Suresh Supervisor', role: 'Supervisor', email: 'suresh@cipla.com' }
  ],
  children: [
    {
      id: 'b-1',
      name: 'Hyderabad Plant',
      type: 'Branch',
      compliance: 95,
      dueInspections: 5,
      equipmentCounts: { total: 350, extinguishers: 150, sprinklers: 150, hoseReels: 50 },
      users: [
        { name: 'Suresh Supervisor', role: 'Supervisor', email: 'suresh@cipla.com' }
      ],
      children: [
        {
          id: 'bl-1',
          name: 'Production Building',
          type: 'Building',
          compliance: 96,
          dueInspections: 4,
          equipmentCounts: { total: 200, extinguishers: 100, sprinklers: 70, hoseReels: 30 },
          children: [
            {
              id: 'f-1',
              name: 'Ground Floor',
              type: 'Floor',
              compliance: 97,
              dueInspections: 2,
              equipmentCounts: { total: 110, extinguishers: 50, sprinklers: 40, hoseReels: 20 },
              children: [
                {
                  id: 'z-1',
                  name: 'Zone A',
                  type: 'Zone',
                  compliance: 96,
                  dueInspections: 1,
                  equipmentCounts: { total: 60, extinguishers: 30, sprinklers: 20, hoseReels: 10 },
                  children: [
                    {
                      id: 'd-1',
                      name: 'Granulation',
                      type: 'Department',
                      compliance: 98,
                      dueInspections: 0,
                      equipmentCounts: { total: 35, extinguishers: 20, sprinklers: 10, hoseReels: 5 },
                      children: [
                        { id: 'eq-1', name: 'FE-GRAN-01', type: 'Equipment', category: 'Fire Extinguisher', status: 'Healthy', lastInspected: '2026-05-15', modelCode: 'CO2 5kg' },
                        { id: 'eq-2', name: 'SP-GRAN-05', type: 'Equipment', category: 'Sprinkler', status: 'Healthy', lastInspected: '2026-05-20', modelCode: 'Pendent 68C' },
                        { id: 'eq-3', name: 'HR-GRAN-02', type: 'Equipment', category: 'Hose Reel', status: 'Healthy', lastInspected: '2026-05-12', modelCode: '30m Drum' }
                      ]
                    },
                    {
                      id: 'd-2',
                      name: 'Compression',
                      type: 'Department',
                      compliance: 94,
                      dueInspections: 1,
                      equipmentCounts: { total: 25, extinguishers: 10, sprinklers: 10, hoseReels: 5 },
                      children: [
                        { id: 'eq-4', name: 'FE-COMP-09', type: 'Equipment', category: 'Fire Extinguisher', status: 'Due Inspection', lastInspected: '2026-04-05', modelCode: 'DCP 9kg' },
                        { id: 'eq-5', name: 'SP-COMP-11', type: 'Equipment', category: 'Sprinkler', status: 'Healthy', lastInspected: '2026-05-22', modelCode: 'Pendent 68C' }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              id: 'f-2',
              name: 'First Floor',
              type: 'Floor',
              compliance: 94,
              dueInspections: 2,
              equipmentCounts: { total: 90, extinguishers: 50, sprinklers: 30, hoseReels: 10 },
              children: [
                {
                  id: 'z-2',
                  name: 'Zone B',
                  type: 'Zone',
                  compliance: 94,
                  dueInspections: 2,
                  equipmentCounts: { total: 90, extinguishers: 50, sprinklers: 30, hoseReels: 10 },
                  children: [
                    {
                      id: 'd-3',
                      name: 'Packaging',
                      type: 'Department',
                      compliance: 94,
                      dueInspections: 2,
                      equipmentCounts: { total: 90, extinguishers: 50, sprinklers: 30, hoseReels: 10 },
                      children: [
                        { id: 'eq-6', name: 'FE-PKG-21', type: 'Equipment', category: 'Fire Extinguisher', status: 'Critical', lastInspected: '2025-12-10', modelCode: 'Water 9L' },
                        { id: 'eq-7', name: 'HR-PKG-15', type: 'Equipment', category: 'Hose Reel', status: 'Warning', lastInspected: '2026-05-01', modelCode: '30m Drum' }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// Mock fallback for second company (only visible to Super Admin)
const COMPANY_2_DATA = {
  id: 'c-2',
  name: 'Apitoria Pharma',
  type: 'Company',
  compliance: 92,
  dueInspections: 12,
  equipmentCounts: { total: 410, extinguishers: 200, sprinklers: 130, hoseReels: 80 },
  users: [
    { name: 'Amit Inspector', role: 'Inspector', email: 'amit@apitoria.com' }
  ],
  children: [
    {
      id: 'b-2',
      name: 'Vizag Plant',
      type: 'Branch',
      compliance: 92,
      dueInspections: 12,
      equipmentCounts: { total: 410, extinguishers: 200, sprinklers: 130, hoseReels: 80 },
      children: [
        {
          id: 'bl-2',
          name: 'R&D Center',
          type: 'Building',
          compliance: 92,
          dueInspections: 12,
          equipmentCounts: { total: 210, extinguishers: 100, sprinklers: 70, hoseReels: 40 },
          children: [
            {
              id: 'f-3',
              name: 'Ground Floor',
              type: 'Floor',
              compliance: 93,
              dueInspections: 6,
              equipmentCounts: { total: 110, extinguishers: 50, sprinklers: 40, hoseReels: 20 },
              children: [
                {
                  id: 'z-3',
                  name: 'Synthesis Lab',
                  type: 'Zone',
                  compliance: 93,
                  dueInspections: 6,
                  equipmentCounts: { total: 110, extinguishers: 50, sprinklers: 40, hoseReels: 20 },
                  children: [
                    {
                      id: 'd-4',
                      name: 'Reactors Area',
                      type: 'Department',
                      compliance: 93,
                      dueInspections: 6,
                      equipmentCounts: { total: 110, extinguishers: 50, sprinklers: 40, hoseReels: 20 },
                      children: [
                        { id: 'eq-8', name: 'FE-RXT-44', type: 'Equipment', category: 'Fire Extinguisher', status: 'Healthy', lastInspected: '2026-05-18', modelCode: 'Dry Powder' },
                        { id: 'eq-9', name: 'FE-RXT-45', type: 'Equipment', category: 'Fire Extinguisher', status: 'Due Inspection', lastInspected: '2026-04-10', modelCode: 'CO2 5kg' }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

const LocationExplorer = ({ user }) => {
  // Simulate active roles: Super Admin, Admin, AGM, Supervisor, Inspector
  const [currentRole, setCurrentRole] = useState(user?.role || 'superadmin');
  const [selectedNode, setSelectedNode] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState({ 'c-1': true });
  const [lazyLoadingNodes, setLazyLoadingNodes] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Load backend companies & local onboarding details if we can
  const [companiesData, setCompaniesData] = useState([]);

  useEffect(() => {
    // Generate hierarchical data tree based on role
    const getRoleAppropriateData = () => {
      const roleLower = currentRole.toLowerCase();
      if (roleLower === 'superadmin') {
        return [HIERARCHY_DATA, COMPANY_2_DATA];
      } else if (roleLower === 'admin') {
        return [HIERARCHY_DATA];
      } else if (roleLower === 'agm') {
        // AGM only sees branch level downwards
        return [{
          ...HIERARCHY_DATA,
          children: HIERARCHY_DATA.children.filter(c => c.name === 'Hyderabad Plant')
        }];
      } else if (roleLower === 'supervisor') {
        // Supervisor only sees Production Building / Zone A
        const hyderabad = HIERARCHY_DATA.children[0];
        const production = hyderabad.children[0];
        return [{
          ...production,
          children: production.children.filter(f => f.name === 'Ground Floor')
        }];
      } else {
        // Inspector: only sees Zone A / Granulation Department
        const hyderabad = HIERARCHY_DATA.children[0];
        const production = hyderabad.children[0];
        const ground = production.children[0];
        const zoneA = ground.children[0];
        return [zoneA];
      }
    };

    const rootNodes = getRoleAppropriateData();
    setCompaniesData(rootNodes);
    if (rootNodes.length > 0 && !selectedNode) {
      setSelectedNode(rootNodes[0]);
    }
  }, [currentRole]);

  // Collapsible Tree Toggle with simulated Lazy Loading
  const toggleNode = (nodeId, nodeType) => {
    if (expandedNodes[nodeId]) {
      setExpandedNodes(prev => {
        const next = { ...prev };
        delete next[nodeId];
        return next;
      });
    } else {
      // Trigger lazy loading indicator if the node has children
      setLazyLoadingNodes(prev => ({ ...prev, [nodeId]: true }));
      
      // Simulate backend API call (e.g. GET /buildings/{id}/floors)
      setTimeout(() => {
        setLazyLoadingNodes(prev => {
          const next = { ...prev };
          delete next[nodeId];
          return next;
        });
        setExpandedNodes(prev => ({ ...prev, [nodeId]: true }));
      }, 350);
    }
  };

  // Find Breadcrumbs to selected node
  const getBreadcrumbs = () => {
    if (!selectedNode) return [];
    
    const path = [];
    const findPath = (currNode, targetId, currentPath) => {
      if (currNode.id === targetId) {
        path.push(...currentPath, currNode);
        return true;
      }
      if (currNode.children) {
        for (const child of currNode.children) {
          if (findPath(child, targetId, [...currentPath, currNode])) {
            return true;
          }
        }
      }
      return false;
    };

    for (const root of companiesData) {
      if (findPath(root, selectedNode.id, [])) break;
    }
    return path;
  };

  const breadcrumbs = getBreadcrumbs();

  // Search functionality: Flatten hierarchy for search match
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const results = [];
    const q = searchQuery.toLowerCase();

    const traverse = (node, path) => {
      const nodePath = [...path, node.name];
      const matchText = `${node.name} ${node.type} ${node.id} ${node.category || ''} ${node.modelCode || ''}`.toLowerCase();
      
      if (matchText.includes(q)) {
        results.push({
          node,
          pathString: nodePath.join(' > '),
          type: node.type,
          name: node.name
        });
      }

      if (node.children) {
        node.children.forEach(child => traverse(child, nodePath));
      }
    };

    companiesData.forEach(root => traverse(root, []));
    return results;
  }, [searchQuery, companiesData]);

  // Automatically expand parents of selected search result
  const selectSearchResult = (result) => {
    const findParents = (currNode, targetId, path) => {
      if (currNode.id === targetId) {
        return path;
      }
      if (currNode.children) {
        for (const child of currNode.children) {
          const found = findParents(child, targetId, [...path, currNode.id]);
          if (found) return found;
        }
      }
      return null;
    };

    let parentIds = null;
    for (const root of companiesData) {
      parentIds = findParents(root, result.node.id, []);
      if (parentIds) break;
    }

    if (parentIds) {
      const newExpanded = { ...expandedNodes };
      parentIds.forEach(id => {
        newExpanded[id] = true;
      });
      setExpandedNodes(newExpanded);
    }

    setSelectedNode(result.node);
    setSearchQuery('');
  };

  // Recursively collect all equipment items in the selected sub-hierarchy
  const getAllSubtreeEquipment = (node) => {
    const list = [];
    const traverse = (n) => {
      if (n.type === 'Equipment') {
        list.push(n);
      }
      if (n.children) {
        n.children.forEach(traverse);
      }
    };
    traverse(node);
    return list;
  };

  const currentEquipment = useMemo(() => {
    if (!selectedNode) return [];
    return getAllSubtreeEquipment(selectedNode);
  }, [selectedNode]);

  // Recursively collect all users in selected sub-hierarchy
  const currentUsers = useMemo(() => {
    if (!selectedNode) return [];
    const userSet = new Map();
    
    const traverse = (n) => {
      if (n.users) {
        n.users.forEach(u => userSet.set(u.email, u));
      }
      if (n.children) {
        n.children.forEach(traverse);
      }
    };
    traverse(selectedNode);

    // Default fallbacks if empty
    if (userSet.size === 0) {
      return [
        { name: 'Rahul Inspector', role: 'Inspector', email: 'rahul@cipla.com' },
        { name: 'Amit Inspector', role: 'Inspector', email: 'amit@cipla.com' }
      ];
    }
    return Array.from(userSet.values());
  }, [selectedNode]);

  // Render a Node recursively in the Tree list
  const renderTreeNode = (node) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedNodes[node.id];
    const isSelected = selectedNode?.id === node.id;
    const isLoading = !!lazyLoadingNodes[node.id];

    // Node icon mapping
    const NodeIcon = Icons[node.type] || (() => <span>📁</span>);

    return (
      <div key={node.id} className="tree-node-wrapper">
        <div className={`tree-node ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedNode(node)}>
          <div 
            className={`tree-arrow-wrapper ${hasChildren ? '' : 'leaf'}`}
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleNode(node.id, node.type);
            }}
          >
            {hasChildren && (
              <span className={`tree-arrow ${isExpanded ? 'expanded' : ''}`}>
                ▶
              </span>
            )}
          </div>
          
          <span className="node-icon-wrapper">
            {isLoading ? <div className="node-spinner" /> : <NodeIcon />}
          </span>

          <span className="node-name">{node.name}</span>
          <span className="node-tag">{node.type}</span>
        </div>

        {hasChildren && isExpanded && (
          <div className="tree-node-children">
            {node.children.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="location-explorer-container">
      {/* Role Selection bar (Simulation banner) */}
      <div className="role-simulator-bar">
        <span className="sim-label">👑 View Context (Role Access):</span>
        <div className="sim-roles">
          {['Super Admin', 'Admin', 'AGM', 'Supervisor', 'Inspector'].map(roleName => {
            const roleCode = roleName.replace(' ', '').toLowerCase();
            return (
              <button
                key={roleCode}
                className={`sim-role-btn ${currentRole === roleCode ? 'active' : ''}`}
                onClick={() => {
                  setCurrentRole(roleCode);
                  setSelectedNode(null);
                }}
              >
                {roleName}
              </button>
            );
          })}
        </div>
      </div>

      <div className="explorer-three-column">
        {/* COLUMN 1: LEFT PANEL - Location Explorer Tree */}
        <aside className="explorer-tree-panel">
          <div className="tree-search-wrapper">
            <span className="search-icon-inline"><Icons.Search /></span>
            <input
              type="text"
              placeholder="Search locations or assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tree-search-input"
            />
          </div>

          {searchQuery.trim() && (
            <div className="search-results-overlay">
              {searchResults.length === 0 ? (
                <div className="search-no-results">No matches found</div>
              ) : (
                searchResults.map((res, index) => (
                  <div
                    key={index}
                    className="search-result-item"
                    onClick={() => selectSearchResult(res)}
                  >
                    <div className="res-name">{res.name}</div>
                    <div className="res-path">{res.pathString}</div>
                    <span className="res-badge">{res.type}</span>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="tree-scroll-container">
            {companiesData.map(root => renderTreeNode(root))}
          </div>
        </aside>

        {/* COLUMN 2: CENTER PANEL - Work Area */}
        <section className="explorer-work-area">
          {/* Breadcrumb Navigation */}
          <nav className="explorer-breadcrumbs">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                {idx > 0 && <span className="crumb-separator">/</span>}
                <span 
                  className={`crumb-item ${idx === breadcrumbs.length - 1 ? 'active' : ''}`}
                  onClick={() => setSelectedNode(crumb)}
                >
                  {crumb.name}
                </span>
              </React.Fragment>
            ))}
          </nav>

          <div className="work-area-header">
            <div className="header-info">
              <h2>{selectedNode?.name}</h2>
              <span className="node-type-pill">{selectedNode?.type}</span>
            </div>
            <div className="work-area-tabs">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'equipment', label: 'Equipment' },
                { id: 'inspections', label: 'Inspections' },
                { id: 'reports', label: 'Reports' },
                { id: 'users', label: 'Users' }
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="work-area-content">
            {activeTab === 'overview' && (
              <div className="tab-pane overview-pane">
                <div className="overview-hero-card">
                  <div className="hero-metrics">
                    <div className="metric-box">
                      <div className="val">{selectedNode?.compliance ?? 95}%</div>
                      <div className="lbl">Location Compliance</div>
                    </div>
                    <div className="metric-box warning">
                      <div className="val">{selectedNode?.dueInspections ?? 2}</div>
                      <div className="lbl">Due Inspections</div>
                    </div>
                    <div className="metric-box info">
                      <div className="val">{currentEquipment.length}</div>
                      <div className="lbl">Total Monitored Assets</div>
                    </div>
                  </div>
                </div>

                <div className="section-title">Quick Actions</div>
                <div className="action-buttons-row">
                  <button className="action-btn primary">➕ Add Equipment here</button>
                  <button className="action-btn">📋 Schedule Audit</button>
                  <button className="action-btn">📝 View Checklist</button>
                </div>

                <div className="section-title">Recent Incidents & Logs</div>
                <div className="log-list">
                  <div className="log-item">
                    <span className="log-dot green" />
                    <span className="log-msg">Regular monthly inspection passed for <strong>FE-GRAN-01</strong></span>
                    <span className="log-time">Yesterday</span>
                  </div>
                  <div className="log-item">
                    <span className="log-dot orange" />
                    <span className="log-msg">Hose reel inspection scheduled for <strong>HR-GRAN-02</strong></span>
                    <span className="log-time">2 days ago</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'equipment' && (
              <div className="tab-pane equipment-pane">
                <table className="explorer-table">
                  <thead>
                    <tr>
                      <th>Equipment ID</th>
                      <th>Category</th>
                      <th>Model/Spec</th>
                      <th>Last Inspected</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEquipment.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="empty-cell">No equipment assets found in this location hierarchy.</td>
                      </tr>
                    ) : (
                      currentEquipment.map(eq => (
                        <tr key={eq.id}>
                          <td className="bold">{eq.name}</td>
                          <td>{eq.category}</td>
                          <td>{eq.modelCode}</td>
                          <td>{eq.lastInspected}</td>
                          <td>
                            <span className={`status-pill ${eq.status.toLowerCase().replace(' ', '-')}`}>
                              {eq.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'inspections' && (
              <div className="tab-pane inspections-pane">
                <div className="section-title">Pending Checklist Review</div>
                <div className="inspections-list">
                  <div className="inspection-card">
                    <div className="card-top">
                      <div>
                        <h4>Monthly Extinguisher Audit</h4>
                        <span className="sub">Target: Ground Floor Zone A</span>
                      </div>
                      <span className="due-tag">Overdue</span>
                    </div>
                    <div className="card-footer">
                      <span>Assigned to: <strong>Rahul Sharma</strong></span>
                      <button className="run-audit-btn">Run Checklist</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="tab-pane reports-pane">
                <div className="reports-grid">
                  <div className="report-card-pdf">
                    <div className="pdf-icon">📄</div>
                    <div className="pdf-desc">
                      <h4>Compliance Report May 2026</h4>
                      <span>PDF - 1.2 MB</span>
                    </div>
                    <button className="dl-btn">Download</button>
                  </div>
                  <div className="report-card-pdf">
                    <div className="pdf-icon">📄</div>
                    <div className="pdf-desc">
                      <h4>Equipment Integrity Summary</h4>
                      <span>XLSX - 450 KB</span>
                    </div>
                    <button className="dl-btn">Download</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="tab-pane users-pane">
                <div className="users-list-grid">
                  {currentUsers.map((usr, i) => (
                    <div key={i} className="user-profile-card">
                      <div className="avatar">{(usr.name).charAt(0)}</div>
                      <div className="user-info">
                        <h4>{usr.name}</h4>
                        <p>{usr.role}</p>
                        <span className="email">{usr.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* COLUMN 3: RIGHT PANEL - Location Details */}
        <aside className="explorer-details-panel">
          <div className="details-header">
            <h3>Location Details</h3>
          </div>
          <div className="details-scrollable">
            <div className="details-card-main">
              <div className="location-heading">
                <h4>{selectedNode?.name}</h4>
                <span>{selectedNode?.type}</span>
              </div>

              <div className="stat-circle-group">
                <div className="stat-box-mini">
                  <div className="lbl-top">Compliance</div>
                  <div className="num-val green">{selectedNode?.compliance ?? 95}%</div>
                </div>
                <div className="stat-box-mini">
                  <div className="lbl-top">Due Audits</div>
                  <div className="num-val orange">{selectedNode?.dueInspections ?? 2}</div>
                </div>
              </div>

              <div className="divider-h" />

              <div className="section-title-small">Equipment Inventory</div>
              <div className="inventory-list">
                <div className="inventory-row">
                  <span>🧯 Fire Extinguishers</span>
                  <strong>{selectedNode?.equipmentCounts?.extinguishers ?? 0}</strong>
                </div>
                <div className="inventory-row">
                  <span>🚿 Sprinkler heads</span>
                  <strong>{selectedNode?.equipmentCounts?.sprinklers ?? 0}</strong>
                </div>
                <div className="inventory-row">
                  <span>🧵 Hose Reels</span>
                  <strong>{selectedNode?.equipmentCounts?.hoseReels ?? 0}</strong>
                </div>
                <div className="inventory-row total">
                  <span>Total Equipment Assets</span>
                  <strong>{selectedNode?.equipmentCounts?.total ?? 0}</strong>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default LocationExplorer;
