'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

export function PasswordCell({ password }: { password?: string }) {
    const [showPassword, setShowPassword] = useState(false);

    if (!password) {
        return <Input readOnly value="N/A" disabled />;
    }

    return (
        <div className="relative">
            <Input readOnly value={showPassword ? password : '••••••••'} className="pr-10 font-mono" />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowPassword(!showPassword)}
            >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
            </Button>
        </div>
    );
}
