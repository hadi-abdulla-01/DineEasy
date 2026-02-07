'use client';

import { Search, Bell, ChevronDown, Menu, X, LogOut, User, ShoppingCart, KeyRound } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/admin/auth-provider';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useRestaurantData } from '@/lib/client-data';
import { useFirebase } from '@/firebase/provider';
import { collection, query, where, onSnapshot, type Timestamp } from 'firebase/firestore';
import type { Order, OTPRequest } from '@/lib/definitions';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmLogoutDialog } from './confirm-logout-dialog';

interface AdminHeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

type AppNotification = {
  id: string;
  type: 'order' | 'otp';
  title: string;
  body: string;
  createdAt: string;
  href: string;
  icon: React.ReactNode;
};

export default function AdminHeader({ isSidebarOpen, setIsSidebarOpen }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);


  const { restaurantId } = useRestaurantData();
  const { firestore } = useFirebase();

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && "Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  // Listen for new orders
  useEffect(() => {
    if (!firestore || !user || !restaurantId) return;

    const initialOrdersLoadDone = { current: false };

    const isGlobalAdmin = (user?.role === 'Admin' && !user?.branchId) || user?.isSuperAdmin;
    const ordersRef = collection(firestore, 'restaurants', restaurantId, 'orders');

    let q = query(ordersRef, where('status', '==', 'received'));
    if (!isGlobalAdmin && user.branchId) {
      q = query(q, where('branchId', '==', user.branchId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!initialOrdersLoadDone.current) {
        initialOrdersLoadDone.current = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docData = change.doc.data();
          const createdAtTimestamp = docData.createdAt as Timestamp;

          const newOrder = {
            id: change.doc.id,
            ...docData,
            createdAt: createdAtTimestamp?.toDate ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
          } as Order;

          const newNotification: AppNotification = {
            id: newOrder.id,
            type: 'order',
            title: `New ${newOrder.orderType} Order`,
            body: `${newOrder.customerName} - #${newOrder.invoiceNumber || newOrder.id.slice(-4)}`,
            createdAt: newOrder.createdAt,
            href: '/admin/kitchen',
            icon: <ShoppingCart className="h-4 w-4" />
          };

          setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
          setUnreadCount(prev => prev + 1);

          if (Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.body,
              icon: '/logo.svg',
            });
          }
        }
      });
    });

    return () => unsubscribe();
  }, [firestore, user, restaurantId]);

  // Listen for new OTP requests
  useEffect(() => {
    if (!firestore || !user || !restaurantId || !user.permissions?.receiveOtp?.view) return;

    const initialOtpsLoadDone = { current: false };

    const otpRequestsRef = collection(firestore, `restaurants/${restaurantId}/otpRequests`);
    let q = query(otpRequestsRef);

    const isGlobalAdmin = (user?.role === 'Admin' && !user?.branchId) || user?.isSuperAdmin;
    if (!isGlobalAdmin && user.branchId) {
      q = query(q, where('branchId', '==', user.branchId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!initialOtpsLoadDone.current) {
        initialOtpsLoadDone.current = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const otpRequest = change.doc.data() as OTPRequest;
          const createdAtTimestamp = otpRequest.createdAt as Timestamp;

          const newNotification: AppNotification = {
            id: change.doc.id,
            type: 'otp',
            title: `OTP for Table ${otpRequest.tableNumber}`,
            body: `Code: ${otpRequest.otp} for ${otpRequest.customerName}`,
            createdAt: createdAtTimestamp?.toDate ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
            href: '#', // OTP notifications are not clickable for navigation
            icon: <KeyRound className="h-4 w-4" />
          };

          setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
          setUnreadCount(prev => prev + 1);

          // Show browser notification
          if (Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.body,
              icon: '/logo.svg',
            });
          }
        }
      });
    });

    return () => unsubscribe();
  }, [firestore, user, restaurantId]);


  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const getUserRole = () => {
    if (!user) return 'Admin';
    return user.role === 'Admin' ? 'Admin' : user.role === 'Kitchen' ? 'Chef' : user.role;
  };

  return (
    <>
      <header className={cn("bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 transition-colors", "print:hidden")}>
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          {/* Left: Mobile Menu + Logo/User */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-1 transition-colors"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden relative bg-gray-800 dark:bg-gray-700 flex items-center justify-center">
                  <User className="text-white" size={24} />
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="font-medium text-lg dark:text-gray-100">{user?.username || 'Admin'}</span>
                  <ChevronDown
                    size={20}
                    className={`text-gray-500 dark:text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1 z-50">
                  <div className="px-4 py-2 border-b dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.username || 'User'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{getUserRole()}</p>
                  </div>
                  <Link href={`/admin/profile/edit`} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <User size={16} />
                    <span>My Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Center: Search (hidden for now) */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          </div>

          {/* Right: Notifications */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu onOpenChange={(open) => { if (open) setUnreadCount(0); }}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative w-9 h-9">
                  <Bell className="text-[#CB1E1D]" size={24} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <DropdownMenuItem key={notification.id} className="cursor-pointer" onSelect={() => notification.href !== '#' && router.push(notification.href)}>
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary p-2 rounded-full">
                          {notification.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {notification.body}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="text-center text-sm text-muted-foreground p-4">
                    No new notifications.
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <ConfirmLogoutDialog
        isOpen={isLogoutConfirmOpen}
        onOpenChange={setIsLogoutConfirmOpen}
      />
    </>
  );
}
