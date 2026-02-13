

export type MealSession = {
    id: string;
    name: string; // e.g., "Breakfast", "Lunch", "Dinner"
    startTime: string; // Format: "HH:MM" (24-hour)
    endTime: string; // Format: "HH:MM" (24-hour)
    greeting: string; // e.g., "Good Morning", "Good Afternoon"
    displayMessage: string; // e.g., "Rise and shine! It's breakfast time"
    isActive: boolean;
};

export type PrintSize = 'a4' | 'thermal80mm' | 'custom';

export type PrintSettings = {
    invoicePrintSize: PrintSize;
    invoiceCustomWidth?: number;
    kitchenTicketPrintSize: PrintSize;
    kitchenTicketCustomWidth?: number;
    salesReportPrintSize?: PrintSize;
    salesReportCustomWidth?: number;
    invoiceFooterText?: string;
    invoiceTitle?: string;
    showInvoiceTitle?: boolean;
    showInvoiceFooter?: boolean;
    showRestaurantAddress?: boolean;
    showCustomerDetails?: boolean;
    itemHeaderFontSize?: number;
    itemBodyFontSize?: number;
    showLogoInInvoice?: boolean;
    showDineEzeeWatermark?: boolean;
    invoiceLogo?: string;
    restaurantPrintLogo?: string;
    showThankYouMessage?: boolean;
    invoiceThankYouMessage?: string;
};

export type DiscountType = 'percentage' | 'fixed';
export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
export type DiscountApplicability = 'all' | 'categories' | 'items';

export type Discount = {
  id: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number; // Percentage or fixed amount
  isActive: boolean;
  branchId: string;
  
  // Time-based rules
  startDate?: string;
  endDate?: string;
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  daysOfWeek?: DayOfWeek[];

  // Applicability rules
  applicability: DiscountApplicability;
  applicableCategories?: string[]; // applies if applicability is 'categories'
  applicableItems?: string[]; // Array of menuItemIds, applies if applicability is 'items'
};

export type POSSettings = {
    cashDenominations: number[];
    enableOnScreenKeyboard?: boolean;
    enableDineInOTP?: boolean;
};

export type RestaurantSettings = {
    restaurantName: string;
    restaurantAddress: string;
    currencySymbol: string;
    taxes: Tax[];
    currencyDecimalPlaces: number;
    timezone?: string; // IANA timezone identifier (e.g., 'Asia/Kolkata', 'UTC')
    endOfDayTime?: string; // Format: "HH:mm"
    taxName?: string; // e.g. "GSTIN", "VAT ID"
    taxNumber?: string; // The actual tax number
    qrCodeColor?: string;
    qrCodeBackgroundColor?: string;
    qrCodeLogo?: string;
    onlineOrderingEnabled?: boolean;
    deliveryFee?: number;
    minimumOrderValue?: number;
    onlineOrderPlatforms?: string[];
    invoiceSettings?: InvoiceSettings;
    printSettings?: PrintSettings;
    posSettings?: POSSettings;
    mealSessions?: MealSession[];
    menuCategories?: string[]; // Food categories like Meals, Snacks, Beverages, etc.
    multiFloorEnabled?: boolean;
    floors?: string[];
    defaultFloor?: string;
    discounts?: Discount[];
    manualSessionOverride?: {
        enabled: boolean;
        sessionId: string | null;
    };
    subscriptionPlanId?: string;
    billingStatus?: BillingStatus;
    nextBillingDate?: string;
};

export type Branch = {
    id: string;
    name: string;
    isMain: boolean;
} & Partial<RestaurantSettings>;


export type Table = {
    id: string;
    number: string;
    status: 'available' | 'occupied';
    position?: { x: number; y: number };
    branchId: string;
    restaurantId?: string;
    floor?: string;
    isDynamicQR?: boolean;
    qrToken?: string;
    pairingCode?: string;
    shape?: 'rectangle' | 'square' | 'circle';
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
    id: string;
    name: string;
    rate: number; // as a percentage
    amount: number;
}

export type CustomerDetails = {
    name: string;
    phone: string;
    address: string;
    platform: string;
};

export type Order = {
    id: string;
    invoiceNumber?: string;
    tableId?: string; // Optional for remote orders
    customerName: string;
    customerPhone: string;
    items: OrderItem[];
    status: OrderStatus;
    subtotal: number;
    discount?: number;
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
    table?: Table;
};

export type RemoteOrder = Omit<Order, 'tableId' | 'customerName' | 'customerPhone'> & {
    customerDetails: CustomerDetails;
};

export type UserRole = 'Admin' | 'Manager' | 'Server' | 'Captain' | 'Cashier' | 'Accountant' | 'Kitchen' | 'Table';

export type NavMenuKey =
    | 'dashboard' | 'pos' | 'tableOrder' | 'tables' | 'menu' | 'kitchen' | 'sales' | 'salesHistory'
    | 'onlineOrders' | 'takeAway' | 'userManagement' | 'menuPerformance' | 'employeePerformance' | 'peakHours' | 'display' | 'receiveOtp'
    // Settings Sub-sections
    | 'settingsRestaurant' | 'settingsBranches' | 'settingsGeneral' | 'settingsFloors'
    | 'settingsCategories' | 'settingsSessions' | 'settingsPos' | 'settingsOnline'
    | 'settingsInvoicing' | 'settingsPrinting' | 'settingsQr' | 'settingsPlatforms' | 'settingsDiscounts';


export type UserPermission = {
    view?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
};

export type UserPermissions = {
    [K in NavMenuKey]?: UserPermission;
};

export type AppUser = {
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
    isSuperAdmin?: boolean;
    assignedTableId?: string;
};


export type ActivityLog = {
    id: string;
    userId: string;
    username: string;
    action: string;
    details: string;
    timestamp: string;
};

export type Tax = {
    id: string;
    name: string;
    rate: number;
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

export type OTPRequest = {
  id: string;
  tableId: string;
  tableNumber: string;
  branchId: string;
  restaurantId: string;
  otp: string;
  customerName: string;
  customerPhone: string;
  createdAt: any; // Firestore Timestamp
};

export type BillingStatus = 'active' | 'trial' | 'overdue' | 'cancelled';

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: number; // In cents/smallest currency unit for accuracy
  currency: string; // e.g., 'USD', 'INR'
  description: string;
  permissions: UserPermissions;
};
