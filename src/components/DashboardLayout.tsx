/**
 * DashboardLayout.tsx
 *
 * 3D Glassmorphism Dashboard Layout
 * - Glass cube background image
 * - Glassmorphism header
 * - Ambient light effects
 */

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();

  const getUserInitial = () => {
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative">
        {/* ===== Background Layers ===== */}
        
        {/* Base gradient */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, 
              #C8CCD4 0%, 
              #D4D8E0 20%, 
              #CDD1D9 45%, 
              #C5C9D2 70%, 
              #D0D4DC 100%
            )`,
            zIndex: 0,
          }}
        />

        {/* Glass cube image - main layer */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: 'url(/images/glass-cube-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.4,
            mixBlendMode: 'soft-light',
            zIndex: 1,
          }}
        />

        {/* Glass cube image - blur layer for depth */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: 'url(/images/glass-cube-bg.png)',
            backgroundSize: '120% auto',
            backgroundPosition: 'center 60%',
            opacity: 0.15,
            filter: 'blur(30px)',
            zIndex: 2,
          }}
        />

        {/* Gradient overlays for readability */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 100% 80% at 50% 0%, rgba(255,255,255,0.5) 0%, transparent 50%),
              radial-gradient(ellipse 80% 50% at 0% 100%, rgba(200,205,215,0.4) 0%, transparent 40%),
              radial-gradient(ellipse 60% 40% at 100% 80%, rgba(195,200,210,0.35) 0%, transparent 40%)
            `,
            zIndex: 3,
          }}
        />

        {/* Noise texture */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            opacity: 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            zIndex: 4,
          }}
        />

        {/* ===== Content ===== */}
        <AppSidebar />
        
        <div className="flex-1 flex flex-col relative" style={{ zIndex: 10 }}>
          {/* Glass Header */}
          <header
            className="sticky top-0 z-40 flex h-16 items-center gap-4 px-4 lg:px-6"
            style={{
              background: 'linear-gradient(165deg, rgba(48,48,58,0.98) 0%, rgba(32,32,40,0.97) 30%, rgba(42,42,52,0.98) 60%, rgba(35,35,45,0.97) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.15)',
            }}
          >
            <SidebarTrigger />
            <div className="flex-1" />
            <ThemeToggle />
            <NotificationCenter />
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  style={{
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(240,240,245,0.95) 100%)',
                    border: '1px solid rgba(255,255,255,0.95)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05), inset 0 1px 2px rgba(255,255,255,1)',
                  }}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback
                      style={{
                        background: 'linear-gradient(145deg, #222228 0%, #2c2c35 45%, #1c1c24 100%)',
                        color: 'transparent',
                        fontSize: '14px',
                        fontWeight: 700,
                      }}
                    >
                      <span
                        style={{
                          background: 'linear-gradient(180deg, #ffffff 0%, #d0d0d5 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {getUserInitial()}
                      </span>
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56"
                style={{
                  background: 'linear-gradient(165deg, rgba(255,255,255,0.98) 0%, rgba(253,253,255,0.92) 100%)',
                  backdropFilter: 'blur(40px)',
                  border: '1px solid rgba(255,255,255,0.8)',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05), 0 10px 20px rgba(0,0,0,0.08)',
                }}
              >
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">내 계정</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default DashboardLayout;
