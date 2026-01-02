import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/server';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json(
                { success: false, message: 'Restaurant code is required' },
                { status: 400 }
            );
        }

        // 1. Initialize Firebase (Server-side instance)
        const { firestore } = initializeFirebase();

        // 2. Query the 'restaurant_codes' collection
        // We assume the document ID is the code itself (e.g. 'PIZZA2024')
        // This makes lookup very fast and ensures uniqueness.
        const codeDocRef = doc(firestore, 'restaurant_codes', code.toUpperCase());
        const codeDoc = await getDoc(codeDocRef);

        if (!codeDoc.exists()) {
            return NextResponse.json(
                { success: false, message: 'Invalid restaurant code' },
                { status: 404 }
            );
        }

        const data = codeDoc.data();

        // 3. Return the configuration
        return NextResponse.json({
            success: true,
            restaurantId: data.restaurantId,
            restaurantName: data.restaurantName,
            firebaseConfig: data.firebaseConfig,
        });

    } catch (error) {
        console.error('Error validating restaurant code:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
