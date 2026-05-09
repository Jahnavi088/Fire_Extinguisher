/**
 * Shared sorting logic for fleet dashboards.
 * Supports strings, numbers, and dates.
 */
export const sortItems = (items, sortConfig) => {
  if (!sortConfig.key) return items;

  return [...items].sort((a, b) => {
    let aVal, bVal;

    // Handle special building_dept composite key
    if (sortConfig.key === 'building_dept') {
      aVal = [a.building_name, a.department_name].filter(Boolean).join(' · ');
      bVal = [b.building_name, b.department_name].filter(Boolean).join(' · ');
    } else {
      aVal = a[sortConfig.key];
      bVal = b[sortConfig.key];
    }

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    // Numeric Sort (readiness_score)
    if (sortConfig.key === 'readiness_score') {
      const aNum = parseFloat(aVal) || 0;
      const bNum = parseFloat(bVal) || 0;
      if (aNum < bNum) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aNum > bNum) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    }

    // Date Sort
    if (sortConfig.key === 'next_inspection_due' || sortConfig.key.includes('date')) {
      const aDate = new Date(aVal).getTime() || 0;
      const bDate = new Date(bVal).getTime() || 0;
      if (aDate < bDate) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aDate > bDate) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    }

    // Alphanumeric Sort
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();

    if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
};
