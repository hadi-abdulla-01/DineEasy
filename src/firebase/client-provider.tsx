'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, LoaderCircle } from 'lucide-react';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<ReturnType<typeof initializeFirebase> | null>(null);
  const [initError, setInitError] = useState<Error | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const services = initializeFirebase();
        setFirebaseServices(services);
      } catch (e) {
        if (e instanceof Error) {
            setInitError(e);
        } else {
            setInitError(new Error('An unknown error occurred during Firebase initialization.'));
        }
      } finally {
        setIsInitializing(false);
      }
    }
  }, []);

  if (initError) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background p-8">
            <Alert variant="destructive" className="max-w-2xl">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Firebase Configuration Error</AlertTitle>
                <AlertDescription>
                    <p className="mb-2 font-medium">The application could not connect to Firebase.</p>
                    <p className="text-sm mb-4"><strong>Details:</strong> {initError.message}</p>
                    <h3 className="font-bold mb-2">How to Fix:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Locate or create a file named <code>.env.local</code> in the root of your project directory.</li>
                        <li>If it exists, ensure it contains your Firebase project's configuration variables.</li>
                        <li>You can find these variables in your Firebase project settings under "Your apps" &gt; Web app config.</li>
                        <li>Make sure the variable names start with <code>NEXT_PUBLIC_</code>.</li>
                        <li>Restart your development server after making changes.</li>
                    </ol>
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  if (isInitializing) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg text-muted-foreground">Connecting to Firebase...</p>
            </div>
        </div>
    );
  }
  
  if (!firebaseServices) {
    // This case should ideally not be hit if error handling is correct, but as a fallback.
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background p-8">
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Initialization Failed</AlertTitle>
                <AlertDescription>
                    Firebase could not be initialized, and no specific error was caught. Please check the console for more details.
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
