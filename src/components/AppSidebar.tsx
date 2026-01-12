import {
  LayoutDashboard,
  Store,
  Settings,
  Box,
  BarChart3,
  TrendingUp,
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

// 4개 메인 메뉴
const mainMenuItems: MenuItem[] = [
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

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { stores, selectedStore, setSelectedStore } = useSelectedStore();

  const isActive = (path: string) => {
    if (path === "/insights") return location.pathname === "/" || location.pathname.startsWith("/insights");
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

        {/* 메인 메뉴 (4개) */}
        <SidebarGroup className="mt-4">
          <SidebarGroupContent>
            <SidebarMenu className={collapsed ? "space-y-9 flex flex-col items-center" : "space-y-2"}>
              {mainMenuItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className={collapsed ? "!w-auto !h-auto !p-0 !overflow-visible !rounded-none bg-transparent hover:bg-transparent" : "h-auto py-3"}>
                      <NavLink
                        to={item.url}
                        className={`hover:bg-muted/50 dark:hover:bg-white/10 rounded-lg transition-colors ${
                          active && !collapsed ? 'bg-primary/10 dark:bg-white/10 border-l-4 border-primary dark:border-white' : ''
                        } ${collapsed ? 'flex items-center justify-center !bg-transparent hover:!bg-transparent' : ''}`}
                        activeClassName={!collapsed ? "bg-primary/10 dark:bg-white/10 text-primary dark:text-white font-medium" : ""}
                      >
                        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                          {collapsed ? (
                            <div
                              className="flex items-center justify-center relative"
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '16px',
                                overflow: 'visible',
                                ...(active ? {
                                  background: 'linear-gradient(145deg, #2f2f38 0%, #1c1c22 35%, #282830 65%, #1e1e26 100%)',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.12)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                } : {
                                  background: 'linear-gradient(145deg, #e8e8ec 0%, #d8d8dc 35%, #e0e0e4 65%, #d4d4d8 100%)',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.06), 0 8px 16px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.8)',
                                  border: '1px solid rgba(0,0,0,0.08)',
                                })
                              }}
                            >
                              {/* Chrome highlight */}
                              <div
                                className="absolute"
                                style={{
                                  top: '2px',
                                  left: '18%',
                                  right: '18%',
                                  height: '1px',
                                  background: active
                                    ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)'
                                    : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                                }}
                              />
                              <item.icon
                                className="h-5 w-5"
                                style={active ? {
                                  color: '#ffffff',
                                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
                                } : {
                                  color: '#6b6b73',
                                }}
                              />
                            </div>
                          ) : (
                            <item.icon className={`h-5 w-5 text-foreground dark:text-white ${active ? 'text-primary dark:text-white' : ''}`} />
                          )}
                          {!collapsed && (
                            <div className="flex flex-col">
                              <span className={`font-medium text-foreground dark:text-white ${active ? 'text-primary dark:text-white' : ''}`}>
                                {item.title}
                              </span>
                              <span className="text-xs text-muted-foreground dark:text-white/60">
                                {item.description}
                              </span>
                            </div>
                          )}
                        </div>
                      </NavLink>
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
            <div className="text-center text-xs text-muted-foreground dark:text-white/60">
              <div className="font-semibold text-primary dark:text-white">NEURALTWIN</div>
              <div>AI-Powered Retail Platform</div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
