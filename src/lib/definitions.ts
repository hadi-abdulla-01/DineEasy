

export type MealSession = {
    id: string;
    name: string; // e.g., "Breakfast", "Lunch", "Dinner"
    startTime: string; // Format: "HH:MM" (24-hour)
    endTime: string; // Format: "HH:MM" (24-hour)
    greeting: string; // e.g., "Good Morning", "Good Afternoon"
    displayMessage: string; // e.g., "Rise and shine! It's breakfast time"
    isActive: boolean;
};

export type RestaurantSettings = {
    restaurantName: string;
    restaurantAddress: string;
    currencySymbol: string;
    taxes: Tax[];
    currencyDecimalPlaces: number;
    timezone?: string; // IANA timezone identifier (e.g., 'Asia/Kolkata', 'UTC')
    qrCodeColor?: string;
    qrCodeBackgroundColor?: string;
    qrCodeLogo?: string;
    onlineOrderingEnabled?: boolean;
    deliveryFee?: number;
    minimumOrderValue?: number;
    onlineOrderPlatforms?: string[];
    invoiceSettings?: InvoiceSettings;
    printSettings?: PrintSettings;
    mealSessions?: MealSession[];
    manualSessionOverride?: {
        enabled: boolean;
        sessionId: string | null; // null when disabled or no session selected
    };
    menuCategories?: string[]; // Food categories like Meals, Snacks, Beverages, etc.
};

export type Branch = {
    id: string;
    name: string;
    isMain: boolean;
} & Partial<RestaurantSettings>;


export type Table = {
    id: string;
    number: number;
    status: 'available' | 'occupied';
    position?: { x: number; y: number };
    branchId: string;
    restaurantId?: string;
};

export type AddonOption = {
    id: string; // Unique ID for the option
    name: string; // The name of the addon item, typed by the user
    price: number; // The price of the addon. 0 for free.
};

export type AddonGroup = {
    id: string; // Unique ID for the group
    title: string;
    isRequired: boolean;
    options: AddonOption[];
};

export type SelectedAddon = {
    groupTitle: string;
    optionName: string;
};

export type MenuItemIngredient = {
    name: string;
    icon: string;
}

export type MenuItem = {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageId: string;
    isAvailable: boolean;
    isAddon?: boolean;
    addons?: string[];
    addonGroups?: AddonGroup[];
    prepTime?: number; // in minutes
    nutrition?: {
        carbs: string;
        protein: string;
        kcal: string;
        fats: string;
    };
    ingredients?: MenuItemIngredient[];
    isBestSeller?: boolean; // Mark as best seller
    isRecommended?: boolean; // Mark as recommended
    recommendationNote?: string; // Note like "Our Special", "Chef's Choice"
    availableSessions?: string[]; // Array of session IDs this item is available in
    branchId: string;
};

export type OrderItem = {
    orderItemId: string;
    menuItemId: string;
    quantity: number;
    name: string;
    price: number;
    category: string;
    isReady: boolean;
    notes?: string;
    selectedAddons?: SelectedAddon[];
    status?: 'active' | 'cancelled';
};

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type OrderType = 'Dine-in' | 'Online' | 'Take-away';

export type AppliedTax = {
    name: string;
    rate: number;
    amount: number;
}

export type Order = {
    id: string;
    invoiceNumber?: string;
    tableId: string;
    customerName: string;
    customerPhone: string;
    items: OrderItem[];
    status: OrderStatus;
    subtotal: number;
    taxes: AppliedTax[];
    totalTaxAmount: number;
    total: number;
    createdAt: string;
    orderType: OrderType;
    notes?: string;
    paymentMethod?: 'cash' | 'card';
    takeAwayTime?: string;
    branchId: string;
    createdByName?: string;
};

export type CustomerDetails = {
    name: string;
    phone: string;
    address: string;
    platform: string;
};

export type RemoteOrder = {
    id: string;
    invoiceNumber?: string;
    orderType: 'Online' | 'Take-away';
    customerDetails: CustomerDetails;
    items: OrderItem[];
    subtotal: number;
    taxes: AppliedTax[];
    totalTaxAmount: number;
    total: number;
    createdAt: string;
    paymentMethod?: 'cash' | 'card';
    branchId: string;
    createdByName?: string;
};

export type UserRole = 'Admin' | 'Manager' | 'Server' | 'Kitchen';

export type NavMenuKey = 'dashboard' | 'tableOrder' | 'tables' | 'menu' | 'kitchen' | 'sales' | 'salesHistory' | 'onlineOrders' | 'takeAway' | 'userManagement' | 'settings';

export type UserPermission = {
    view?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
};

export type UserPermissions = {
    [K in NavMenuKey]?: UserPermission;
};

export type KitchenUser = {
    id: string;
    username: string;
    email?: string; // Email for Firebase Authentication
    firebaseUid?: string; // Firebase Auth UID
    password: string; // In a real app, this should be hashed (kept for backward compatibility)
    categories: string[];
    role: UserRole;
    branchId: string;
    restaurantId?: string;
    accessibleMenus?: NavMenuKey[]; // Will be deprecated
    permissions?: UserPermissions;
};

export type InvoiceSettings = {
    useUnifiedNumbering: boolean;
    unified: {
        prefix: string;
        nextNumber: number;
    };
    dineIn: {
        prefix: string;
        nextNumber: number;
    };
    online: {
        prefix: string;
        nextNumber: number;
    };
    takeAway: {
        prefix: string;
        nextNumber: number;
    };
};

export type Tax = {
    id: string;
    name: string;
    rate: number; // as a percentage
}

export type PrintSize = 'a4' | 'thermal80mm' | 'custom';

export type PrintSettings = {
    invoicePrintSize: PrintSize;
    invoiceCustomWidth?: number;
    kitchenTicketPrintSize: PrintSize;
    kitchenTicketCustomWidth?: number;
};

export type ActivityLog = {
    id: string;
    userId: string;
    username: string;
    action: string;
    details: string;
    timestamp: string;
};
