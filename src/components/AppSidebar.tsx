import { 
  LayoutDashboard, 
  Store, 
  Settings,
  Users,
  Activity,
  Map,
  Filter,
  Building2,
  Upload,
  Network,
  Database,
  Zap,
  DollarSign,
  Target,
  TrendingUp,
  Grid3x3,
  ShoppingBag,
  UserCheck,
  ChevronDown
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Core 핵심 메뉴
const coreItems = [
  { title: "대시보드", url: "/", icon: LayoutDashboard },
  { title: "매장 관리", url: "/stores", icon: Store },
  { title: "설정", url: "/settings", icon: Settings },
];

// Store Analysis 매장 분석
const storeAnalysisItems = [
  { title: "방문자 분석", url: "/footfall-analysis", icon: Users },
  { title: "동선 히트맵", url: "/traffic-heatmap", icon: Activity },
  { title: "고객 여정", url: "/customer-journey", icon: Map },
  { title: "전환 퍼널", url: "/conversion-funnel", icon: Filter },
  { title: "본사-매장 동기화", url: "/hq-store-sync", icon: Building2 },
];

// Profit Center 수익 센터
const profitCenterItems = [
  { title: "통합 대시보드", url: "/profit-center", icon: Zap },
  { title: "수요 예측 & 재고", url: "/demand-forecast", icon: TrendingUp },
  { title: "가격 최적화", url: "/pricing-optimizer", icon: DollarSign },
  { title: "고객 추천", url: "/customer-recommendations", icon: Target },
  { title: "레이아웃 시뮬레이터", url: "/layout-simulator", icon: Grid3x3 },
];

// Cost Center 비용 센터
const costCenterItems = [
  { title: "상품 성과", url: "/product-performance", icon: ShoppingBag },
  { title: "직원 효율성", url: "/staff-efficiency", icon: UserCheck },
];

// Data Management 데이터 관리
const dataManagementItems = [
  { title: "데이터 임포트", url: "/data-import", icon: Upload },
  { title: "그래프 분석", url: "/graph-analysis", icon: Network },
  { title: "온톨로지 스키마", url: "/schema-builder", icon: Database },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* 로고 */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold py-4">
            {!collapsed && (
              <span className="gradient-text text-xl">
                NEURALTWIN
              </span>
            )}
            {collapsed && <span className="gradient-text text-xl">NT</span>}
          </SidebarGroupLabel>
        </SidebarGroup>

        {/* Core 핵심 */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {coreItems.map((item) => (
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

        {/* Store Analysis 매장 분석 */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full">
                <span className="text-sm font-semibold">📊 매장 분석</span>
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {storeAnalysisItems.map((item) => (
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Profit Center 수익 센터 */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full">
                <span className="text-sm font-semibold text-green-600">💰 수익 센터</span>
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {profitCenterItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url}
                          className="flex items-center gap-3 text-sidebar-foreground hover:bg-green-500/10 hover:text-green-600 transition-all duration-200 rounded-lg"
                          activeClassName="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium shadow-md"
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Cost Center 비용 센터 */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full">
                <span className="text-sm font-semibold text-orange-600">💸 비용 센터</span>
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {costCenterItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url}
                          className="flex items-center gap-3 text-sidebar-foreground hover:bg-orange-500/10 hover:text-orange-600 transition-all duration-200 rounded-lg"
                          activeClassName="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium shadow-md"
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Data Management 데이터 관리 */}
        <Collapsible defaultOpen={false} className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full">
                <span className="text-sm font-semibold text-blue-600">🗄️ 데이터 관리</span>
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {dataManagementItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url}
                          className="flex items-center gap-3 text-sidebar-foreground hover:bg-blue-500/10 hover:text-blue-600 transition-all duration-200 rounded-lg"
                          activeClassName="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium shadow-md"
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
    </Sidebar>
  );
}
