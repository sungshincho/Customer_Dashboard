import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Edit, Trash2, Tag, TrendingUp, Settings2, X, 
  Store, ShoppingCart, Users, CreditCard, MapPin, UserCheck, 
  Package, Calendar, LucideIcon, Layers, Building2, Box,
  Barcode, Shirt, ShoppingBag, DollarSign, Receipt, Percent,
  Clock, Target, TrendingDown, PieChart, BarChart3, Globe,
  Navigation, Zap, Activity, AlertTriangle, CheckCircle, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PropertyField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
  enumValues?: string[];
}

interface EntityType {
  id: string;
  name: string;
  label: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  properties: PropertyField[];
}

// 리테일 비즈니스 도메인 아이콘 프리셋
const ICON_PRESETS = [
  { value: "Store", label: "매장" },
  { value: "Building2", label: "건물" },
  { value: "ShoppingCart", label: "상품" },
  { value: "ShoppingBag", label: "쇼핑백" },
  { value: "Shirt", label: "의류" },
  { value: "Box", label: "박스" },
  { value: "Package", label: "재고" },
  { value: "Barcode", label: "바코드" },
  { value: "Users", label: "고객" },
  { value: "UserCheck", label: "직원" },
  { value: "CreditCard", label: "거래" },
  { value: "DollarSign", label: "금액" },
  { value: "Receipt", label: "영수증" },
  { value: "Percent", label: "할인" },
  { value: "TrendingUp", label: "상승" },
  { value: "TrendingDown", label: "하락" },
  { value: "BarChart3", label: "막대그래프" },
  { value: "PieChart", label: "파이차트" },
  { value: "Target", label: "타겟" },
  { value: "MapPin", label: "위치" },
  { value: "Globe", label: "지역" },
  { value: "Calendar", label: "일정" },
  { value: "Clock", label: "시간" },
  { value: "Tag", label: "태그" },
  { value: "Layers", label: "레이어" },
  { value: "Navigation", label: "동선" },
  { value: "Zap", label: "마케팅" },
  { value: "CheckCircle", label: "전환" },
  { value: "AlertTriangle", label: "알림" },
];

// 아이콘 매핑
const ICON_MAP: Record<string, LucideIcon> = {
  Store,
  Building2,
  ShoppingCart,
  ShoppingBag,
  Shirt,
  Box,
  Package,
  Barcode,
  Users,
  UserCheck,
  CreditCard,
  DollarSign,
  Receipt,
  Percent,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Target,
  MapPin,
  Globe,
  Calendar,
  Clock,
  Tag,
  Layers,
  Navigation,
  Zap,
  CheckCircle,
  AlertTriangle,
};

const COLOR_PRESETS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
];

// 리테일 도메인 데이터 타입
const PROPERTY_TYPES = [
  { value: "string", label: "텍스트" },
  { value: "number", label: "숫자" },
  { value: "currency", label: "금액" },
  { value: "date", label: "날짜" },
  { value: "datetime", label: "날짜+시간" },
  { value: "boolean", label: "참/거짓" },
  { value: "email", label: "이메일" },
  { value: "phone", label: "전화번호" },
  { value: "url", label: "URL" },
  { value: "enum", label: "선택 목록" },
  { value: "array", label: "배열" },
];

export const EntityTypeManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<EntityType | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "properties">("basic");

  const [formData, setFormData] = useState({
    name: "",
    label: "",
    description: "",
    color: "#3b82f6",
    icon: "Store",
    properties: [] as PropertyField[],
  });

  const [newProperty, setNewProperty] = useState<Partial<PropertyField>>({
    name: "",
    label: "",
    type: "string",
    required: false,
    description: "",
  });

  const { data: entities, isLoading } = useQuery({
    queryKey: ["entity-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ontology_entity_types")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        properties: (item.properties || []) as unknown as PropertyField[]
      })) as EntityType[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase
        .from("ontology_entity_types")
        .insert({
          name: data.name,
          label: data.label,
          description: data.description,
          color: data.color,
          icon: data.icon,
          properties: data.properties as any,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-types"] });
      toast({ title: "엔티티 타입이 생성되었습니다" });
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "오류 발생", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { data: result, error } = await supabase
        .from("ontology_entity_types")
        .update({
          name: data.name,
          label: data.label,
          description: data.description,
          color: data.color,
          icon: data.icon,
          properties: data.properties as any,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-types"] });
      toast({ title: "엔티티 타입이 수정되었습니다" });
      setIsOpen(false);
      setEditingEntity(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ontology_entity_types")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-types"] });
      toast({ title: "엔티티 타입이 삭제되었습니다" });
    },
  });

  // 기본 엔티티 타입 자동 생성
  const createDefaultEntitiesMutation = useMutation({
    mutationFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error("로그인이 필요합니다");

      const defaultEntities = [
        {
          name: "staff",
          label: "직원",
          description: "매장 직원 정보",
          color: "#10b981",
          icon: "UserCheck",
          properties: [
            { id: "prop_staff_id", name: "staff_id", label: "직원 ID", type: "string", required: true },
            { id: "prop_staff_name", name: "staff_name", label: "직원명", type: "string", required: true },
            { id: "prop_store_id", name: "store_id", label: "소속 매장 ID", type: "string", required: true },
            { id: "prop_position", name: "position", label: "직책", type: "string", required: false },
            { id: "prop_hire_date", name: "hire_date", label: "입사일", type: "date", required: false },
            { id: "prop_performance", name: "performance_score", label: "성과 점수", type: "number", required: false },
          ],
          user_id: userId,
        },
        {
          name: "purchase",
          label: "구매",
          description: "고객 구매 거래 정보",
          color: "#f59e0b",
          icon: "Receipt",
          properties: [
            { id: "prop_purchase_id", name: "purchase_id", label: "구매 ID", type: "string", required: true },
            { id: "prop_customer_id", name: "customer_id", label: "고객 ID", type: "string", required: true },
            { id: "prop_product_id", name: "product_id", label: "상품 ID", type: "string", required: true },
            { id: "prop_store_id", name: "store_id", label: "매장 ID", type: "string", required: true },
            { id: "prop_quantity", name: "quantity", label: "수량", type: "number", required: true },
            { id: "prop_price", name: "price", label: "가격", type: "currency", required: true },
            { id: "prop_purchase_date", name: "purchase_date", label: "구매일", type: "date", required: true },
          ],
          user_id: userId,
        },
        {
          name: "visit",
          label: "방문",
          description: "고객 매장 방문 정보",
          color: "#8b5cf6",
          icon: "MapPin",
          properties: [
            { id: "prop_visit_id", name: "visit_id", label: "방문 ID", type: "string", required: true },
            { id: "prop_customer_id", name: "customer_id", label: "고객 ID", type: "string", required: true },
            { id: "prop_store_id", name: "store_id", label: "매장 ID", type: "string", required: true },
            { id: "prop_visit_date", name: "visit_date", label: "방문일", type: "date", required: true },
            { id: "prop_duration", name: "duration", label: "체류 시간(분)", type: "number", required: false },
            { id: "prop_purpose", name: "purpose", label: "방문 목적", type: "string", required: false },
          ],
          user_id: userId,
        },
      ];

      const { data, error } = await supabase
        .from("ontology_entity_types")
        .insert(defaultEntities)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["entity-types"] });
      toast({ 
        title: "기본 엔티티 타입 생성 완료",
        description: `${data.length}개의 엔티티 타입이 추가되었습니다 (직원, 구매, 방문)`,
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "생성 실패", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // 오프라인 리테일 궁극 스키마 생성
  const createRetailSchemaMutation = useMutation({
    mutationFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error("로그인이 필요합니다");

      // 오프라인 리테일 궁극 스키마 - 모든 비즈니스 로직 포함
      const retailEntities = [
        { name: 'Store', label: '매장', description: '물리적 매장 위치', color: '#3b82f6', icon: 'Store', properties: [
          { id: 'p1', name: 'store_code', label: '매장 코드', type: 'string', required: true },
          { id: 'p2', name: 'name', label: '매장명', type: 'string', required: true },
          { id: 'p3', name: 'location', label: '주소', type: 'string', required: true },
          { id: 'p4', name: 'area_sqm', label: '매장 면적(㎡)', type: 'number', required: false },
          { id: 'p5', name: 'opening_date', label: '오픈일', type: 'date', required: false },
          { id: 'p6', name: 'daily_traffic', label: '일일 방문객 수', type: 'number', required: false }
        ], user_id: userId },
        { name: 'Customer', label: '고객', description: '고객 정보', color: '#8b5cf6', icon: 'Users', properties: [
          { id: 'p7', name: 'customer_id', label: '고객 ID', type: 'string', required: true },
          { id: 'p8', name: 'name', label: '고객명', type: 'string', required: false },
          { id: 'p9', name: 'segment', label: '고객 세그먼트', type: 'string', required: false },
          { id: 'p10', name: 'loyalty_level', label: '로열티 등급', type: 'string', required: false },
          { id: 'p11', name: 'lifetime_value', label: '고객 생애 가치(LTV)', type: 'number', required: false },
          { id: 'p12', name: 'churn_risk_score', label: '이탈 위험 점수', type: 'number', required: false }
        ], user_id: userId },
        { name: 'Product', label: '제품', description: '판매 제품 정보', color: '#10b981', icon: 'Package', properties: [
          { id: 'p13', name: 'sku', label: 'SKU 코드', type: 'string', required: true },
          { id: 'p14', name: 'name', label: '제품명', type: 'string', required: true },
          { id: 'p15', name: 'category', label: '카테고리', type: 'string', required: false },
          { id: 'p16', name: 'price', label: '가격', type: 'number', required: true },
          { id: 'p17', name: 'cost', label: '원가', type: 'number', required: false },
          { id: 'p18', name: 'margin_rate', label: '마진율(%)', type: 'number', required: false },
          { id: 'p19', name: 'price_elasticity', label: '가격 탄력성', type: 'number', required: false },
          { id: 'p20', name: 'optimal_price', label: '최적 가격', type: 'number', required: false }
        ], user_id: userId },
        { name: 'Sale', label: '매출', description: '판매 트랜잭션', color: '#f59e0b', icon: 'ShoppingCart', properties: [
          { id: 'p21', name: 'transaction_id', label: '거래 ID', type: 'string', required: true },
          { id: 'p22', name: 'amount', label: '거래 금액', type: 'number', required: true },
          { id: 'p23', name: 'timestamp', label: '거래 시간', type: 'datetime', required: true },
          { id: 'p24', name: 'payment_method', label: '결제 수단', type: 'string', required: false },
          { id: 'p25', name: 'discount_applied', label: '할인 금액', type: 'number', required: false },
          { id: 'p26', name: 'profit', label: '순이익', type: 'number', required: false }
        ], user_id: userId },
        { name: 'Visit', label: '방문', description: '고객 매장 방문 기록', color: '#ec4899', icon: 'MapPin', properties: [
          { id: 'p27', name: 'visit_id', label: '방문 ID', type: 'string', required: true },
          { id: 'p28', name: 'entry_time', label: '입장 시간', type: 'datetime', required: true },
          { id: 'p29', name: 'exit_time', label: '퇴장 시간', type: 'datetime', required: false },
          { id: 'p30', name: 'dwell_time_minutes', label: '체류 시간(분)', type: 'number', required: false },
          { id: 'p31', name: 'zones_visited', label: '방문 구역', type: 'array', required: false },
          { id: 'p32', name: 'converted_to_sale', label: '구매 전환 여부', type: 'boolean', required: false }
        ], user_id: userId },
        { name: 'CustomerPath', label: '고객 동선', description: '매장 내 이동 경로', color: '#06b6d4', icon: 'Navigation', properties: [
          { id: 'p33', name: 'path_id', label: '동선 ID', type: 'string', required: true },
          { id: 'p34', name: 'sequence', label: '이동 경로 순서', type: 'array', required: true },
          { id: 'p35', name: 'total_distance', label: '총 이동 거리(m)', type: 'number', required: false },
          { id: 'p36', name: 'path_efficiency_score', label: '동선 효율성 점수', type: 'number', required: false },
          { id: 'p37', name: 'bottleneck_zones', label: '병목 구역', type: 'array', required: false }
        ], user_id: userId },
        { name: 'Inventory', label: '재고', description: '제품 재고 정보', color: '#f97316', icon: 'Box', properties: [
          { id: 'p38', name: 'inventory_id', label: '재고 ID', type: 'string', required: true },
          { id: 'p39', name: 'current_stock', label: '현재 재고', type: 'number', required: true },
          { id: 'p40', name: 'optimal_stock', label: '최적 재고', type: 'number', required: false },
          { id: 'p41', name: 'reorder_point', label: '재주문 시점', type: 'number', required: false },
          { id: 'p42', name: 'stockout_risk', label: '품절 위험도(%)', type: 'number', required: false },
          { id: 'p43', name: 'turnover_rate', label: '재고 회전율', type: 'number', required: false },
          { id: 'p44', name: 'holding_cost', label: '재고 유지 비용', type: 'number', required: false }
        ], user_id: userId },
        { name: 'DemandForecast', label: '수요 예측', description: '미래 수요 예측', color: '#84cc16', icon: 'TrendingUp', properties: [
          { id: 'p45', name: 'forecast_id', label: '예측 ID', type: 'string', required: true },
          { id: 'p46', name: 'forecast_date', label: '예측 날짜', type: 'date', required: true },
          { id: 'p47', name: 'predicted_demand', label: '예측 수요량', type: 'number', required: true },
          { id: 'p48', name: 'confidence_level', label: '신뢰도(%)', type: 'number', required: false },
          { id: 'p49', name: 'seasonality_factor', label: '계절성 요인', type: 'number', required: false },
          { id: 'p50', name: 'trend_factor', label: '트렌드 요인', type: 'number', required: false }
        ], user_id: userId },
        { name: 'PriceOptimization', label: '가격 최적화', description: '동적 가격 최적화', color: '#eab308', icon: 'DollarSign', properties: [
          { id: 'p51', name: 'optimization_id', label: '최적화 ID', type: 'string', required: true },
          { id: 'p52', name: 'current_price', label: '현재 가격', type: 'number', required: true },
          { id: 'p53', name: 'recommended_price', label: '권장 가격', type: 'number', required: true },
          { id: 'p54', name: 'expected_revenue_lift', label: '예상 매출 증가율(%)', type: 'number', required: false },
          { id: 'p55', name: 'competitor_price', label: '경쟁사 가격', type: 'number', required: false },
          { id: 'p56', name: 'wtp_average', label: '평균 지불의향가격', type: 'number', required: false }
        ], user_id: userId },
        { name: 'Promotion', label: '프로모션', description: '오프라인 프로모션', color: '#ef4444', icon: 'Percent', properties: [
          { id: 'p57', name: 'promotion_id', label: '프로모션 ID', type: 'string', required: true },
          { id: 'p58', name: 'name', label: '프로모션명', type: 'string', required: true },
          { id: 'p59', name: 'discount_rate', label: '할인율(%)', type: 'number', required: false },
          { id: 'p60', name: 'start_date', label: '시작일', type: 'date', required: true },
          { id: 'p61', name: 'end_date', label: '종료일', type: 'date', required: true },
          { id: 'p62', name: 'effectiveness_score', label: '효과성 점수', type: 'number', required: false },
          { id: 'p63', name: 'roi', label: 'ROI(%)', type: 'number', required: false }
        ], user_id: userId },
        { name: 'MarketingCampaign', label: '마케팅 캠페인', description: '오프라인 마케팅 캠페인', color: '#a855f7', icon: 'Zap', properties: [
          { id: 'p64', name: 'campaign_id', label: '캠페인 ID', type: 'string', required: true },
          { id: 'p65', name: 'name', label: '캠페인명', type: 'string', required: true },
          { id: 'p66', name: 'budget', label: '예산', type: 'number', required: false },
          { id: 'p67', name: 'reach', label: '도달 수', type: 'number', required: false },
          { id: 'p68', name: 'conversion_rate', label: '전환율(%)', type: 'number', required: false },
          { id: 'p69', name: 'cost_per_acquisition', label: '고객 획득 비용', type: 'number', required: false },
          { id: 'p70', name: 'suitability_score', label: '적합성 점수', type: 'number', required: false }
        ], user_id: userId },
        { name: 'PurchaseConversion', label: '구매 전환', description: '방문-구매 전환 분석', color: '#14b8a6', icon: 'CheckCircle', properties: [
          { id: 'p71', name: 'conversion_id', label: '전환 ID', type: 'string', required: true },
          { id: 'p72', name: 'conversion_rate', label: '전환율(%)', type: 'number', required: true },
          { id: 'p73', name: 'average_basket_size', label: '평균 장바구니 크기', type: 'number', required: false },
          { id: 'p74', name: 'conversion_factors', label: '전환 영향 요인', type: 'array', required: false },
          { id: 'p75', name: 'abandonment_rate', label: '이탈율(%)', type: 'number', required: false }
        ], user_id: userId },
        { name: 'StaffSchedule', label: '직원 스케줄', description: '직원 근무 스케줄링', color: '#6366f1', icon: 'Calendar', properties: [
          { id: 'p76', name: 'schedule_id', label: '스케줄 ID', type: 'string', required: true },
          { id: 'p77', name: 'shift_start', label: '근무 시작', type: 'datetime', required: true },
          { id: 'p78', name: 'shift_end', label: '근무 종료', type: 'datetime', required: true },
          { id: 'p79', name: 'efficiency_score', label: '효율성 점수', type: 'number', required: false },
          { id: 'p80', name: 'labor_cost', label: '인건비', type: 'number', required: false }
        ], user_id: userId },
        { name: 'ZoneAnalysis', label: '구역 분석', description: '매장 구역별 분석', color: '#64748b', icon: 'Target', properties: [
          { id: 'p81', name: 'zone_id', label: '구역 ID', type: 'string', required: true },
          { id: 'p82', name: 'zone_name', label: '구역명', type: 'string', required: true },
          { id: 'p83', name: 'traffic_density', label: '트래픽 밀도', type: 'number', required: false },
          { id: 'p84', name: 'dwell_time_avg', label: '평균 체류 시간', type: 'number', required: false },
          { id: 'p85', name: 'conversion_rate', label: '전환율(%)', type: 'number', required: false },
          { id: 'p86', name: 'revenue_per_sqm', label: '평당 매출', type: 'number', required: false }
        ], user_id: userId },
        { name: 'Alert', label: '알림', description: '비즈니스 알림 및 경고', color: '#dc2626', icon: 'AlertTriangle', properties: [
          { id: 'p87', name: 'alert_id', label: '알림 ID', type: 'string', required: true },
          { id: 'p88', name: 'type', label: '알림 유형', type: 'string', required: true },
          { id: 'p89', name: 'severity', label: '심각도', type: 'string', required: true },
          { id: 'p90', name: 'message', label: '메시지', type: 'string', required: true },
          { id: 'p91', name: 'triggered_at', label: '발생 시간', type: 'datetime', required: true },
          { id: 'p92', name: 'resolved', label: '해결 여부', type: 'boolean', required: false }
        ], user_id: userId }
      ];

      // 엔티티 생성
      const { data: entities, error: entityError } = await supabase
        .from('ontology_entity_types')
        .insert(retailEntities)
        .select();

      if (entityError) throw entityError;

      // 관계 타입 생성
      const retailRelations = [
        { name: 'visits', label: '방문함', description: '고객이 매장을 방문', source_entity_type: 'Customer', target_entity_type: 'Store', directionality: 'directed', properties: [
          { id: 'r1', name: 'visit_frequency', label: '방문 빈도', type: 'number', required: false }
        ], user_id: userId },
        { name: 'purchases', label: '구매함', description: '고객이 제품을 구매', source_entity_type: 'Customer', target_entity_type: 'Product', directionality: 'directed', properties: [
          { id: 'r2', name: 'quantity', label: '구매 수량', type: 'number', required: true },
          { id: 'r3', name: 'purchase_date', label: '구매 일시', type: 'datetime', required: true }
        ], user_id: userId },
        { name: 'stocks', label: '보유함', description: '매장이 제품 재고 보유', source_entity_type: 'Store', target_entity_type: 'Inventory', directionality: 'directed', properties: [], user_id: userId },
        { name: 'applies_to', label: '적용됨', description: '프로모션이 제품에 적용', source_entity_type: 'Promotion', target_entity_type: 'Product', directionality: 'directed', properties: [], user_id: userId },
        { name: 'forecasts_for', label: '예측함', description: '수요 예측 대상', source_entity_type: 'DemandForecast', target_entity_type: 'Product', directionality: 'directed', properties: [], user_id: userId },
        { name: 'optimizes', label: '최적화함', description: '가격 최적화 대상', source_entity_type: 'PriceOptimization', target_entity_type: 'Product', directionality: 'directed', properties: [], user_id: userId },
        { name: 'targets', label: '타겟함', description: '마케팅 캠페인 타겟', source_entity_type: 'MarketingCampaign', target_entity_type: 'Customer', directionality: 'directed', properties: [], user_id: userId },
        { name: 'generates', label: '생성함', description: '방문이 매출 생성', source_entity_type: 'Visit', target_entity_type: 'Sale', directionality: 'directed', properties: [], user_id: userId },
        { name: 'follows', label: '따름', description: '고객이 동선을 따름', source_entity_type: 'Customer', target_entity_type: 'CustomerPath', directionality: 'directed', properties: [], user_id: userId },
        { name: 'converts_at', label: '전환됨', description: '구매 전환 위치', source_entity_type: 'Visit', target_entity_type: 'PurchaseConversion', directionality: 'directed', properties: [], user_id: userId },
        { name: 'works_at', label: '근무함', description: '직원 근무 매장', source_entity_type: 'StaffSchedule', target_entity_type: 'Store', directionality: 'directed', properties: [], user_id: userId },
        { name: 'analyzed_in', label: '분석됨', description: '구역 분석 대상', source_entity_type: 'Store', target_entity_type: 'ZoneAnalysis', directionality: 'directed', properties: [], user_id: userId },
        { name: 'triggers', label: '트리거함', description: '이벤트가 알림 트리거', source_entity_type: 'Inventory', target_entity_type: 'Alert', directionality: 'directed', properties: [], user_id: userId }
      ];

      const { error: relationError } = await supabase
        .from('ontology_relation_types')
        .insert(retailRelations);

      if (relationError) throw relationError;

      return { entities, relations: retailRelations };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-types'] });
      queryClient.invalidateQueries({ queryKey: ['relation-types'] });
      toast({
        title: "오프라인 리테일 궁극 스키마 생성 완료",
        description: "15개 엔티티 타입과 13개 관계 타입이 생성되었습니다. 매출, 동선, 방문객, 전환율, 수요예측, 재고, 가격최적화, 프로모션 효율성 등 모든 비즈니스 로직이 포함되어 있습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "스키마 생성 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      label: "",
      description: "",
      color: "#3b82f6",
      icon: "Store",
      properties: [],
    });
    setNewProperty({
      name: "",
      label: "",
      type: "string",
      required: false,
      description: "",
    });
    setActiveTab("basic");
  };

  const handleEdit = (entity: EntityType) => {
    setEditingEntity(entity);
    setFormData({
      name: entity.name,
      label: entity.label,
      description: entity.description || "",
      color: entity.color || "#3b82f6",
      icon: entity.icon || "Store",
      properties: entity.properties || [],
    });
    setIsOpen(true);
  };

  const handleAddProperty = () => {
    if (!newProperty.name || !newProperty.label) {
      toast({ title: "속성 이름과 표시명을 입력하세요", variant: "destructive" });
      return;
    }

    const property: PropertyField = {
      id: `prop_${Date.now()}`,
      name: newProperty.name || "",
      label: newProperty.label || "",
      type: newProperty.type || "string",
      required: newProperty.required || false,
      description: newProperty.description,
      defaultValue: newProperty.defaultValue,
      enumValues: newProperty.enumValues,
    };

    setFormData({
      ...formData,
      properties: [...formData.properties, property],
    });

    setNewProperty({
      name: "",
      label: "",
      type: "string",
      required: false,
      description: "",
    });

    toast({ title: "속성이 추가되었습니다" });
  };

  const handleRemoveProperty = (id: string) => {
    setFormData({
      ...formData,
      properties: formData.properties.filter((p) => p.id !== id),
    });
  };

  const handleSubmit = () => {
    if (editingEntity) {
      updateMutation.mutate({ id: editingEntity.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">엔티티 타입 관리</h3>
          <p className="text-sm text-muted-foreground">
            매장, 상품, 고객 등 비즈니스 개체를 정의합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => createDefaultEntitiesMutation.mutate()}
            disabled={createDefaultEntitiesMutation.isPending}
          >
            {createDefaultEntitiesMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Layers className="h-4 w-4 mr-2" />
            )}
            기본 타입 생성
          </Button>
          <Button 
            variant="secondary"
            onClick={() => createRetailSchemaMutation.mutate()}
            disabled={createRetailSchemaMutation.isPending}
          >
            {createRetailSchemaMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Store className="h-4 w-4 mr-2" />
            )}
            오프라인 리테일 궁극 스키마
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingEntity(null); resetForm(); }}>
                <Plus className="h-4 w-4 mr-2" />
                새 엔티티 타입
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEntity ? "엔티티 타입 수정" : "새 엔티티 타입 생성"}
              </DialogTitle>
              <DialogDescription>
                리테일 비즈니스의 주요 개체를 정의하고 속성을 추가하세요
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">기본 정보</TabsTrigger>
                <TabsTrigger value="properties" className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  속성 정의
                  {formData.properties.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {formData.properties.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">이름 (영문, 고유)</Label>
                    <Input
                      id="name"
                      placeholder="store"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="label">표시명 (한글)</Label>
                    <Input
                      id="label"
                      placeholder="매장"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    placeholder="이 엔티티 타입에 대한 설명을 입력하세요"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="icon">아이콘</Label>
                    <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_PRESETS.map((icon) => (
                          <SelectItem key={icon.value} value={icon.value}>
                            {icon.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">색상</Label>
                    <div className="flex gap-2">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-foreground' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setFormData({ ...formData, color })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="properties" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">속성 목록</h4>
                      <p className="text-xs text-muted-foreground">
                        이 엔티티가 가질 데이터 필드를 정의합니다
                      </p>
                    </div>
                  </div>

                  {/* 기존 속성 목록 */}
                  {formData.properties.length > 0 && (
                    <div className="space-y-2">
                      {formData.properties.map((property) => (
                        <Card key={property.id} className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{property.label}</Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {PROPERTY_TYPES.find(t => t.value === property.type)?.label}
                                </Badge>
                                {property.required && (
                                  <Badge variant="destructive" className="text-xs">필수</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {property.name}
                              </p>
                              {property.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {property.description}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleRemoveProperty(property.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* 새 속성 추가 폼 */}
                  <Card className="p-4 bg-muted/50">
                    <h4 className="text-sm font-semibold mb-3">새 속성 추가</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">이름 (영문)</Label>
                          <Input
                            placeholder="price"
                            value={newProperty.name}
                            onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">표시명 (한글)</Label>
                          <Input
                            placeholder="가격"
                            value={newProperty.label}
                            onChange={(e) => setNewProperty({ ...newProperty, label: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">데이터 타입</Label>
                          <Select
                            value={newProperty.type}
                            onValueChange={(value) => setNewProperty({ ...newProperty, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PROPERTY_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="required"
                              checked={newProperty.required}
                              onCheckedChange={(checked) =>
                                setNewProperty({ ...newProperty, required: checked as boolean })
                              }
                            />
                            <Label htmlFor="required" className="text-xs cursor-pointer">
                              필수 항목
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">설명 (선택)</Label>
                        <Textarea
                          placeholder="이 속성에 대한 설명"
                          value={newProperty.description}
                          onChange={(e) => setNewProperty({ ...newProperty, description: e.target.value })}
                          rows={2}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleAddProperty}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        속성 추가
                      </Button>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSubmit}>
                {editingEntity ? "수정" : "생성"}
              </Button>
            </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entities?.map((entity) => (
          <Card key={entity.id} className="glass-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${entity.color}20` }}
                  >
                    {(() => {
                      const IconComponent = ICON_MAP[entity.icon || "Tag"];
                      return IconComponent ? <IconComponent className="h-5 w-5" style={{ color: entity.color || undefined }} /> : <Tag className="h-5 w-5" style={{ color: entity.color || undefined }} />;
                    })()}
                  </div>
                  <div>
                    <CardTitle className="text-base">{entity.label}</CardTitle>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {entity.name}
                      </Badge>
                      {entity.properties && entity.properties.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          속성 {entity.properties.length}개
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(entity)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteMutation.mutate(entity.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {entity.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{entity.description}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {entities?.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">아직 엔티티 타입이 없습니다</p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              첫 엔티티 타입 생성
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
