import { 
  LayoutDashboard, 
  Store, 
  BarChart3, 
  Package, 
  TrendingUp, 
  Settings 
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
  { title: "설정", url: "/settings", icon: Settings },
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
      </SidebarContent>
    </Sidebar>
  );
}
