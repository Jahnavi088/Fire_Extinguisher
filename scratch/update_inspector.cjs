const fs = require('fs');
const file = 'c:/Jahnavi Data/Fire_Extinguisher/src/components/Dashboard/InspectorOverview.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update fetchInspectorData
const fetchOld = `const fetchInspectorData = async () => {
  const [reportsRaw] = await Promise.all([
    (async () => {
      const todayDate = new Date();
      const endDateStr = todayDate.toISOString().split('T')[0];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(todayDate.getDate() - 30);
      const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];
      return ApiService.getInspectionReports({ start_date: startDateStr, end_date: endDateStr }).catch(() => []);
    })()
  ]);

  const reportsList = Array.isArray(reportsRaw)
    ? reportsRaw
    : (reportsRaw?.items || reportsRaw?.reports || reportsRaw?.inspections || reportsRaw?.data || []);

  return { reportsList };
};`;

const fetchNew = `const fetchInspectorData = async ([_, userId]) => {
  const [reportsRaw, eqRaw] = await Promise.all([
    (async () => {
      const todayDate = new Date();
      const endDateStr = todayDate.toISOString().split('T')[0];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(todayDate.getDate() - 30);
      const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];
      return ApiService.getInspectionReports({ start_date: startDateStr, end_date: endDateStr, inspector_id: userId }).catch(() => []);
    })(),
    ApiService.getEquipment({ limit: 1000 }).catch(() => [])
  ]);

  const reportsList = Array.isArray(reportsRaw)
    ? reportsRaw
    : (reportsRaw?.items || reportsRaw?.reports || reportsRaw?.inspections || reportsRaw?.data || []);

  const eqList = Array.isArray(eqRaw) ? eqRaw : (eqRaw?.items || eqRaw?.data || []);

  return { reportsList, eqList };
};`;

content = content.replace(fetchOld, fetchNew);

// 2. Update useSWR hook to pass user.id
content = content.replace(
  `const { data, error, isLoading } = useSWR('inspector-overview', fetchInspectorData, {`,
  `const { data, error, isLoading } = useSWR(['inspector-overview', user?.id], fetchInspectorData, {`
);

// 3. Replace dummy variables
const dummyOld = `  // Reintroducing the static dummy data unused by fetcher
  const kpis = { todaysTasks: 8, completed: 5, pending: 2, overdue: 1, myCompliance: 90 };
  const todaysInspections = [
    { id: 1, name: 'Fire Extinguisher FE-101', area: 'Granulation Area', time: '09:00 AM', status: 'Completed', icon: '/images/fire_extinguisher1.png' },
    { id: 2, name: 'Sprinkler SP-201', area: 'Granulation Area', time: '10:00 AM', status: 'Completed', icon: '/images/sprinkler1.png' },
    { id: 3, name: 'Hose Reel HR-301', area: 'Compression Area', time: '11:00 AM', status: 'Pending', icon: '/images/hosereels1.png' },
    { id: 4, name: 'Emergency Light EL-12', area: 'Packing Area', time: '01:00 PM', status: 'Pending', icon: '/images/emergencylight1.png' },
    { id: 5, name: 'Smoke Detector SD-45', area: 'Packing Area', time: '02:00 PM', status: 'Overdue', icon: '/images/smoke_detector1.png' }
  ];`;

const dummyNew = `  const kpis = useMemo(() => {
    if (!data) return { todaysTasks: 0, completed: 0, pending: 0, overdue: 0, myCompliance: 100 };
    const { eqList, reportsList } = data;
    
    let todaysTasks = 0, pending = 0, overdue = 0;
    eqList.forEach(eq => {
      const st = (eq.status || '').toLowerCase();
      if (st === 'due-inspection' || st === 'due') todaysTasks += 1;
      else if (st === 'warning' || st === 'pending') pending += 1;
      else if (st === 'critical' || st === 'expired') overdue += 1;
    });

    let completed = 0;
    const inspectorIdStr = String(user?.id);
    reportsList.forEach(r => {
      if (String(r.user_id) === inspectorIdStr || String(r.inspector_id) === inspectorIdStr || r.user_name === user?.username) {
        const st = (r.status || r.approval_status || '').toLowerCase();
        if (st === 'approved' || st === 'completed' || st === 'done') completed += 1;
      }
    });

    const assigned = todaysTasks + pending + overdue + completed;
    const myCompliance = assigned > 0 ? Math.round((completed / assigned) * 100) : 100;

    return { todaysTasks, completed, pending, overdue, myCompliance };
  }, [data, user]);

  const todaysInspections = useMemo(() => {
    if (!data) return [];
    const { eqList } = data;
    const issues = eqList.filter(eq => {
      const st = (eq.status || '').toLowerCase();
      return st === 'due-inspection' || st === 'due' || st === 'warning' || st === 'pending' || st === 'critical' || st === 'expired';
    });
    
    return issues.map(eq => {
      const st = (eq.status || '').toLowerCase();
      let status = 'Pending';
      if (st === 'critical' || st === 'expired') status = 'Overdue';
      else if (st === 'due' || st === 'due-inspection') status = 'Due';
      
      return {
        id: eq.id || Math.random(),
        name: eq.name || eq.equipment_id || eq.type || 'Equipment',
        area: eq.location_name || 'Unassigned Area',
        time: 'Today',
        status,
        icon: null
      };
    });
  }, [data]);`;

content = content.replace(dummyOld, dummyNew);

fs.writeFileSync(file, content, 'utf8');
console.log("InspectorOverview successfully updated.");
