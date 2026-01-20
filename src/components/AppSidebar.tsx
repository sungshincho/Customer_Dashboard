import {
  useState,
  useEffect,
} from "react";
import {
  LayoutDashboard,
  Store,
  Settings,
  Box,
  BarChart3,
  TrendingUp,
  Database,
  LucideIcon
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  emoji: string;
  description: string;
}

// 5개 메인 메뉴 (데이터 컨트롤타워 추가)
const mainMenuItems: MenuItem[] = [
  {
    title: "데이터 컨트롤타워",
    url: "/data/control-tower",
    icon: Database,
    emoji: "🗄️",
    description: "데이터 수집, Lineage, ETL 모니터링"
  },
  {
    title: "인사이트 허브",
    url: "/insights",
    icon: BarChart3,
    emoji: "📊",
    description: "대시보드, 분석, AI 추천, 예측"
  },
  {
    title: "디지털트윈 스튜디오",
    url: "/studio",
    icon: Box,
    emoji: "🎨",
    description: "3D 편집, 시뮬레이션, 분석"
  },
  {
    title: "ROI 측정",
    url: "/roi",
    icon: TrendingUp,
    emoji: "📈",
    description: "전략 성과 추적, ROI 분석"
  },
  {
    title: "설정 & 관리",
    url: "/settings",
    icon: Settings,
    emoji: "⚙️",
    description: "매장, 데이터, 사용자, 시스템"
  },
];

// ============================================================================
// 3D Glass Menu Button Component
// ============================================================================
interface GlassMenuButtonProps {
  item: MenuItem;
  isActive: boolean;
  isDark: boolean;
  collapsed: boolean;
}

function GlassMenuButton({ item, isActive, isDark, collapsed }: GlassMenuButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon;

  // Light Mode Styles
  const lightStyles = {
    wrapper: {
      background: isActive 
        ? 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(245,245,250,0.95) 50%, rgba(255,255,255,0.98) 100%)'
        : 'linear-gradient(145deg, rgba(255,255,255,0.85) 0%, rgba(248,248,252,0.75) 50%, rgba(255,255,255,0.85) 100%)',
      border: isActive 
        ? '1.5px solid rgba(255,255,255,0.95)'
        : '1px solid rgba(255,255,255,0.6)',
      boxShadow: isActive
        ? `0 4px 8px rgba(0,0,0,0.08), 
           0 8px 16px rgba(0,0,0,0.06), 
           0 16px 32px rgba(0,0,0,0.04),
           inset 0 1px 2px rgba(255,255,255,1),
           inset 0 -2px 6px rgba(0,0,0,0.03)`
        : `0 2px 4px rgba(0,0,0,0.04), 
           0 4px 8px rgba(0,0,0,0.03),
           inset 0 1px 1px rgba(255,255,255,0.8)`,
    },
    iconContainer: {
      background: isActive
        ? 'linear-gradient(145deg, #1a1a1f 0%, #2a2a32 40%, #1e1e26 100%)'
        : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(235,235,242,0.95) 40%, rgba(248,248,252,0.98) 100%)',
      border: isActive
        ? '1px solid rgba(255,255,255,0.15)'
        : '1px solid rgba(255,255,255,0.9)',
      boxShadow: isActive
        ? `0 4px 8px rgba(0,0,0,0.25),
           0 8px 16px rgba(0,0,0,0.2),
           inset 0 1px 1px rgba(255,255,255,0.15),
           inset 0 -1px 2px rgba(0,0,0,0.3)`
        : `0 2px 4px rgba(0,0,0,0.06),
           0 4px 8px rgba(0,0,0,0.05),
           inset 0 2px 4px rgba(255,255,255,1),
           inset 0 -1px 2px rgba(0,0,0,0.03)`,
    },
    iconColor: isActive ? '#ffffff' : '#4a4a52',
    title: isActive ? '#1a1a1f' : '#3a3a42',
    description: '#6b6b73',
  };

  // Dark Mode Styles
  const darkStyles = {
    wrapper: {
      background: isActive 
        ? 'linear-gradient(145deg, rgba(45,45,55,0.98) 0%, rgba(35,35,45,0.95) 50%, rgba(40,40,50,0.98) 100%)'
        : 'linear-gradient(145deg, rgba(30,30,38,0.8) 0%, rgba(25,25,32,0.7) 50%, rgba(28,28,36,0.8) 100%)',
      border: isActive 
        ? '1.5px solid rgba(255,255,255,0.12)'
        : '1px solid rgba(255,255,255,0.06)',
      boxShadow: isActive
        ? `0 4px 8px rgba(0,0,0,0.3), 
           0 8px 16px rgba(0,0,0,0.25), 
           0 16px 32px rgba(0,0,0,0.2),
           inset 0 1px 1px rgba(255,255,255,0.1),
           inset 0 -2px 6px rgba(0,0,0,0.2)`
        : `0 2px 4px rgba(0,0,0,0.2), 
           0 4px 8px rgba(0,0,0,0.15),
           inset 0 1px 1px rgba(255,255,255,0.05)`,
    },
    iconContainer: {
      background: isActive
        ? 'linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0.12) 100%)'
        : 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.07) 100%)',
      border: isActive
        ? '1px solid rgba(255,255,255,0.2)'
        : '1px solid rgba(255,255,255,0.08)',
      boxShadow: isActive
        ? `0 4px 8px rgba(0,0,0,0.35),
           inset 0 1px 2px rgba(255,255,255,0.15),
           inset 0 -1px 2px rgba(0,0,0,0.3)`
        : `0 2px 4px rgba(0,0,0,0.25),
           inset 0 1px 1px rgba(255,255,255,0.08)`,
    },
    iconColor: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
    title: isActive ? '#ffffff' : 'rgba(255,255,255,0.85)',
    description: 'rgba(255,255,255,0.5)',
  };

  const styles = isDark ? darkStyles : lightStyles;

  // Collapsed 상태 (아이콘만 표시)
  if (collapsed) {
    return (
      <NavLink
        to={item.url}
        className="flex items-center justify-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="flex items-center justify-center relative transition-all duration-300"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            transform: isHovered ? 'translateY(-2px) scale(1.05)' : 'translateY(0) scale(1)',
            ...styles.iconContainer,
          }}
        >
          {/* Chrome highlight */}
          <div
            className="absolute"
            style={{
              top: '2px',
              left: '15%',
              right: '15%',
              height: '1px',
              background: isActive
                ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
                : isDark
                  ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
            }}
          />
          
          {/* Icon Container Inner Glow (for active state) */}
          {isActive && (
            <div
              className="absolute"
              style={{
                top: '3px',
                left: '10%',
                right: '10%',
                height: '40%',
                background: isDark
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                borderRadius: '12px 12px 50% 50%',
              }}
            />
          )}

          <Icon
            className="h-5 w-5"
            style={{
              color: styles.iconColor,
              filter: isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none',
            }}
          />
        </div>
      </NavLink>
    );
  }

  // Expanded 상태 (전체 버튼)
  return (
    <NavLink
      to={item.url}
      className="block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative transition-all duration-300"
        style={{
          padding: '14px 16px',
          borderRadius: '20px',
          cursor: 'pointer',
          transform: isHovered ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          ...styles.wrapper,
        }}
      >
        {/* Top Chrome Highlight */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '1px',
            left: '10%',
            right: '10%',
            height: '1px',
            background: isDark
              ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 70%, transparent 100%)'
              : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 30%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.8) 70%, transparent 100%)',
            borderRadius: '1px',
          }}
        />

        {/* Surface Reflection */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: isDark
              ? 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 40%, transparent 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 40%, transparent 100%)',
            borderRadius: '20px 20px 50% 50%',
          }}
        />

        <div className="flex items-center gap-3.5 relative z-10">
          {/* 3D Icon Container */}
          <div
            className="relative flex-shrink-0 flex items-center justify-center transition-all duration-300"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              ...styles.iconContainer,
            }}
          >
            {/* Icon Container Top Highlight */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: '2px',
                left: '15%',
                right: '15%',
                height: '1px',
                background: isActive
                  ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
                  : isDark
                    ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
              }}
            />
            
            {/* Icon Container Inner Glow (for active state) */}
            {isActive && (
              <div
                className="absolute pointer-events-none"
                style={{
                  top: '3px',
                  left: '10%',
                  right: '10%',
                  height: '40%',
                  background: isDark
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                  borderRadius: '12px 12px 50% 50%',
                }}
              />
            )}

            <Icon
              className="h-5 w-5"
              style={{
                color: styles.iconColor,
                filter: isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none',
              }}
            />
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: styles.title,
                letterSpacing: '-0.01em',
                textShadow: isDark 
                  ? (isActive ? '0 1px 2px rgba(0,0,0,0.5)' : 'none')
                  : (isActive ? '0 1px 1px rgba(255,255,255,0.8)' : 'none'),
                marginBottom: '2px',
              }}
            >
              {item.title}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: styles.description,
                fontWeight: 500,
                letterSpacing: '0.01em',
              }}
            >
              {item.description}
            </div>
          </div>

          {/* Active Indicator Dot */}
          {isActive && (
            <div
              className="flex-shrink-0"
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isDark
                  ? 'linear-gradient(145deg, #ffffff 0%, #e0e0e0 100%)'
                  : 'linear-gradient(145deg, #1a1a1f 0%, #2a2a32 100%)',
                boxShadow: isDark
                  ? '0 0 8px rgba(255,255,255,0.4), inset 0 1px 1px rgba(255,255,255,0.5)'
                  : '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.2)',
              }}
            />
          )}
        </div>

        {/* Bottom Shadow */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: 0,
            left: '10%',
            right: '10%',
            height: '30%',
            background: isDark
              ? 'linear-gradient(0deg, rgba(0,0,0,0.15) 0%, transparent 100%)'
              : 'linear-gradient(0deg, rgba(0,0,0,0.02) 0%, transparent 100%)',
            borderRadius: '0 0 20px 20px',
          }}
        />
      </div>
    </NavLink>
  );
}

// ============================================================================
// Main AppSidebar Component
// ============================================================================
export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { stores, selectedStore, setSelectedStore } = useSelectedStore();
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

  const isActive = (path: string) => {
    if (path === "/insights") return location.pathname === "/" || location.pathname.startsWith("/insights");
    if (path === "/data/control-tower") return location.pathname.startsWith("/data");
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-background dark:bg-sidebar">
        {/* Store Selector */}
        {stores.length > 0 && (
          collapsed ? (
            /* 접힌 상태: 펼친 상태의 Store Selector와 동일한 높이 유지 */
            <div className="h-[73px] border-b border-border" />
          ) : (
            <div className="p-4 border-b border-border">
              <Select
                value={selectedStore?.id || ""}
                onValueChange={(value) => {
                  const store = stores.find(s => s.id === value);
                  setSelectedStore(store || null);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="매장 선택" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.store_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        )}

        {/* 메인 메뉴 - 3D Glass Buttons */}
        <SidebarGroup className="mt-4 px-3">
          <SidebarGroupContent>
            <SidebarMenu className={collapsed ? "space-y-3 flex flex-col items-center" : "space-y-2.5"}>
              {mainMenuItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      className="!p-0 !h-auto !bg-transparent hover:!bg-transparent !border-none"
                    >
                      <GlassMenuButton
                        item={item}
                        isActive={active}
                        isDark={isDark}
                        collapsed={collapsed}
                      />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 하단 브랜딩 */}
        {!collapsed && (
          <div className="absolute bottom-4 left-0 right-0 px-4">
            <div 
              className="text-center py-3 rounded-xl"
              style={{
                background: isDark
                  ? 'linear-gradient(145deg, rgba(30,30,38,0.6) 0%, rgba(25,25,32,0.5) 100%)'
                  : 'linear-gradient(145deg, rgba(255,255,255,0.6) 0%, rgba(248,248,252,0.5) 100%)',
                border: isDark
                  ? '1px solid rgba(255,255,255,0.06)'
                  : '1px solid rgba(255,255,255,0.5)',
              }}
            >
              <div 
                className="font-bold text-xs tracking-widest"
                style={{ 
                  color: isDark ? '#ffffff' : '#1a1a1f',
                  letterSpacing: '0.15em',
                }}
              >
                NEURALTWIN
              </div>
              <div 
                className="text-[10px] mt-1"
                style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#8a8a92' }}
              >
                AI-Powered Retail Platform
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
