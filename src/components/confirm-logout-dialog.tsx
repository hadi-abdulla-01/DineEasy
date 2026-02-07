'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/app/admin/auth-provider';
import { signInWithEmail } from '@/lib/auth';
import { LoaderCircle } from 'lucide-react';

interface ConfirmLogoutDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmLogoutDialog({ isOpen, onOpenChange }: ConfirmLogoutDialogProps) {
  const { user, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
        setPassword('');
        setError('');
        setIsLoading(false);
    }
    onOpenChange(open);
  }

  const handleConfirmLogout = async () => {
    if (user?.role !== 'Table') {
        logout();
        onOpenChange(false);
        return;
    }

    if (!user?.email || !password) {
      setError('Password is required.');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await signInWithEmail(user.email, password);

    if (result.success) {
      window.location.href = '/login?role=admin'; // Hard redirect to clear all state
    } else {
      setError(result.error || 'Incorrect password. Please try again.');
    }

    setIsLoading(false);
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleConfirmLogout();
  };

  if (!user) return null;

  const isTableUser = user.role === 'Table';

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Logout</DialogTitle>
          <DialogDescription>
            {isTableUser 
              ? 'For security, please enter your password to log out.'
              : 'Are you sure you want to log out?'}
          </DialogDescription>
        </DialogHeader>
        
        {isTableUser ? (
          <form onSubmit={handleFormSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="password-confirm">Password</Label>
                <Input
                  id="password-confirm"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Logout
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmLogout}>
              Logout
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
