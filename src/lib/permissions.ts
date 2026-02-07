

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
    { key: 'display', label: 'QR Display Screen', rights: ['view'] },
    { key: 'receiveOtp', label: 'Receive Dine-in OTPs', rights: ['view']},
    // Granular Settings
    { key: 'settingsRestaurant', label: 'Settings: Restaurant', rights: ['view', 'edit']},
    { key: 'settingsBranches', label: 'Settings: Branches', rights: ['view', 'create', 'edit', 'delete']},
    { key: 'settingsGeneral', label: 'Settings: General', rights: ['view', 'edit']},
    { key: 'settingsFloors', label: 'Settings: Floors', rights: ['view', 'edit']},
    { key: 'settingsCategories', label: 'Settings: Categories', rights: ['view', 'edit']},
    { key: 'settingsSessions', label: 'Settings: Sessions', rights: ['view', 'edit']},
    { key: 'settingsPos', label: 'Settings: POS', rights: ['view', 'edit']},
    { key: 'settingsDiscounts', label: 'Settings: Discounts', rights: ['view', 'create', 'edit', 'delete']},
    { key: 'settingsOnline', label: 'Settings: Online Orders', rights: ['view', 'edit']},
    { key: 'settingsInvoicing', label: 'Settings: Invoicing', rights: ['view', 'edit']},
    { key: 'settingsPrinting', label: 'Settings: Printing', rights: ['view', 'edit']},
    { key: 'settingsQr', label: 'Settings: QR Code', rights: ['view', 'edit']},
    { key: 'settingsPlatforms', label: 'Settings: Platforms', rights: ['view', 'edit']},
];
