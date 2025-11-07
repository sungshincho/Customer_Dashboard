import { 
  LayoutDashboard, 
  Store, 
  BarChart3, 
  Package, 
  TrendingUp, 
  Settings,
  Users,
  Activity,
  Layers,
  ShoppingBag,
  Box,
  Grid3x3,
  UserCheck,
  Map,
  Filter,
  Building2,
  Upload,
  Network
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "대시보드", url: "/", icon: LayoutDashboard },
  { title: "매장 관리", url: "/stores", icon: Store },
  { title: "방문자 분석", url: "/analytics", icon: BarChart3 },
  { title: "재고 관리", url: "/inventory", icon: Package },
  { title: "AI 예측", url: "/forecasts", icon: TrendingUp },
    { title: "데이터 임포트", url: "/data-import", icon: Upload },
    { title: "그래프 분석", url: "/graph-analysis", icon: Network },
  { title: "설정", url: "/settings", icon: Settings },
];

const analysisMenuItems = [
  { title: "방문객 유입", url: "/footfall-analysis", icon: Users },
  { title: "수요 예측", url: "/demand-forecast", icon: TrendingUp },
  { title: "동선 히트맵", url: "/traffic-heatmap", icon: Activity },
  { title: "상품 성과", url: "/product-performance", icon: ShoppingBag },
  { title: "재고 최적화", url: "/inventory-optimizer", icon: Box },
  { title: "레이아웃 시뮬레이터", url: "/layout-simulator", icon: Grid3x3 },
  { title: "직원 효율성", url: "/staff-efficiency", icon: UserCheck },
  { title: "고객 여정", url: "/customer-journey", icon: Map },
  { title: "전환 퍼널", url: "/conversion-funnel", icon: Filter },
  { title: "본사-매장 동기화", url: "/hq-store-sync", icon: Building2 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold py-4">
            {!collapsed && (
              <span className="gradient-text text-xl">
                NEURALTWIN
              </span>
            )}
            {collapsed && <span className="gradient-text text-xl">NT</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-4">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className="flex items-center gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 rounded-lg"
                      activeClassName="bg-gradient-primary text-white font-medium shadow-md"
                      end
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold py-2">
            {!collapsed && <span>심화 분석</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analysisMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className="flex items-center gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 rounded-lg"
                      activeClassName="bg-gradient-primary text-white font-medium shadow-md"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
