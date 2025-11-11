import { 
  LayoutDashboard, 
  Store, 
  Settings,
  Users,
  Activity,
  Map,
  Filter,
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
  ChevronDown,
  LucideIcon,
  Cpu
} from "lucide-react";
import { useState, useEffect } from "react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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

// 메뉴 아이템 타입 정의
interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

// 섹션 타입 정의
interface MenuSection {
  id: string;
  label: string;
  emoji: string;
  items: MenuItem[];
  defaultOpen: boolean;
  hoverColor?: string;
  textColor?: string;
  activeGradient?: string;
}

// Core 핵심 메뉴
const coreItems: MenuItem[] = [
  { title: "대시보드", url: "/", icon: LayoutDashboard },
  { title: "매장 관리", url: "/stores", icon: Store },
  { title: "설정", url: "/settings", icon: Settings },
];

// 섹션별 메뉴 데이터 통합 관리
const menuSections: MenuSection[] = [
  {
    id: "storeAnalysis",
    label: "매장 현황 분석",
    emoji: "📊",
    defaultOpen: true,
    items: [
      { title: "방문자 현황", url: "/footfall-analysis", icon: Users },
      { title: "동선 히트맵", url: "/traffic-heatmap", icon: Activity },
      { title: "고객 여정 분석", url: "/customer-journey", icon: Map },
      { title: "전환 퍼널", url: "/conversion-funnel", icon: Filter },
    ],
  },
  {
    id: "profitCenter",
    label: "수익 최적화 (AI)",
    emoji: "💰",
    defaultOpen: true,
    hoverColor: "hover:bg-green-500/5",
    textColor: "text-green-600",
    activeGradient: "bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium shadow-md",
    items: [
      { title: "통합 대시보드", url: "/profit-center", icon: Zap },
      { title: "수요 예측 & 재고", url: "/demand-forecast", icon: TrendingUp },
      { title: "AI 가격 최적화", url: "/pricing-optimizer", icon: DollarSign },
      { title: "AI 고객 추천", url: "/customer-recommendations", icon: Target },
      { title: "레이아웃 시뮬레이터", url: "/layout-simulator", icon: Grid3x3 },
    ],
  },
  {
    id: "costCenter",
    label: "비용 효율화",
    emoji: "💸",
    defaultOpen: true,
    hoverColor: "hover:bg-orange-500/5",
    textColor: "text-orange-600",
    activeGradient: "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium shadow-md",
    items: [
      { title: "상품 성과 분석", url: "/product-performance", icon: ShoppingBag },
      { title: "직원 효율성 분석", url: "/staff-efficiency", icon: UserCheck },
    ],
  },
  {
    id: "dataManagement",
    label: "데이터 관리",
    emoji: "🗄️",
    defaultOpen: true,
    hoverColor: "hover:bg-blue-500/5",
    textColor: "text-blue-600",
    activeGradient: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium shadow-md",
    items: [
      { title: "NeuralSense IoT", url: "/neuralsense-settings", icon: Cpu },
      { title: "데이터 임포트", url: "/data-import", icon: Upload },
      { title: "그래프 분석", url: "/graph-analysis", icon: Network },
      { title: "온톨로지 스키마", url: "/schema-builder", icon: Database },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  // 모든 섹션의 열림/닫힘 상태를 객체로 관리
  const [sectionStates, setSectionStates] = useState<Record<string, boolean>>(
    menuSections.reduce((acc, section) => ({
      ...acc,
      [section.id]: section.defaultOpen,
    }), {})
  );

  // 경로 변경 시 해당 섹션이 닫혀있으면 자동으로 열기
  useEffect(() => {
    menuSections.forEach((section) => {
      const isActive = section.items.some(item => location.pathname === item.url);
      if (isActive && !sectionStates[section.id]) {
        setSectionStates(prev => ({ ...prev, [section.id]: true }));
      }
    });
  }, [location.pathname]);

  // 섹션 상태 토글 핸들러
  const toggleSection = (sectionId: string) => (open: boolean) => {
    setSectionStates(prev => ({ ...prev, [sectionId]: open }));
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* 로고 */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold py-4">
            {!collapsed ? (
              <span className="gradient-text text-xl">NEURALTWIN</span>
            ) : (
              <span className="gradient-text text-xl">NT</span>
            )}
          </SidebarGroupLabel>
        </SidebarGroup>

        {/* Core 핵심 메뉴 */}
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

        {/* 동적 섹션 렌더링 */}
        {menuSections.map((section) => (
          <Collapsible 
            key={section.id}
            open={sectionStates[section.id]} 
            onOpenChange={toggleSection(section.id)} 
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger 
                  className={`w-full ${section.hoverColor || 'hover:bg-sidebar-accent/50'} rounded-lg transition-colors`}
                >
                  <span className={`text-sm font-semibold ${section.textColor || ''}`}>
                    {section.emoji} {section.label}
                  </span>
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink 
                            to={item.url}
                            className={`flex items-center gap-3 text-sidebar-foreground ${
                              section.hoverColor 
                                ? section.hoverColor.replace('hover:bg-', 'hover:bg-').replace('/5', '/10') + ` hover:${section.textColor}`
                                : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                            } transition-all duration-200 rounded-lg`}
                            activeClassName={section.activeGradient || "bg-gradient-primary text-white font-medium shadow-md"}
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
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
