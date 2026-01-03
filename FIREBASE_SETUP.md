# Firebase Authentication Setup

## Environment Variables Required

Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Super Admin Configuration
SUPER_ADMIN_EMAIL=your-email@gmail.com
```

## Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create a new one)
3. Click on the gear icon ⚙️ > Project Settings
4. Scroll down to "Your apps" section
5. Click on the web app icon `</>`
6. Copy the configuration values to your `.env.local` file

## Setting Up Super Admin

1. In Firebase Console, go to Authentication > Sign-in method
2. Enable "Email/Password" provider
3. Go to Authentication > Users
4. Click "Add User"
5. Enter your email (same as SUPER_ADMIN_EMAIL in .env.local)
6. Set a strong password
7. Click "Add User"

## Email Format Convention

- **Super Admin**: Your actual email (e.g., `admin@company.com`)
- **Restaurant Admin**: `admin@{restaurantid}.dineezee`
- **Kitchen Users**: `{username}@{restaurantid}.dineezee`

## First Time Setup

1. Set up environment variables
2. Create super admin account in Firebase
3. Run `npm run dev`
4. Login with super admin credentials
5. Access super admin panel at `/admin/superadmin`
6. Create your first restaurant

## See Also

- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Complete migration guide
- [FIREBASE_AUTH_MIGRATION.md](./FIREBASE_AUTH_MIGRATION.md) - Technical migration plan
