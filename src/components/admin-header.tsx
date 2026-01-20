import { Search, Bell, ChevronDown, Menu, X, LogOut, User } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/admin/auth-provider';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AdminHeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export default function AdminHeader({ isSidebarOpen, setIsSidebarOpen }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
    logout();
    router.push('/admin/login');
  };

  const getUserRole = () => {
    if (!user) return 'Admin';
    return user.role === 'Admin' ? 'Admin' : user.role === 'Kitchen' ? 'Chef' : user.role;
  };

  return (
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
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1 z-50">
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
          <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Bell className="text-[#CB1E1D]" size={24} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
