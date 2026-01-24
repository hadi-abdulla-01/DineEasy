
import type { NavMenuKey } from './definitions';

export const ALL_PERMISSIONS_CONFIG: {key: NavMenuKey, label: string, rights: ('view' | 'create' | 'edit' | 'delete')[]}[] = [
    { key: 'dashboard', label: 'Dashboard', rights: ['view'] },
    { key: 'pos', label: 'POS Screen', rights: ['view'] },
    { key: 'tableOrder', label: 'Table Order', rights: ['view'] },
    { key: 'tables', label: 'Table Management', rights: ['view', 'create', 'edit', 'delete'] },
    { key: 'menu', label: 'Menu Management', rights: ['view', 'create', 'edit', 'delete'] },
    { key: 'kitchen', label: 'Kitchen View', rights: ['view'] },
    { key: 'sales', label: 'Sales Report', rights: ['view'] },
    { key: 'salesHistory', label: 'Sales History', rights: ['view', 'edit', 'delete'] },
    { key: 'menuPerformance', label: 'Menu Performance', rights: ['view'] },
    { key: 'employeePerformance', label: 'Employee Performance', rights: ['view'] },
    { key: 'peakHours', label: 'Peak Hours', rights: ['view'] },
    { key: 'onlineOrders', label: 'Online Orders', rights: ['view', 'create'] },
    { key: 'takeAway', label: 'Take Away', rights: ['view', 'create'] },
    { key: 'userManagement', label: 'User Management', rights: ['view', 'create', 'edit', 'delete'] },
    { key: 'settings', label: 'Settings', rights: ['view', 'edit'] },
];
