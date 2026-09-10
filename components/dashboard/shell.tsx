'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/logo';
import { NAV_ITEMS } from './nav';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, LogOut, Plus, ExternalLink } from 'lucide-react';
import { signOut } from '@/app/auth/actions';

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = item.match(pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarInner() {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo href="/dashboard" />
      </div>
      <div className="px-3">
        <Button asChild className="mb-4 w-full justify-start gap-2">
          <Link href="/dashboard/links/new">
            <Plus className="h-4 w-4" /> New Short Link
          </Link>
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-3">
        <NavLinks />
      </div>
      <div className="p-3">
        <div className="rounded-xl bg-sidebar-accent/60 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Phase 1 · MVP</p>
          <p className="mt-0.5">Bitly-style links + Linktree-style bio pages.</p>
        </div>
      </div>
    </div>
  );
}

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { email: string; name: string; avatar_url: string | null };
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = (user.name || user.email || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar lg:block">
        <SidebarInner />
      </aside>

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-white/70 px-4 backdrop-blur-xl sm:px-6">
          <div className="lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="h-full" onClick={() => setMobileOpen(false)}>
                  <SidebarInner />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="flex-1" />
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/" target="_blank">
              <ExternalLink className="h-4 w-4" /> <span className="hidden sm:inline">View site</span>
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full outline-none ring-ring focus-visible:ring-2">
                <Avatar className="h-9 w-9">
                  {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="font-medium">{user.name || 'Account'}</div>
                <div className="truncate text-xs font-normal text-muted-foreground">{user.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <form action={signOut}>
                <button type="submit" className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-secondary">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
