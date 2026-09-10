import {
  LayoutDashboard,
  Link2,
  LayoutTemplate,
  BarChart3,
  Settings,
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  match: (path: string) => boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, match: (p) => p === '/dashboard' },
  { label: 'Short Links', href: '/dashboard/links', icon: Link2, match: (p) => p.startsWith('/dashboard/links') },
  { label: 'Bio Pages', href: '/dashboard/pages', icon: LayoutTemplate, match: (p) => p.startsWith('/dashboard/pages') },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, match: (p) => p.startsWith('/dashboard/analytics') },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, match: (p) => p.startsWith('/dashboard/settings') },
];
