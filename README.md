# 🍽️ DineEzee - Restaurant Management System

A comprehensive, multi-tenant restaurant management platform with QR code ordering, POS system, kitchen display, and mobile app integration.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Setup](#-environment-setup)
- [Firebase Configuration](#-firebase-configuration)
- [Project Structure](#-project-structure)
- [Key Features](#-key-features)
- [User Roles](#-user-roles)
- [Mobile App](#-mobile-app)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## ✨ Features

### Customer Features
- 📱 **QR Code Ordering** - Scan QR codes at tables for instant menu access
- 🍔 **Digital Menu** - Browse categorized menu items with images and descriptions
- 🛒 **Cart Management** - Add items, customize orders, and manage cart
- 💳 **Multiple Payment Options** - Cash, Card, UPI, and Online payments
- 📍 **Order Tracking** - Real-time order status updates
- 🌙 **Dark Mode** - Comfortable viewing in any lighting

### Restaurant Management
- 🖥️ **POS System** - Complete point-of-sale for dine-in, takeaway, and online orders
- 🍳 **Kitchen Display** - Real-time order management for kitchen staff
- 📊 **Dashboard** - Comprehensive analytics and reporting
- 🪑 **Table Management** - Visual table layout with status tracking
- 👥 **User Management** - Role-based access control
- ⚙️ **Settings** - Customizable restaurant settings, menu, and pricing

### Admin Features
- 🏢 **Multi-tenant Support** - Manage multiple restaurant locations
- 📈 **Sales Reports** - Detailed sales analytics and history
- 🧾 **Invoice Generation** - Automatic invoice creation with customization
- 🔔 **Real-time Notifications** - Order updates and alerts
- 📱 **Mobile App Integration** - Flutter mobile app for kitchen staff

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.5.9 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Backend
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Functions**: Firebase Cloud Functions
- **Hosting**: Vercel (recommended)

### Mobile App
- **Framework**: Flutter
- **State Management**: Provider
- **Local Storage**: Hive
- **Notifications**: Firebase Cloud Messaging

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dineezee.git
   cd dineezee
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Configuration (Client-side)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

   # Firebase Admin Configuration (Server-side)
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account", ...}

   # App Configuration
   NEXT_PUBLIC_SUPER_ADMIN_EMAIL=your-super-admin@example.com
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

##  Environment Setup

### Firebase Project Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore Database
   - Enable Authentication (Email/Password)
   - Enable Storage

2. **Get Firebase Configuration**
   - Go to Project Settings → General
   - Scroll to "Your apps" → Web app
   - Copy the configuration values to your `.env.local` file (prefixed with `NEXT_PUBLIC_`).

3. **Set up Firebase Admin SDK**
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Copy the entire contents of the downloaded JSON file and set it as the value for `FIREBASE_SERVICE_ACCOUNT_KEY` in your `.env.local` file. It should be a single line string.

4. **Deploy Cloud Functions**
   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   ```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Restaurant data
    match /restaurants/{restaurantId} {
      allow read: if true;
      allow write: if request.auth != null;
      
      // Orders
      match /orders/{orderId} {
        allow read: if true;
        allow create: if true;
        allow update: if request.auth != null;
      }
      
      // Remote orders
      match /remoteOrders/{orderId} {
        allow read: if true;
        allow create: if true;
        allow update: if request.auth != null;
      }
    }
  }
}
```

---

## 📁 Project Structure

```
dineezee/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── admin/             # Admin panel pages
│   │   ├── kitchen/           # Kitchen display pages
│   │   ├── login/             # Authentication pages
│   │   └── order/             # Customer ordering pages
│   ├── components/            # React components
│   │   ├── ui/               # UI components (shadcn)
│   │   ├── admin-sidebar.tsx
│   │   ├── logo.tsx
│   │   └── ...
│   ├── lib/                   # Utility functions
│   │   ├── actions.ts        # Server actions
│   │   ├── data.ts           # Data fetching
│   │   └── definitions.ts    # TypeScript types
│   └── firebase/             # Firebase configuration
├── functions/                 # Firebase Cloud Functions
├── dine_easy_mobile/         # Flutter mobile app
├── public/                   # Static assets
└── .env.local               # Environment variables
```

---

## 🎯 Key Features

### 1. QR Code Ordering System
- Generate unique QR codes for each table
- Customers scan to access menu
- Real-time order submission to kitchen
- Order status tracking

### 2. POS (Point of Sale) System
- Create dine-in, takeaway, and online orders
- Split bills and apply discounts
- Multiple payment methods
- Print receipts

### 3. Kitchen Display System
- Real-time order notifications
- Order status management (Received → Preparing → Ready → Completed)
- Sound alerts for new orders
- Mobile app integration

### 4. Multi-tenant Architecture
- Support multiple restaurant locations
- Separate data per restaurant
- Branch-specific user permissions
- Centralized super admin panel

### 5. Analytics & Reporting
- Daily, weekly, monthly sales reports
- Revenue tracking
- Popular items analysis
- Order history

---

##  User Roles

### Super Admin
- Full system access
- Create and manage restaurants
- View all analytics
- System configuration

### Admin
- Restaurant-level access
- Manage menu and pricing
- View sales reports
- User management

### Kitchen User
- View incoming orders
- Update order status
- Kitchen-specific permissions

### Customer
- Browse menu
- Place orders
- Track order status
- Make payments

---

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variables**
   - Go to Vercel Dashboard
   - Project Settings → Environment Variables
   - Add all variables from your `.env.local` file. Make sure to set `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` to your desired super admin email address.

### Firebase Hosting (Alternative)

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

---

## 🔐 Authentication

### Login Credentials


**Restaurant Admin:**
- Email: `admin@{restaurantId}.dineezee`
- Password: Set during restaurant creation

**Kitchen User:**
- Email: Set by admin
- Password: Set by admin

---

## 🎨 Customization

### Branding
- Logo: Update `src/components/logo.tsx`
- Colors: Modify Tailwind config in `tailwind.config.ts`
- Theme: Adjust in `src/app/globals.css`

### Menu Categories
- Configure in Admin Panel → Settings → Categories
- Add custom icons using Lucide React

### Payment Methods
- Configure in Admin Panel → Settings → General
- Enable/disable payment options

---

## 📝 Common Tasks

### Add a New Restaurant
1. Login as Super Admin
2. Navigate to Super Admin Panel
3. Click "Add Restaurant"
4. Fill in details and submit

### Create Menu Items
1. Login as Admin
2. Go to Menu Management
3. Click "Add Item"
4. Upload image, set price, and category

### Generate Table QR Codes
1. Go to Settings → QR Code
2. Select table
3. Download QR code
4. Print and place on table

---

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run dev
```

### Firebase Connection Issues
- Verify `.env.local` credentials
- Check Firebase project settings
- Ensure Firestore is enabled

### Mobile App Issues
```bash
# Flutter clean and rebuild
flutter clean
flutter pub get
flutter run
```

---

## 📄 License

This project is licensed under the MIT License.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

For support, email dineezee@gmail.com or open an issue on GitHub.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Backend powered by [Firebase](https://firebase.google.com/)

---

**Made with ❤️ by the DineEzee Team**
