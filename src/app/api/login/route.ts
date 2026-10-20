import { NextResponse } from 'next/server';
import { signInWithEmail as serverSignInWithEmail } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();
        
        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required' },
                { status: 400 }
            );
        }
        
        const result = await serverSignInWithEmail(email, password);
        
        if (result.success && result.user) {
            return NextResponse.json(
                { success: true, user: result.user },
                { status: 200 }
            );
        } else {
            return NextResponse.json(
                { success: false, error: result.error || 'Login failed' },
                { status: 401 }
            );
        }
    } catch (error: any) {
        console.error('Login API error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'An error occurred during login' },
            { status: 500 }
        );
    }
}
