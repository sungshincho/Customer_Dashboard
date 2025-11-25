import { 
  LayoutDashboard, 
  Store, 
  Settings,
  Users,
  Activity,
  Map,
  Filter,
  UserCheck,
  Package,
  DollarSign,
  Target,
  TrendingUp,
  Grid3x3,
  TestTube,
  Boxes,
  Upload,
  Network,
  Database,
  Zap,
  Cpu,
  ChevronDown,
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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface MenuSection {
  id: string;
  label: string;
  emoji: string;
  items: MenuItem[];
  defaultOpen: boolean;
}

// 1️⃣ Overview (4 pages)
const overviewItems: MenuItem[] = [
  { title: "대시보드", url: "/overview/dashboard", icon: LayoutDashboard },
  { title: "매장 관리", url: "/overview/stores", icon: Store },
  { title: "HQ-매장 커뮤니케이션", url: "/overview/hq-communication", icon: Network },
  { title: "설정", url: "/overview/settings", icon: Settings },
];

// 2️⃣ Analysis, 3️⃣ Simulation, 4️⃣ Data Management 섹션
const menuSections: MenuSection[] = [
  {
    id: "storeAnalysis",
    label: "매장 현황 분석",
    emoji: "📊",
    defaultOpen: true,
    items: [
      { title: "매장 분석", url: "/analysis/store", icon: Activity },
      { title: "고객 분석", url: "/analysis/customer", icon: Users },
      { title: "상품 분석", url: "/analysis/product", icon: Package },
    ],
  },
  {
    id: "simulation",
    label: "시뮬레이션",
    emoji: "🔮",
    defaultOpen: true,
    items: [
      { title: "디지털 트윈 3D", url: "/simulation/digital-twin", icon: Boxes },
      { title: "시뮬레이션 허브", url: "/simulation/hub", icon: TestTube },
    ],
  },
  {
    id: "dataManagement",
    label: "데이터 관리",
    emoji: "🗄️",
    defaultOpen: true,
    items: [
      { title: "통합 데이터 임포트", url: "/data-management/import", icon: Upload },
      { title: "스키마 빌더", url: "/data-management/schema", icon: Network },
      // 그래프 분석은 숨김 처리 (코드는 유지)
      // { title: "그래프 분석", url: "/data-management/graph-analysis", icon: Database },
      { title: "API 연동", url: "/data-management/api", icon: Zap },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { stores, selectedStore, setSelectedStore } = useSelectedStore();

  const isActive = (path: string) => {
    if (path === "/overview/dashboard") return location.pathname === "/" || location.pathname === "/overview/dashboard";
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-background">
        {/* Store Selector */}
        {!collapsed && stores.length > 0 && (
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
        )}

        {/* 1️⃣ Overview Section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-2">
            1️⃣ Overview
          </SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {overviewItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 2️⃣ Analysis & 3️⃣ Simulation & 4️⃣ Data Management */}
        {menuSections.map((section) => {
          const hasActiveItem = section.items.some((item) => isActive(item.url));
          const sectionNumber = section.id === "storeAnalysis" || section.id === "operationalAnalysis" ? "2️⃣" 
            : section.id === "simulation" ? "3️⃣" 
            : "4️⃣";

          return (
            <Collapsible
              key={section.id}
              defaultOpen={section.defaultOpen}
            >
              <SidebarGroup>
                <CollapsibleTrigger className="w-full">
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded px-2 py-1">
                    {!collapsed && (
                      <>
                        <span className="text-xs font-semibold">
                          {sectionNumber} {section.emoji} {section.label}
                        </span>
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                      </>
                    )}
                    {collapsed && <span className="text-xs">{section.emoji}</span>}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              className="hover:bg-muted/50"
                              activeClassName="bg-primary/10 text-primary font-medium"
                            >
                              <item.icon className="h-4 w-4" />
                              {!collapsed && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
