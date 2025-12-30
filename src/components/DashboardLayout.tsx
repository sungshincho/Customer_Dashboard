/**
 * DashboardLayout.tsx
 *
 * 3D Glassmorphism Dashboard Layout
 * - Dark mode support for background
 * - Monochrome (Black/White) theme
 */

import { useState, useEffect } from "react";
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
  const [isDark, setIsDark] = useState(false);

  // 다크모드 감지
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  const getUserInitial = () => {
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative">
        {/* ===== Background Layers ===== */}
        
        {/* Base gradient - 다크모드 반전 */}
        <div
          className="fixed inset-0 pointer-events-none transition-colors duration-300"
          style={{
            background: isDark 
              ? `linear-gradient(180deg, 
                  #0a0a0c 0%, 
                  #111114 20%, 
                  #0d0d10 45%, 
                  #0a0a0c 70%, 
                  #0f0f12 100%
                )`
              : `linear-gradient(180deg, 
                  #e8e8ec 0%, 
                  #f0f0f4 20%, 
                  #eaeaee 45%, 
                  #e5e5e9 70%, 
                  #ededed 100%
                )`,
            zIndex: 0,
          }}
        />

        {/* Gradient overlays - 다크모드 반전 */}
        <div
          className="fixed inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: isDark
              ? `
                radial-gradient(ellipse 100% 80% at 50% 0%, rgba(30,30,35,0.6) 0%, transparent 50%),
                radial-gradient(ellipse 80% 50% at 0% 100%, rgba(20,20,25,0.4) 0%, transparent 40%),
                radial-gradient(ellipse 60% 40% at 100% 80%, rgba(25,25,30,0.35) 0%, transparent 40%)
              `
              : `
                radial-gradient(ellipse 100% 80% at 50% 0%, rgba(255,255,255,0.6) 0%, transparent 50%),
                radial-gradient(ellipse 80% 50% at 0% 100%, rgba(220,220,228,0.4) 0%, transparent 40%),
                radial-gradient(ellipse 60% 40% at 100% 80%, rgba(215,215,223,0.35) 0%, transparent 40%)
              `,
            zIndex: 3,
          }}
        />

        {/* Noise texture */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            opacity: isDark ? 0.05 : 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            zIndex: 4,
          }}
        />

        {/* ===== Content ===== */}
        <AppSidebar />
        
        <div className="flex-1 flex flex-col relative" style={{ zIndex: 10 }}>
          {/* Header - 다크모드 반전 */}
          <header
            className="sticky top-0 z-40 flex h-14 items-center gap-4 px-4 lg:px-6 transition-all duration-300"
            style={{
              background: isDark 
                ? 'linear-gradient(165deg, rgba(20,20,24,0.98) 0%, rgba(12,12,15,0.97) 30%, rgba(16,16,20,0.98) 60%, rgba(14,14,18,0.97) 100%)'
                : 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(250,250,252,0.92) 30%, rgba(255,255,255,0.95) 60%, rgba(248,248,250,0.92) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderBottom: isDark 
                ? '1px solid rgba(255,255,255,0.08)' 
                : '1px solid rgba(0,0,0,0.06)',
              boxShadow: isDark 
                ? '0 2px 4px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.2)' 
                : '0 1px 2px rgba(0,0,0,0.03), 0 4px 8px rgba(0,0,0,0.04)',
            }}
          >
            {/* Sidebar Trigger */}
            <SidebarTrigger 
              className={isDark 
                ? "text-white/80 hover:text-white hover:bg-white/10" 
                : "text-black/70 hover:text-black hover:bg-black/5"
              } 
            />
            
            <div className="flex-1" />
            
            {/* Theme Toggle */}
            <ThemeToggle 
              className={isDark 
                ? "text-white/80 hover:text-white hover:bg-white/10" 
                : "text-black/70 hover:text-black hover:bg-black/5"
              } 
            />
            
            {/* Notification Center */}
            <NotificationCenter 
              className={isDark 
                ? "text-white/80 hover:text-white hover:bg-white/10" 
                : "text-black/70 hover:text-black hover:bg-black/5"
              } 
            />
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                  style={{
                    background: isDark 
                      ? 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)'
                      : 'linear-gradient(145deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.03) 100%)',
                    border: isDark 
                      ? '1px solid rgba(255,255,255,0.1)' 
                      : '1px solid rgba(0,0,0,0.08)',
                    boxShadow: isDark 
                      ? 'inset 0 1px 1px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.2)'
                      : 'inset 0 1px 1px rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback
                      style={{
                        background: 'transparent',
                        fontSize: '14px',
                        fontWeight: 700,
                      }}
                    >
                      <span
                        style={{
                          color: isDark ? '#ffffff' : '#1a1a1f',
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
                  background: isDark 
                    ? 'linear-gradient(165deg, rgba(20,20,24,0.98) 0%, rgba(14,14,18,0.97) 100%)'
                    : 'linear-gradient(165deg, rgba(255,255,255,0.98) 0%, rgba(250,250,252,0.97) 100%)',
                  backdropFilter: 'blur(40px)',
                  border: isDark 
                    ? '1px solid rgba(255,255,255,0.1)' 
                    : '1px solid rgba(0,0,0,0.08)',
                  boxShadow: isDark 
                    ? '0 4px 6px rgba(0,0,0,0.3), 0 10px 20px rgba(0,0,0,0.35)'
                    : '0 4px 6px rgba(0,0,0,0.05), 0 10px 20px rgba(0,0,0,0.08)',
                }}
              >
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className={`text-sm font-medium ${isDark ? 'text-white/90' : 'text-black/90'}`}>내 계정</p>
                    <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className={isDark ? 'bg-white/10' : 'bg-black/10'} />
                <DropdownMenuItem 
                  onClick={signOut}
                  className={isDark 
                    ? 'text-white/80 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white'
                    : 'text-black/80 hover:text-black hover:bg-black/5 focus:bg-black/5 focus:text-black'
                  }
                >
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
