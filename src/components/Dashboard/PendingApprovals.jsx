import React, { useState, useEffect } from 'react';
import './Reports.css'; // Use Reports styling for uniform look
import './PendingApprovals.css'; // Premium drawer & layout styles
import { ApiService } from '../../services/apiService';

const PAGE_SIZE = 10;

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

const PendingApprovals = ({ user, onBack, allowedModules }) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [retry, setRetry] = useState(0);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [remarksInput, setRemarksInput] = useState('');
  const [rejectInput, setRejectInput] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'approve' | 'reject'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkRejectInput, setBulkRejectInput] = useState('');

  // Detailed view drawer states
  const [detailItem, setDetailItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailedChecklist, setDetailedChecklist] = useState([]);

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    const today = new Date();
    const endDateStr = today.toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];

    Promise.allSettled([
      ApiService.getInspectionReports({
        start_date: startDateStr,
        end_date: endDateStr
      }),
      ApiService.getPendingUpdates().catch(() => []),
      ApiService.getAdminUsers().catch(() => [])
    ]).then(([inspectionsRes, updatesRes, usersRes]) => {
      if (!active) return;
      
      const rawInspections = inspectionsRes.status === 'fulfilled' ? inspectionsRes.value : [];
      const rawUpdates = updatesRes.status === 'fulfilled' ? updatesRes.value : [];
      const rawUsers = usersRes.status === 'fulfilled' ? usersRes.value : [];
      
      const iList = Array.isArray(rawInspections) ? rawInspections : (rawInspections?.items || rawInspections?.reports || rawInspections?.inspections || rawInspections?.data || []);
      const uList = Array.isArray(rawUpdates) ? rawUpdates : (rawUpdates?.items || rawUpdates?.updates || rawUpdates?.data || []);
      const uListUsers = Array.isArray(rawUsers) ? rawUsers : (rawUsers?.users || rawUsers?.data || []);
      
      const approvedLocally = JSON.parse(localStorage.getItem('approved_inspections') || '[]');
      
      // Extract pending inspections
      const pendingInspections = iList.filter(i => {
         const stStatus = (i.status || '').toUpperCase();
         const stApprov = (i.approval_status || '').toUpperCase();
         
         const isApproved = stApprov === 'APPROVED' || stStatus === 'APPROVED' || approvedLocally.includes(i.id);
         return !isApproved;
      }).map(i => ({ ...i, _itemType: 'inspection' }));

      // Extract pending updates
      const pendingUpdates = uList.filter(u => {
         if (approvedLocally.includes(u.id)) return false;
         const stStatus = (u.status || '').toUpperCase();
         const stApprov = (u.approval_status || '').toUpperCase();
         
         return stApprov === 'PENDING' || stStatus === 'PENDING' || stApprov !== 'APPROVED';
      }).map(u => ({ ...u, _itemType: 'update' }));

      // Extract locally queued inspections
      const queuedInspections = ApiService.getQueuedInspections();

      let merged = [...queuedInspections, ...pendingInspections, ...pendingUpdates];
      if (allowedModules) {
        const allowedIds = new Set(allowedModules.map(m => String(m.module_id)));
        merged = merged.filter(r => !r.module_id || allowedIds.has(String(r.module_id)));
      }

      // If current user is a supervisor or admin, restrict list to their managed/company inspectors
      const role = (user?.role || '').toLowerCase();
      const currentUserId = String(user?.id || user?.user_id || '');
      const userCompanyId = user?.company_id || user?.companyId;

      if (role === 'supervisor') {
        const controlled = uListUsers.filter(u => String(u.supervisor_id || u.supervisorId) === currentUserId);
        const controlledIds = new Set(controlled.map(u => String(u.id)));
        
        let teamFiltered = merged.filter(item => {
          const itemUserId = String(item.submitted_by_id || item.inspector_id || item.user_id || '');
          return itemUserId === currentUserId || controlledIds.has(itemUserId);
        });

        // Fallback to company-wide if team list is empty but we have company ID
        if (teamFiltered.length === 0 && userCompanyId) {
          const companyUsers = uListUsers.filter(u => String(u.company_id || u.companyId) === String(userCompanyId));
          const companyUserIds = new Set(companyUsers.map(u => String(u.id)));
          teamFiltered = merged.filter(item => {
            const itemUserId = String(item.submitted_by_id || item.inspector_id || item.user_id || '');
            return companyUserIds.has(itemUserId);
          });
        }
        merged = teamFiltered;
      } else if (role === 'agm') {
        const controlled = uListUsers.filter(u => String(u.agm_id || u.agmId) === currentUserId);
        const controlledIds = new Set(controlled.map(u => String(u.id)));
        
        let teamFiltered = merged.filter(item => {
          const itemUserId = String(item.submitted_by_id || item.inspector_id || item.user_id || '');
          return itemUserId === currentUserId || controlledIds.has(itemUserId);
        });

        // Fallback to company-wide if team list is empty but we have company ID
        if (teamFiltered.length === 0 && userCompanyId) {
          const companyUsers = uListUsers.filter(u => String(u.company_id || u.companyId) === String(userCompanyId));
          const companyUserIds = new Set(companyUsers.map(u => String(u.id)));
          teamFiltered = merged.filter(item => {
            const itemUserId = String(item.submitted_by_id || item.inspector_id || item.user_id || '');
            return companyUserIds.has(itemUserId);
          });
        }
        merged = teamFiltered;
      } else if (role === 'admin' || role === 'superadmin') {
        if (userCompanyId) {
          const companyUsers = uListUsers.filter(u => String(u.company_id || u.companyId) === String(userCompanyId));
          const companyUserIds = new Set(companyUsers.map(u => String(u.id)));
          
          merged = merged.filter(item => {
            const itemUserId = String(item.submitted_by_id || item.inspector_id || item.user_id || '');
            return companyUserIds.has(itemUserId);
          });
        }
      }

      merged.sort((a, b) => new Date(b.created_at || b.inspected_at || 0) - new Date(a.created_at || a.inspected_at || 0));
      
      setItems(merged);
      setSelectedIds([]);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [retry]);

  const handleViewChecklist = async (item) => {
    if (!item) return;
    console.log('=== PendingApprovals: handleViewChecklist clicked ===', item);
    setDetailItem(item);
    setDetailedChecklist([]);
    
    if (item._itemType === 'inspection') {
      setDetailLoading(true);
      try {
        let answersList = [];
        if (item._isQueuedLocal) {
          answersList = item.payload?.answers || [];
        } else {
          // 1. Fetch detailed inspection responses
          const inspectionRes = await ApiService.getInspectionById(item.id);
          answersList = inspectionRes?.answers || inspectionRes?.items || inspectionRes?.responses || inspectionRes?.results || (Array.isArray(inspectionRes) ? inspectionRes : []);
        }

        // 2. Fetch the checklist definition for this module to map full question texts
        const moduleId = item.module_id || 30; // default to fire extinguishers (30)
        const checklistRes = await ApiService.getModuleChecklists(moduleId);
        const checklistItems = Array.isArray(checklistRes) ? checklistRes : (checklistRes?.items || checklistRes?.data || checklistRes?.checklist_items || []);

        // 3. Map answers to standard questions
        const parseAnswer = (val) => {
          if (val === undefined || val === null) return 'N/A';
          const str = String(val).toLowerCase().trim();
          if (val === true || str === 'true' || str === 'yes' || str === 'pass' || str === 'ok' || str === '1' || str === 'y') return 'Yes';
          if (val === false || str === 'false' || str === 'no' || str === 'fail' || str === 'nok' || str === '0' || str === 'n') return 'No';
          if (str === 'na' || str === 'n/a') return 'N/A';
          return 'N/A';
        };

        let mapped = [];
        if (checklistItems.length > 0) {
          mapped = checklistItems.map(clItem => {
            const ans = answersList.find(a => {
              const aId = a.checklist_item_id !== undefined ? a.checklist_item_id :
                          a.checklist_id !== undefined ? a.checklist_id :
                          a.item_id !== undefined ? a.item_id :
                          a.question_id !== undefined ? a.question_id :
                          a.id !== undefined ? a.id : null;
              return aId !== null && String(aId) === String(clItem.id);
            });
            const rawAns = ans ? (ans.answer !== undefined ? ans.answer : ans.value !== undefined ? ans.value : ans.status !== undefined ? ans.status : ans.result !== undefined ? ans.result : ans.response) : undefined;
            const remarksVal = ans ? (ans.remarks || ans.remark || ans.notes || ans.comment || ans.comments || '') : '';
            return {
              id: clItem.id,
              question: clItem.question || clItem.description || 'Inspection Point',
              category: clItem.category || 'General',
              is_critical: !!(clItem.is_critical || clItem.critical),
              answer: parseAnswer(rawAns),
              remarks: remarksVal
            };
          });
        } else {
          // Fallback if no checklists definition found
          mapped = answersList.map((ans, idx) => {
            const rawAns = ans.answer !== undefined ? ans.answer : ans.value !== undefined ? ans.value : ans.status !== undefined ? ans.status : ans.result !== undefined ? ans.result : ans.response;
            const remarksVal = ans.remarks || ans.remark || ans.notes || ans.comment || ans.comments || '';
            const itemId = ans.checklist_item_id || ans.checklist_id || ans.item_id || ans.question_id || ans.id || idx;
            return {
              id: itemId,
              question: ans.question || ans.question_text || ans.description || `Check Item #${itemId || idx + 1}`,
              category: ans.category || 'General',
              is_critical: !!(ans.is_critical || ans.critical),
              answer: parseAnswer(rawAns),
              remarks: remarksVal
            };
          });
        }

        setDetailedChecklist(mapped);
      } catch (err) {
        console.error('Failed to fetch detailed checklist answers:', err);
        setDetailedChecklist([]);
      } finally {
        setDetailLoading(false);
      }
    }
  };

  const filteredItems = items.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const subName = (item.submitted_by_name || item.inspector_name || item.user_name || '').toLowerCase();
    const unitCode = (item.sos_code || item.equipment_code || '').toLowerCase();
    const modName = (item.equipment_name || item.module_name || '').toLowerCase();
    return subName.includes(q) || unitCode.includes(q) || modName.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pageItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pageItemIds = pageItems.map(item => `${item._itemType}-${item.id}`);
  const isAllSelected = pageItemIds.length > 0 && pageItemIds.every(id => selectedIds.includes(id));
  
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !pageItemIds.includes(id)));
    } else {
      setSelectedIds(prev => {
        const next = [...prev];
        pageItemIds.forEach(id => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    setModalMode('bulkApprove');
  };

  const executeBulkApprove = async () => {
    setModalMode(null);
    setBulkActionLoading(true);
    
    const selectedItemsList = items.filter(item => selectedIds.includes(`${item._itemType}-${item.id}`));
    const approvedLocally = JSON.parse(localStorage.getItem('approved_inspections') || '[]');

    try {
      await Promise.allSettled(selectedItemsList.map(async (selectedItem) => {
        try {
          if (selectedItem._itemType === 'update') {
            if (isSuperadminOrAdmin) {
              await ApiService.adminApproveUpdate(selectedItem.id, 'Bulk Approved');
            } else {
              await ApiService.supervisorApproveUpdate(selectedItem.id, 'Bulk Approved');
            }
          } else if (selectedItem._isQueuedLocal) {
            const res = await ApiService.createInspection(selectedItem.sos_code, {
              ...selectedItem.payload,
              status: 'APPROVED',
              approval_status: 'APPROVED',
              remarks: selectedItem.payload.remarks ? `${selectedItem.payload.remarks} | Bulk Approved` : 'Bulk Approved'
            });
            ApiService.removeQueuedInspection(selectedItem.id);
            const newId = res?.id || res?.inspection_id || selectedItem.id;
            if (!approvedLocally.includes(newId)) approvedLocally.push(newId);
          } else {
            if (!approvedLocally.includes(selectedItem.id)) {
              approvedLocally.push(selectedItem.id);
            }
            try { await ApiService.approveInspection(selectedItem.id, 'Bulk Approved'); } catch(e) {}
          }
        } catch (err) {
          console.error(`Failed to approve item ${selectedItem.id}:`, err);
        }
      }));
      
      localStorage.setItem('approved_inspections', JSON.stringify(approvedLocally));

      // Send targeted notifications to submitting users for each approved item
      selectedItemsList.forEach(item => {
         const toUser = item.submitted_by_id || item.submittedById || item.inspector_id || item.inspectorId || item.user_id || item.userId;
         if (toUser) {
            ApiService.sendTargetedNotification({
               user_id: toUser,
               title: 'Inspection Successful',
               message: `Your inspection submission for ${item.sos_code || item.equipment_code} has been approved and marked successful.`,
               type: 'success'
            }).catch(console.error);
         }
      });

      // Send a single summary notification to AGM users for the bulk approval
      try {
         ApiService.getAdminUsers({ role: 'agm' }).then(res => {
            const users = Array.isArray(res) ? res : (res?.users || res?.items || res?.data || []);
            const agms = users.filter(u => String(u.role).toLowerCase() === 'agm');
            agms.forEach(agm => {
               ApiService.sendTargetedNotification({
                  user_id: agm.id,
                  title: 'Bulk Inspections Approved',
                  message: `${selectedItemsList.length} inspection submissions have been approved successfully.`,
                  type: 'success'
               }).catch(console.error);
            });
         }).catch(console.error);
      } catch (err) {
         console.error('Failed to notify AGM users of bulk approval:', err);
      }

      setSelectedIds([]);
      setRetry(r => r + 1);
    } catch (e) {
      alert('Bulk approval completed.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkReject = () => {
    if (selectedIds.length === 0) return;
    setBulkRejectInput('');
    setModalMode('bulkReject');
  };

  const executeBulkReject = async () => {
    if (!bulkRejectInput || !bulkRejectInput.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }
    setModalMode(null);
    setBulkActionLoading(true);

    const reason = bulkRejectInput.trim();

    const selectedItemsList = items.filter(item => selectedIds.includes(`${item._itemType}-${item.id}`));
    const approvedLocally = JSON.parse(localStorage.getItem('approved_inspections') || '[]');

    try {
      await Promise.allSettled(selectedItemsList.map(async (selectedItem) => {
        try {
          if (selectedItem._itemType === 'update') {
            if (isSuperadminOrAdmin) {
              await ApiService.adminRejectUpdate(selectedItem.id, reason.trim());
            } else {
              await ApiService.supervisorRejectUpdate(selectedItem.id, reason.trim());
            }
          } else if (selectedItem._isQueuedLocal) {
            ApiService.removeQueuedInspection(selectedItem.id);
          } else {
            if (!approvedLocally.includes(selectedItem.id)) {
              approvedLocally.push(selectedItem.id);
            }
            try { await ApiService.rejectInspection(selectedItem.id, reason.trim()); } catch(e) {}
          }
        } catch (err) {
          console.error(`Failed to reject item ${selectedItem.id}:`, err);
        }
      }));

      localStorage.setItem('approved_inspections', JSON.stringify(approvedLocally));
      setSelectedIds([]);
      setRetry(r => r + 1);
    } catch (e) {
      alert('Bulk rejection completed.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const openApprove = async (item) => {
    setSelectedItem(item);
    setRemarksInput('');
    setModalMode('approve');
    setDetailedChecklist([]);
    
    if (item._itemType === 'inspection') {
      setDetailLoading(true);
      try {
        let answersList = [];
        if (item._isQueuedLocal) {
          answersList = item.payload?.answers || [];
        } else {
          // 1. Fetch detailed inspection responses
          const inspectionRes = await ApiService.getInspectionById(item.id);
          answersList = inspectionRes?.answers || inspectionRes?.items || inspectionRes?.responses || inspectionRes?.results || (Array.isArray(inspectionRes) ? inspectionRes : []);
        }

        // 2. Fetch the checklist definition for this module to map full question texts
        const moduleId = item.module_id || 30; // default to fire extinguishers (30)
        const checklistRes = await ApiService.getModuleChecklists(moduleId);
        const checklistItems = Array.isArray(checklistRes) ? checklistRes : (checklistRes?.items || checklistRes?.data || checklistRes?.checklist_items || []);

        // 3. Map answers to standard questions
        const parseAnswer = (val) => {
          if (val === undefined || val === null) return 'N/A';
          const str = String(val).toLowerCase().trim();
          if (val === true || str === 'true' || str === 'yes' || str === 'pass' || str === 'ok' || str === '1' || str === 'y') return 'Yes';
          if (val === false || str === 'false' || str === 'no' || str === 'fail' || str === 'nok' || str === '0' || str === 'n') return 'No';
          if (str === 'na' || str === 'n/a') return 'N/A';
          return 'N/A';
        };

        let mapped = [];
        if (checklistItems.length > 0) {
          mapped = checklistItems.map(clItem => {
            const ans = answersList.find(a => {
              const aId = a.checklist_item_id !== undefined ? a.checklist_item_id :
                          a.checklist_id !== undefined ? a.checklist_id :
                          a.item_id !== undefined ? a.item_id :
                          a.question_id !== undefined ? a.question_id :
                          a.id !== undefined ? a.id : null;
              return aId !== null && String(aId) === String(clItem.id);
            });
            const rawAns = ans ? (ans.answer !== undefined ? ans.answer : ans.value !== undefined ? ans.value : ans.status !== undefined ? ans.status : ans.result !== undefined ? ans.result : ans.response) : undefined;
            const remarksVal = ans ? (ans.remarks || ans.remark || ans.notes || ans.comment || ans.comments || '') : '';
            return {
              id: clItem.id,
              question: clItem.question || clItem.description || 'Inspection Point',
              category: clItem.category || 'General',
              is_critical: !!(clItem.is_critical || clItem.critical),
              answer: parseAnswer(rawAns),
              remarks: remarksVal
            };
          });
        } else {
          // Fallback if no checklists definition found
          mapped = answersList.map((ans, idx) => {
            const rawAns = ans.answer !== undefined ? ans.answer : ans.value !== undefined ? ans.value : ans.status !== undefined ? ans.status : ans.result !== undefined ? ans.result : ans.response;
            const remarksVal = ans.remarks || ans.remark || ans.notes || ans.comment || ans.comments || '';
            const itemId = ans.checklist_item_id || ans.checklist_id || ans.item_id || ans.question_id || ans.id || idx;
            return {
              id: itemId,
              question: ans.question || ans.question_text || ans.description || `Check Item #${itemId || idx + 1}`,
              category: ans.category || 'General',
              is_critical: !!(ans.is_critical || ans.critical),
              answer: parseAnswer(rawAns),
              remarks: remarksVal
            };
          });
        }

        setDetailedChecklist(mapped);
      } catch (err) {
        console.error('Failed to fetch detailed checklist answers:', err);
        setDetailedChecklist([]);
      } finally {
        setDetailLoading(false);
      }
    }
  };

  const openReject = (item) => {
    setSelectedItem(item);
    setRejectInput('');
    setModalMode('reject');
  };

  const isSuperadminOrAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  const handleApprove = async () => {
    if (!selectedItem) return;
    setActionLoading(selectedItem.id);
    try {
      if (selectedItem._itemType === 'update') {
        if (isSuperadminOrAdmin) {
          await ApiService.adminApproveUpdate(selectedItem.id, remarksInput.trim() || undefined);
        } else {
          await ApiService.supervisorApproveUpdate(selectedItem.id, remarksInput.trim() || undefined);
        }
      } else if (selectedItem._isQueuedLocal) {
        // Submit the queued inspection to backend
        const res = await ApiService.createInspection(selectedItem.sos_code, {
          ...selectedItem.payload,
          status: 'APPROVED',
          approval_status: 'APPROVED',
          remarks: remarksInput.trim() ? `${selectedItem.payload.remarks || ''} | Reviewer: ${remarksInput.trim()}` : selectedItem.payload.remarks
        });
        // Remove from local queue
        ApiService.removeQueuedInspection(selectedItem.id);
        
        // Also add the newly created inspection's ID to approved locally
        const approved = JSON.parse(localStorage.getItem('approved_inspections') || '[]');
        const newId = res?.id || res?.inspection_id || selectedItem.id;
        if (!approved.includes(newId)) {
          approved.push(newId);
          localStorage.setItem('approved_inspections', JSON.stringify(approved));
        }
      } else {
        // Mark as approved locally since backend might not support it
        const approved = JSON.parse(localStorage.getItem('approved_inspections') || '[]');
        if (!approved.includes(selectedItem.id)) {
          approved.push(selectedItem.id);
          localStorage.setItem('approved_inspections', JSON.stringify(approved));
        }
        try { await ApiService.approveInspection(selectedItem.id, remarksInput.trim() || undefined); } catch(e) {}
      }
      
      // Send notification to submitter
      const toUser = selectedItem.submitted_by_id || selectedItem.submittedById || selectedItem.inspector_id || selectedItem.inspectorId || selectedItem.user_id || selectedItem.userId;
      if (toUser) {
         ApiService.sendTargetedNotification({
            user_id: toUser,
            title: 'Inspection Successful',
            message: `Your inspection submission for ${selectedItem.sos_code || selectedItem.equipment_code} has been approved and marked successful.`,
            type: 'success'
         }).catch(console.error);
      } else {
         ApiService.broadcastNotification({
            title: 'Inspection Successful',
            message: `Submission for ${selectedItem.sos_code || selectedItem.equipment_code} by ${selectedItem.submitted_by_name || selectedItem.inspector_name || 'Inspector'} has been approved and marked successful.`,
            type: 'success'
         }).catch(console.error);
      }

      // Send notification to AGM users
      try {
         ApiService.getAdminUsers({ role: 'agm' }).then(res => {
            const users = Array.isArray(res) ? res : (res?.users || res?.items || res?.data || []);
            const agms = users.filter(u => String(u.role).toLowerCase() === 'agm');
            agms.forEach(agm => {
               ApiService.sendTargetedNotification({
                  user_id: agm.id,
                  title: 'New Inspection Approved',
                  message: `Inspection for ${selectedItem.sos_code || selectedItem.equipment_code} (submitted by ${selectedItem.submitted_by_name || selectedItem.inspector_name || 'Inspector'}) has been approved successfully.`,
                  type: 'success'
               }).catch(console.error);
            });
         }).catch(console.error);
      } catch (err) {
         console.error('Failed to notify AGM users:', err);
      }
      
      setModalMode(null);
      setDetailItem(null); // Close the drawer if open
      setRetry(r => r + 1);
    } catch (e) { 
      alert(e.message || 'Approval failed'); 
    }
    finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    if (!rejectInput.trim()) { alert('Please enter a reason for rejection.'); return; }
    setActionLoading(selectedItem.id);
    try {
      if (selectedItem._itemType === 'update') {
        if (isSuperadminOrAdmin) {
          await ApiService.adminRejectUpdate(selectedItem.id, rejectInput.trim());
        } else {
          await ApiService.supervisorRejectUpdate(selectedItem.id, rejectInput.trim());
        }
      } else if (selectedItem._isQueuedLocal) {
        // Just discard from local queue
        ApiService.removeQueuedInspection(selectedItem.id);
      } else {
        // Mark as rejected locally (remove from pending logic by simulating approval, or store in rejected_inspections)
        // For simplicity, we just mark it "approved" locally so it stops showing up in pending, and the result will just be what the backend has.
        const approved = JSON.parse(localStorage.getItem('approved_inspections') || '[]');
        if (!approved.includes(selectedItem.id)) {
          approved.push(selectedItem.id);
          localStorage.setItem('approved_inspections', JSON.stringify(approved));
        }
        try { await ApiService.rejectInspection(selectedItem.id, rejectInput.trim()); } catch(e) {}
      }
      
      // Send notification
      const toUser = selectedItem.submitted_by_id || selectedItem.inspector_id || selectedItem.user_id;
      if (toUser) {
         ApiService.sendTargetedNotification({
            user_id: toUser,
            title: 'Approval Rejected',
            message: `Your submission for ${selectedItem.sos_code || selectedItem.equipment_code} was rejected. Reason: ${rejectInput}`,
            type: 'error'
         }).catch(console.error);
      } else {
         ApiService.broadcastNotification({
            title: 'Approval Rejected',
            message: `Submission for ${selectedItem.sos_code || selectedItem.equipment_code} by ${selectedItem.submitted_by_name || selectedItem.inspector_name || 'Inspector'} was rejected. Reason: ${rejectInput}`,
            type: 'error'
         }).catch(console.error);
      }
      
      setModalMode(null);
      setDetailItem(null); // Close the drawer if open
      setRetry(r => r + 1);
    } catch (e) { 
      alert(e.message || 'Rejection failed'); 
    }
    finally { setActionLoading(null); }
  };

  // Helper to extract fields for display comparison
  const getDisplayFields = (item) => {
    if (!item) return [];
    return Object.entries(item).filter(([k, v]) => {
      if (k.startsWith('_') || ['id', 'created_at', 'updated_at', 'status', 'approval_status', 'submitted_by_id', 'inspector_id', 'user_id', 'module_id'].includes(k)) return false;
      return typeof v !== 'object' && v !== null && v !== '';
    });
  };

  return (
    <div className="rpt-page">
      <div className="rpt-header">
        <button className="rpt-back-btn" onClick={onBack} title="Back to Dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="rpt-header-info">
          <div>
            <div className="rpt-title-text">Pending Approvals</div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Review and manage pending inspection and maintenance requests
            </p>
          </div>
        </div>
      </div>

      <div className="rpt-data-panel">
        <div className="rpt-data-panel-header">
          <div className="rpt-data-panel-title">
            <div className="rpt-title-main">
              {!loading && <span className="rpt-count-badge">{filteredItems.length} requests pending</span>}
            </div>
          </div>
          {!loading && items.length > 0 && (
            <div className="rpt-toolbar" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', marginRight: '12px', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none', marginRight: '8px' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                  Select All
                </label>
                <button
                  onClick={handleBulkApprove}
                  disabled={bulkActionLoading || selectedIds.length === 0}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    background: selectedIds.length > 0 ? '#16a34a' : 'rgba(255,255,255,0.05)',
                    color: selectedIds.length > 0 ? '#fff' : 'rgba(255,255,255,0.3)',
                    border: selectedIds.length > 0 ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Approve Selected ({selectedIds.length})
                </button>
                <button
                  onClick={handleBulkReject}
                  disabled={bulkActionLoading || selectedIds.length === 0}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    background: selectedIds.length > 0 ? '#dc2626' : 'rgba(255,255,255,0.05)',
                    color: selectedIds.length > 0 ? '#fff' : 'rgba(255,255,255,0.3)',
                    border: selectedIds.length > 0 ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Reject Selected ({selectedIds.length})
                </button>
              </div>
              <input 
                type="text" 
                placeholder="Search requests..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  fontSize: '11px',
                  outline: 'none',
                  width: '180px',
                  background: 'rgba(255,255,255,0.8)'
                }}
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="rpt-spinner" style={{ margin: '40px auto' }}>
            <div className="rpt-spinner-ring" />
            <span className="rpt-spinner-text">Loading pending approvals…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="rpt-empty" style={{ margin: '40px auto' }}>
            <div className="rpt-empty-title">No Pending Approvals</div>
            <div className="rpt-empty-desc">Everything is up to date.</div>
          </div>
        ) : (
          <div className="rpt-table-container">
            <table className="rpt-grid-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ width: '50px', textAlign: 'center' }}>S.No</th>
                  <th>Date &amp; Time</th>
                  <th>Submitted By</th>
                  <th>Unit ID</th>
                  <th>Module</th>
                  <th>Remarks</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, i) => {
                  const sno = (page - 1) * PAGE_SIZE + i + 1;
                  const dateStr = item.created_at || item.inspected_at;
                  return (
                    <tr key={`${item._itemType}-${item.id}`}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(`${item._itemType}-${item.id}`)}
                          onChange={() => toggleSelect(`${item._itemType}-${item.id}`)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>{sno}</td>
                      <td className="rpt-cell-date-new">
                        <div className="rpt-d">{fmt(dateStr)}</div>
                        <div className="rpt-t">{fmtTime(dateStr)}</div>
                      </td>
                      <td>
                        <span className="rpt-cell-text-dark">{item.submitted_by_name || item.inspector_name || item.user_name || 'Unknown'}</span>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>{item.submitted_by_role || ''}</div>
                        {item.escalated_to_id && (
                          <div style={{ fontSize: '9px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', fontWeight: 'bold', marginTop: '4px', border: '1px solid rgba(245,158,11,0.3)' }}>
                            ⚠️ Escalated to AGM
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="rpt-cell-mono-dark">{item.sos_code || item.equipment_code || '—'}</span>
                      </td>
                      <td><span className="rpt-cell-text-dark">{item.equipment_name || item.module_name || '—'}</span></td>
                      <td><span className="rpt-cell-muted-dark" style={{ maxWidth: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.remarks || item.notes || item.description || '—'}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="rpt-export-btn"
                          onClick={() => openApprove(item)}
                          disabled={actionLoading === item.id}
                          style={{ padding: '4px 8px', fontSize: '10px', background: '#16a34a', color: '#fff', border: 'none', marginRight: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Approve</span>
                        </button>
                        <button
                          className="rpt-export-btn"
                          onClick={() => openReject(item)}
                          disabled={actionLoading === item.id}
                          style={{ padding: '4px 8px', fontSize: '10px', background: '#dc2626', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          <span>Reject</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={8}>
                    <div className="rpt-pagination-new">
                      <span className="rpt-pg-info-new">
                        Showing <strong>{pageItems.length}</strong> of <strong>{items.length}</strong> requests
                      </span>
                      <div className="rpt-pg-controls-new">
                        <button className="rpt-pg-btn-new" onClick={() => setPage(page - 1)} disabled={page === 1}>← Previous</button>
                        <span className="rpt-pg-current-new">Page {page} of {totalPages}</span>
                        <button className="rpt-pg-btn-new" onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next →</button>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── HIGHLY PROFESSIONAL APPROVAL REVIEW MODAL ── */}
      {modalMode && (selectedItem || ['bulkApprove', 'bulkReject'].includes(modalMode)) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="pa-light-modal" style={{ border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', width: modalMode === 'approve' ? '640px' : '400px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#3b82f6' }}>
                  {modalMode === 'approve' ? 'Verification & Checklist Review' : 
                   modalMode === 'reject' ? 'Reject Request' : 
                   modalMode === 'bulkApprove' ? 'Bulk Approve Requests' : 
                   modalMode === 'bulkReject' ? 'Bulk Reject Requests' : ''}
                </span>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: 800, fontFamily: 'monospace' }}>
                  {['bulkApprove', 'bulkReject'].includes(modalMode) ? `${selectedIds.length} Requests Selected` : (selectedItem?.sos_code || selectedItem?.equipment_code || '—')}
                </h3>
              </div>
              <button onClick={() => setModalMode(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="pa-drawer-body">
              {modalMode === 'approve' ? (
                // ... approve modal body is below

                <>
                  {/* Request Metadata Info Card */}
                  <div className="pa-meta-card" style={{ padding: '12px 14px' }}>
                    <div className="pa-meta-grid" style={{ gap: '12px' }}>
                      <div className="pa-meta-item">
                        <span className="pa-meta-label">Submitted By</span>
                        <span className="pa-meta-val" style={{ fontSize: '12px' }}>{selectedItem.submitted_by_name || selectedItem.inspector_name || selectedItem.user_name || 'Unknown'}</span>
                      </div>
                      <div className="pa-meta-item">
                        <span className="pa-meta-label">Module Type</span>
                        <span className="pa-meta-val" style={{ fontSize: '12px' }}>{selectedItem.equipment_name || selectedItem.module_name || '—'}</span>
                      </div>
                    </div>
                    {selectedItem.remarks && (
                      <div className="pa-meta-remarks" style={{ fontSize: '11px', marginTop: '8px', paddingTop: '8px' }}>
                        <strong>Inspector Remarks:</strong> "{selectedItem.remarks || selectedItem.notes || selectedItem.description}"
                      </div>
                    )}
                    {selectedItem.escalated_to_id && (
                      <div style={{ background: 'rgba(245,158,11,0.08)', borderTop: '1px dashed rgba(245,158,11,0.3)', padding: '10px 0 0 0', marginTop: '8px', fontSize: '11px', color: '#f59e0b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span><strong>⚠️ On-Leave Escalation Alert:</strong></span>
                        <span>This inspection was automatically escalated to the AGM on {fmt(selectedItem.escalated_at)} at {fmtTime(selectedItem.escalated_at)} because the assigned supervisor was on leave.</span>
                        <span><strong>Reason:</strong> "{selectedItem.escalation_reason || 'Supervisor unavailable'}"</span>
                      </div>
                    )}
                  </div>

                  {detailLoading ? (
                    <div className="pa-drawer-loading" style={{ padding: '30px 0' }}>
                      <div className="pa-drawer-spinner" />
                      <span style={{ fontSize: '12px' }}>Loading checklist details…</span>
                    </div>
                  ) : selectedItem._itemType === 'inspection' ? (
                    <>
                      {/* Score Dial & Chips */}
                      <div className="pa-score-summary" style={{ padding: '12px' }}>
                        <div className="pa-score-dial" style={{ width: '70px', height: '70px' }}>
                          <span className="pa-score-num" style={{ fontSize: '18px' }}>
                            {selectedItem.score !== undefined && selectedItem.score !== null
                              ? `${selectedItem.score}%`
                              : (detailedChecklist.length > 0 
                                  ? `${Math.round((detailedChecklist.filter(i => i.answer === 'Yes').length / detailedChecklist.length) * 100)}%`
                                  : '0%')}
                          </span>
                          <span className="pa-score-label" style={{ fontSize: '6px' }}>Pass Rate</span>
                        </div>
                        <div className="pa-score-details" style={{ gap: '8px' }}>
                          <div className="pa-score-chip" style={{ padding: '6px' }}>
                            <span>Passed</span>
                            <strong style={{ fontSize: '13px' }}>{detailedChecklist.filter(i => i.answer === 'Yes').length}</strong>
                          </div>
                          <div className="pa-score-chip" style={{ padding: '6px' }}>
                            <span>Failed</span>
                            <strong style={{ color: '#ef4444', fontSize: '13px' }}>{detailedChecklist.filter(i => i.answer === 'No').length}</strong>
                          </div>
                          <div className="pa-score-chip" style={{ padding: '6px' }}>
                            <span>Critical</span>
                            <strong style={{ color: '#f97316', fontSize: '13px' }}>{detailedChecklist.filter(i => i.is_critical && i.answer === 'No').length}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Checklist Questionnaire List */}
                      <div className="pa-checklist-container">
                        <h4 className="pa-section-heading" style={{ fontSize: '12px' }}>Checklist Questionnaire Responses</h4>
                        {detailedChecklist.length === 0 ? (
                          <div className="pa-empty-state" style={{ fontSize: '11px', color: '#64748b' }}>No responses found.</div>
                        ) : (
                          <div className="pa-checklist-list" style={{ gap: '8px' }}>
                            {detailedChecklist.map((item, idx) => {
                              const isFail = item.answer === 'No';
                              const isPass = item.answer === 'Yes';
                              return (
                                <div key={item.id || idx} className={`pa-checklist-card ${isFail ? 'fail' : ''} ${item.is_critical ? 'crit' : ''}`} style={{ padding: '10px 12px' }}>
                                  <div className="pa-checklist-card-top" style={{ gap: '10px' }}>
                                    <span className={`pa-checklist-num ${isFail ? 'fail' : ''}`} style={{ width: '18px', height: '18px', fontSize: '10px' }}>{idx + 1}</span>
                                    <p className="pa-checklist-question" style={{ fontSize: '11.5px' }}>{item.question}</p>
                                    <span className={`pa-ans-badge ${isPass ? 'pass' : isFail ? 'fail' : 'na'}`} style={{ padding: '2px 6px', fontSize: '9px' }}>
                                      {item.answer}
                                    </span>
                                  </div>
                                  {(item.remarks || item.is_critical) && (
                                    <div className="pa-checklist-card-bottom" style={{ paddingLeft: '28px', gap: '4px' }}>
                                      {item.is_critical && <span className="pa-crit-badge" style={{ width: 'fit-content', padding: '1px 4px', fontSize: '8px' }}>CRITICAL ITEM ⚠️</span>}
                                      {item.remarks && (
                                        <div className="pa-item-remark" style={{ padding: '4px 8px', fontSize: '10px' }}>
                                          <strong>Inspector remark:</strong> "{item.remarks}"
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Update data comparison */
                    <div className="pa-update-container">
                      <h4 className="pa-section-heading" style={{ fontSize: '12px' }}>Proposed Data Field Updates</h4>
                      <table className="pa-update-table" style={{ fontSize: '11px' }}>
                        <thead>
                          <tr>
                            <th>Field Name</th>
                            <th>Proposed Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getDisplayFields(selectedItem).length === 0 ? (
                            <tr>
                              <td colSpan={2} style={{ textAlign: 'center', color: '#94a3b8' }}>No updated fields found</td>
                            </tr>
                          ) : (
                            getDisplayFields(selectedItem).map(([key, val]) => (
                              <tr key={key}>
                                <td className="pa-update-key" style={{ padding: '8px 10px' }}>{key.replace(/_/g, ' ').toUpperCase()}</td>
                                <td className="pa-update-val" style={{ padding: '8px 10px' }}>{String(val)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Remarks Input */}
                  <div style={{ marginTop: '8px' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                      Reviewer Remarks (Optional)
                    </label>
                    <textarea
                      value={remarksInput}
                      onChange={e => setRemarksInput(e.target.value)}
                      placeholder="Add supervisor notes/remarks..."
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: '#fff', fontSize: '12px', minHeight: '60px', outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                </>
              ) : modalMode === 'reject' ? (
                <>
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ fontSize: '13px', color: '#e2e8f0', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                      You are about to reject the request for <strong style={{ color: '#fff' }}>{selectedItem?.sos_code || selectedItem?.equipment_code}</strong>. Please provide a clear reason for this rejection so the inspector can correct the issue.
                    </p>
                    <textarea
                      placeholder="Enter rejection reason here..."
                      value={rejectInput}
                      onChange={(e) => setRejectInput(e.target.value)}
                      style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(15,23,42,0.6)', color: '#fff', fontSize: '13px', resize: 'vertical', outline: 'none' }}
                      autoFocus
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px' }}>
                    <button onClick={() => setModalMode(null)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                    <button onClick={handleReject} disabled={actionLoading === selectedItem?.id} style={{ flex: 1, padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      {actionLoading === selectedItem?.id ? <div className="pa-drawer-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} /> : 'Confirm Rejection'}
                    </button>
                  </div>
                </>
              ) : modalMode === 'bulkApprove' ? (
                <>
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ fontSize: '14px', color: '#000', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                      Are you sure you want to approve all <strong style={{ color: '#000', fontSize: '16px' }}>{selectedIds.length}</strong> selected request(s)?
                    </p>
                    <div style={{ background: 'rgba(22, 163, 74, 0.1)', padding: '12px', borderRadius: '8px', border: '1px dashed rgba(22, 163, 74, 0.3)' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#000' }}>
                        This action will mark all selected requests as <strong>Successful</strong> and notify the respective inspectors.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px' }}>
                    <button onClick={() => setModalMode(null)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                    <button onClick={executeBulkApprove} style={{ flex: 1, padding: '10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      Confirm Bulk Approval
                    </button>
                  </div>
                </>
              ) : modalMode === 'bulkReject' ? (
                <>
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ fontSize: '13px', color: '#e2e8f0', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                      You are about to reject <strong style={{ color: '#fff' }}>{selectedIds.length}</strong> selected request(s). Please provide a common reason for these rejections.
                    </p>
                    <textarea
                      placeholder="Enter bulk rejection reason here..."
                      value={bulkRejectInput}
                      onChange={(e) => setBulkRejectInput(e.target.value)}
                      style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(15,23,42,0.6)', color: '#fff', fontSize: '13px', resize: 'vertical', outline: 'none' }}
                      autoFocus
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px' }}>
                    <button onClick={() => setModalMode(null)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                    <button onClick={executeBulkReject} style={{ flex: 1, padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      Confirm Bulk Rejection
                    </button>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer Actions */}
            {modalMode === 'approve' && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'rgba(255,255,255,0.01)' }}>
                <button 
                  onClick={() => setModalMode(null)}
                  style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading === selectedItem.id}
                  style={{ padding: '8px 18px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.target.style.background = '#15803d'}
                  onMouseLeave={e => e.target.style.background = '#16a34a'}
                >
                  {actionLoading === selectedItem.id ? 'Approving...' : 'Confirm & Approve'}
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
