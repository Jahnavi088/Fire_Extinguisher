import { ApiService } from './apiService';
import { filterEquipmentByLocations } from '../utils/locationFilter';

// Module-level location filter config — set once from SafetyDashboard
let _userMappings = null;
let _userRole = null;

export const configureLocationFilter = (userMappings, userRole) => {
  _userMappings = userMappings || null;
  _userRole = userRole || null;
};

const applyLocationFilter = (items) => {
  // Filtering is now handled globally in ApiService.getEquipment
  // and ApiService.getEquipmentStatusReports.
  return items;
};

/**
 * Shared equipment fetcher used by all module stats components.
 *
 * - type 'all'    → /reports/equipment-status  (full fleet, rich report data)
 * - type 'active' → /equipment active + upcoming combined
 * - other types   → /equipment filtered by status
 *
 * Always returns { items: [...], total: number }
 */
export const fetchEquipmentByStatus = async (moduleId, type) => {
  if (type === 'all') {
    const data = await ApiService.getEquipmentStatusReports({ module_id: moduleId, limit: 1000 });
    const items = applyLocationFilter(data.items || []);
    return { items, total: items.length };
  }

  if (type === 'active') {
    const [activeData, upcomingData] = await Promise.all([
      ApiService.getEquipment({ module_id: moduleId, limit: 500, status: 'active' }),
      ApiService.getEquipment({ module_id: moduleId, limit: 500, status: 'upcoming' }),
    ]);
    const combined = [
      ...(activeData.items || []),
      ...(upcomingData.items || []),
    ];
    const items = applyLocationFilter(combined);
    return { items, total: items.length };
  }

  const data = await ApiService.getEquipment({ module_id: moduleId, limit: 500, status: type });
  const items = applyLocationFilter(data.items || []);
  return { items, total: items.length };
};
