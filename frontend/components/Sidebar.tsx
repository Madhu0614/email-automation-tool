'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Mail,
  Upload,
  Settings,
  Target,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Sidebar navigation config
const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Upload Lists', href: '/upload', icon: Upload },
  { name: 'Email Config', href: '/config', icon: Settings },
  { name: 'Campaigns', href: '/campaigns', icon: Target },
  { name: 'Analytics', href: '/analytics', icon: Mail },
];
type NavItemProps = {
  item: {
    name: string;
    href: string;
    icon: React.ElementType;
  };
  isActive: boolean;
  onAction: () => void;
};
function NavItem({ item, isActive, onAction }: NavItemProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const Icon = item.icon;

  return (
    <div className="relative flex items-center justify-center w-full">
      <Link
        href={item.href}
        aria-label={item.name}
        onClick={onAction}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={cn(
          'group flex items-center justify-center w-12 h-12 mx-auto rounded-lg transition-colors duration-200 relative',
          isActive
            ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg'
            : 'text-gray-400 hover:text-blue-600 hover:bg-gray-700'
        )}
        tabIndex={0}
      >
        <motion.div
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Icon className="w-6 h-6" />
        </motion.div>

        <AnimatePresence>
          {showTooltip && (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-gray-900 px-3 py-1 text-xs font-medium text-white shadow-lg z-50"
            >
              {item.name}
            </motion.span>
          )}
        </AnimatePresence>

        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1.5 rounded-r-lg bg-blue-500 shadow-md" />
        )}
      </Link>
    </div>
  );
}

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const SidebarContent = (
    <div className="flex flex-col items-center h-full justify-between pb-6">
      {/* Logo */}
      <div className="mt-6 flex items-center justify-center h-16">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
          <Mail className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-3 mt-8">
        {navigation.map((item) => (
          <NavItem
            key={item.name}
            item={item}
            isActive={pathname === item.href}
            onAction={() => setIsMobileMenuOpen(false)}
          />
        ))}
      </nav>

      {/* Profile Avatar */}
      <div className="mb-6">
        <button
          aria-label="User Profile"
          className="w-12 h-12 rounded-full bg-green-200 border-2 border-white flex items-center justify-center text-green-900 font-semibold text-lg shadow-md hover:ring-2 hover:ring-green-400 transition"
          onClick={() => alert('Profile clicked!')}
        >
          M
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-[100]">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-white shadow-md border hover:bg-gray-100 transition"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden fixed inset-0 bg-black z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isMobileMenuOpen ? 0 : '-100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-16 bg-[#171c2b] border-r border-gray-900/20 shadow-md flex flex-col justify-between',
          'transition-transform lg:translate-x-0 lg:static lg:inset-auto'
        )}
        style={{ minWidth: '4rem', maxWidth: '4rem' } as React.CSSProperties}
      >
        {SidebarContent}
      </motion.aside>
    </>
  );
}