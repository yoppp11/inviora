'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, LayoutDashboard, Menu } from 'lucide-react';
import { InvioraLogo } from '@/components/brand/inviora-logo';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAdmin, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="space-y-4 w-full max-w-xs">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
  ].filter((item) => item.show);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard" className="shrink-0">
              <InvioraLogo size="sm" className="sm:[&_span]:text-xl" />
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={pathname === item.href ? 'secondary' : 'ghost'}
                    size="sm"
                    className="gap-1.5"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
              {user.role === 'ADMIN' ? 'Admin' : 'Event Owner'}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="sm" className="gap-2 max-w-[160px]" />}
              >
                <User className="h-4 w-4 shrink-0" />
                <span className="truncate hidden sm:inline">{user.name}</span>
                <Menu className="h-4 w-4 md:hidden" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.href} onClick={() => router.push(item.href)}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    router.push('/auth/login');
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-4 sm:py-6 max-w-6xl">{children}</main>
    </div>
  );
}
