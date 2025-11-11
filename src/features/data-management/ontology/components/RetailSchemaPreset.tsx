import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Store, Loader2, Sparkles, AlertTriangle, CheckCircle } from "lucide-react";

export const RetailSchemaPreset = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clearExisting, setClearExisting] = useState(true);

  // 기존 스키마 삭제
  const clearSchemaMutation = useMutation({
    mutationFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error("로그인이 필요합니다");

      // 관계 타입 먼저 삭제
      const { error: relError } = await supabase
        .from('ontology_relation_types')
        .delete()
        .eq('user_id', userId);

      if (relError) throw relError;

      // 엔티티 타입 삭제
      const { error: entError } = await supabase
        .from('ontology_entity_types')
        .delete()
        .eq('user_id', userId);

      if (entError) throw entError;
    },
  });

  // 오프라인 리테일 궁극 스키마 생성
  const createRetailSchemaMutation = useMutation({
    mutationFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error("로그인이 필요합니다");

      // 기존 스키마 삭제 옵션
      if (clearExisting) {
        await clearSchemaMutation.mutateAsync();
      }
      
      // 오프라인 리테일 궁극 스키마 - 모든 비즈니스 로직 포함
      const retailEntities = [
        { name: 'Store', label: '매장', description: '물리적 매장 위치', color: '#3b82f6', icon: 'Store', properties: [
          { id: 'prop_store_code', name: 'store_code', label: '매장 코드', type: 'string', required: true },
          { id: 'prop_store_name', name: 'name', label: '매장명', type: 'string', required: true },
          { id: 'prop_store_location', name: 'location', label: '주소', type: 'string', required: true },
          { id: 'prop_store_area', name: 'area_sqm', label: '매장 면적(㎡)', type: 'number', required: false },
          { id: 'prop_store_opening', name: 'opening_date', label: '오픈일', type: 'date', required: false },
          { id: 'prop_store_traffic', name: 'daily_traffic', label: '일일 방문객 수', type: 'number', required: false }
        ], user_id: userId },
        { name: 'Customer', label: '고객', description: '고객 정보', color: '#8b5cf6', icon: 'Users', properties: [
          { id: 'prop_customer_id', name: 'customer_id', label: '고객 ID', type: 'string', required: true },
          { id: 'prop_customer_name', name: 'name', label: '고객명', type: 'string', required: false },
          { id: 'prop_customer_segment', name: 'segment', label: '고객 세그먼트', type: 'string', required: false },
          { id: 'prop_customer_loyalty', name: 'loyalty_level', label: '로열티 등급', type: 'string', required: false },
          { id: 'prop_customer_ltv', name: 'lifetime_value', label: '고객 생애 가치(LTV)', type: 'number', required: false },
          { id: 'prop_customer_churn', name: 'churn_risk_score', label: '이탈 위험 점수', type: 'number', required: false }
        ], user_id: userId },
        { name: 'Product', label: '제품', description: '판매 제품 정보', color: '#10b981', icon: 'Package', properties: [
          { id: 'prop_product_sku', name: 'sku', label: 'SKU 코드', type: 'string', required: true },
          { id: 'prop_product_name', name: 'name', label: '제품명', type: 'string', required: true },
          { id: 'prop_product_category', name: 'category', label: '카테고리', type: 'string', required: false },
          { id: 'prop_product_price', name: 'price', label: '가격', type: 'number', required: true },
          { id: 'prop_product_cost', name: 'cost', label: '원가', type: 'number', required: false },
          { id: 'prop_product_margin', name: 'margin_rate', label: '마진율(%)', type: 'number', required: false },
          { id: 'prop_product_elasticity', name: 'price_elasticity', label: '가격 탄력성', type: 'number', required: false },
          { id: 'prop_product_optimal', name: 'optimal_price', label: '최적 가격', type: 'number', required: false }
        ], user_id: userId },
        { name: 'Sale', label: '매출', description: '판매 트랜잭션', color: '#f59e0b', icon: 'ShoppingCart', properties: [
          { id: 'prop_sale_txid', name: 'transaction_id', label: '거래 ID', type: 'string', required: true },
          { id: 'prop_sale_amount', name: 'amount', label: '거래 금액', type: 'number', required: true },
          { id: 'prop_sale_timestamp', name: 'timestamp', label: '거래 시간', type: 'datetime', required: true },
          { id: 'prop_sale_payment', name: 'payment_method', label: '결제 수단', type: 'string', required: false },
          { id: 'prop_sale_discount', name: 'discount_applied', label: '할인 금액', type: 'number', required: false },
          { id: 'prop_sale_profit', name: 'profit', label: '순이익', type: 'number', required: false }
        ], user_id: userId },
        { name: 'Visit', label: '방문', description: '고객 매장 방문 기록', color: '#ec4899', icon: 'MapPin', properties: [
          { id: 'prop_visit_id', name: 'visit_id', label: '방문 ID', type: 'string', required: true },
          { id: 'prop_visit_entry', name: 'entry_time', label: '입장 시간', type: 'datetime', required: true },
          { id: 'prop_visit_exit', name: 'exit_time', label: '퇴장 시간', type: 'datetime', required: false },
          { id: 'prop_visit_dwell', name: 'dwell_time_minutes', label: '체류 시간(분)', type: 'number', required: false },
          { id: 'prop_visit_zones', name: 'zones_visited', label: '방문 구역', type: 'array', required: false },
          { id: 'prop_visit_converted', name: 'converted_to_sale', label: '구매 전환 여부', type: 'boolean', required: false }
        ], user_id: userId },
        { name: 'CustomerPath', label: '고객 동선', description: '매장 내 이동 경로', color: '#06b6d4', icon: 'Navigation', properties: [
          { id: 'prop_path_id', name: 'path_id', label: '동선 ID', type: 'string', required: true },
          { id: 'prop_path_sequence', name: 'sequence', label: '이동 경로 순서', type: 'array', required: true },
          { id: 'prop_path_distance', name: 'total_distance', label: '총 이동 거리(m)', type: 'number', required: false },
          { id: 'prop_path_efficiency', name: 'path_efficiency_score', label: '동선 효율성 점수', type: 'number', required: false },
          { id: 'prop_path_bottleneck', name: 'bottleneck_zones', label: '병목 구역', type: 'array', required: false }
        ], user_id: userId },
        { name: 'Inventory', label: '재고', description: '제품 재고 정보', color: '#f97316', icon: 'Box', properties: [
          { id: 'prop_inv_id', name: 'inventory_id', label: '재고 ID', type: 'string', required: true },
          { id: 'prop_inv_current', name: 'current_stock', label: '현재 재고', type: 'number', required: true },
          { id: 'prop_inv_optimal', name: 'optimal_stock', label: '최적 재고', type: 'number', required: false },
          { id: 'prop_inv_reorder', name: 'reorder_point', label: '재주문 시점', type: 'number', required: false },
          { id: 'prop_inv_risk', name: 'stockout_risk', label: '품절 위험도(%)', type: 'number', required: false },
          { id: 'prop_inv_turnover', name: 'turnover_rate', label: '재고 회전율', type: 'number', required: false },
          { id: 'prop_inv_cost', name: 'holding_cost', label: '재고 유지 비용', type: 'number', required: false }
        ], user_id: userId },
        { name: 'DemandForecast', label: '수요 예측', description: '미래 수요 예측', color: '#84cc16', icon: 'TrendingUp', properties: [
          { id: 'prop_forecast_id', name: 'forecast_id', label: '예측 ID', type: 'string', required: true },
          { id: 'prop_forecast_date', name: 'forecast_date', label: '예측 날짜', type: 'date', required: true },
          { id: 'prop_forecast_demand', name: 'predicted_demand', label: '예측 수요량', type: 'number', required: true },
          { id: 'prop_forecast_confidence', name: 'confidence_level', label: '신뢰도(%)', type: 'number', required: false },
          { id: 'prop_forecast_season', name: 'seasonality_factor', label: '계절성 요인', type: 'number', required: false },
          { id: 'prop_forecast_trend', name: 'trend_factor', label: '트렌드 요인', type: 'number', required: false }
        ], user_id: userId },
        { name: 'PriceOptimization', label: '가격 최적화', description: '동적 가격 최적화', color: '#eab308', icon: 'DollarSign', properties: [
          { id: 'prop_price_opt_id', name: 'optimization_id', label: '최적화 ID', type: 'string', required: true },
          { id: 'prop_price_current', name: 'current_price', label: '현재 가격', type: 'number', required: true },
          { id: 'prop_price_recommended', name: 'recommended_price', label: '권장 가격', type: 'number', required: true },
          { id: 'prop_price_lift', name: 'expected_revenue_lift', label: '예상 매출 증가율(%)', type: 'number', required: false },
          { id: 'prop_price_competitor', name: 'competitor_price', label: '경쟁사 가격', type: 'number', required: false },
          { id: 'prop_price_wtp', name: 'wtp_average', label: '평균 지불의향가격', type: 'number', required: false }
        ], user_id: userId },
        { name: 'Promotion', label: '프로모션', description: '오프라인 프로모션', color: '#ef4444', icon: 'Percent', properties: [
          { id: 'prop_promo_id', name: 'promotion_id', label: '프로모션 ID', type: 'string', required: true },
          { id: 'prop_promo_name', name: 'name', label: '프로모션명', type: 'string', required: true },
          { id: 'prop_promo_discount', name: 'discount_rate', label: '할인율(%)', type: 'number', required: false },
          { id: 'prop_promo_start', name: 'start_date', label: '시작일', type: 'date', required: true },
          { id: 'prop_promo_end', name: 'end_date', label: '종료일', type: 'date', required: true },
          { id: 'prop_promo_effective', name: 'effectiveness_score', label: '효과성 점수', type: 'number', required: false },
          { id: 'prop_promo_roi', name: 'roi', label: 'ROI(%)', type: 'number', required: false }
        ], user_id: userId },
        { name: 'MarketingCampaign', label: '마케팅 캠페인', description: '오프라인 마케팅 캠페인', color: '#a855f7', icon: 'Zap', properties: [
          { id: 'prop_campaign_id', name: 'campaign_id', label: '캠페인 ID', type: 'string', required: true },
          { id: 'prop_campaign_name', name: 'name', label: '캠페인명', type: 'string', required: true },
          { id: 'prop_campaign_budget', name: 'budget', label: '예산', type: 'number', required: false },
          { id: 'prop_campaign_reach', name: 'reach', label: '도달 수', type: 'number', required: false },
          { id: 'prop_campaign_conversion', name: 'conversion_rate', label: '전환율(%)', type: 'number', required: false },
          { id: 'prop_campaign_cpa', name: 'cost_per_acquisition', label: '고객 획득 비용', type: 'number', required: false },
          { id: 'prop_campaign_suit', name: 'suitability_score', label: '적합성 점수', type: 'number', required: false }
        ], user_id: userId },
        { name: 'PurchaseConversion', label: '구매 전환', description: '방문-구매 전환 분석', color: '#14b8a6', icon: 'CheckCircle', properties: [
          { id: 'prop_conv_id', name: 'conversion_id', label: '전환 ID', type: 'string', required: true },
          { id: 'prop_conv_rate', name: 'conversion_rate', label: '전환율(%)', type: 'number', required: true },
          { id: 'prop_conv_basket', name: 'average_basket_size', label: '평균 장바구니 크기', type: 'number', required: false },
          { id: 'prop_conv_factors', name: 'conversion_factors', label: '전환 영향 요인', type: 'array', required: false },
          { id: 'prop_conv_abandon', name: 'abandonment_rate', label: '이탈율(%)', type: 'number', required: false }
        ], user_id: userId },
        { name: 'StaffSchedule', label: '직원 스케줄', description: '직원 근무 스케줄링', color: '#6366f1', icon: 'Calendar', properties: [
          { id: 'prop_staff_schedule_id', name: 'schedule_id', label: '스케줄 ID', type: 'string', required: true },
          { id: 'prop_staff_start', name: 'shift_start', label: '근무 시작', type: 'datetime', required: true },
          { id: 'prop_staff_end', name: 'shift_end', label: '근무 종료', type: 'datetime', required: true },
          { id: 'prop_staff_efficiency', name: 'efficiency_score', label: '효율성 점수', type: 'number', required: false },
          { id: 'prop_staff_cost', name: 'labor_cost', label: '인건비', type: 'number', required: false }
        ], user_id: userId },
        { name: 'ZoneAnalysis', label: '구역 분석', description: '매장 구역별 분석', color: '#64748b', icon: 'Target', properties: [
          { id: 'prop_zone_id', name: 'zone_id', label: '구역 ID', type: 'string', required: true },
          { id: 'prop_zone_name', name: 'zone_name', label: '구역명', type: 'string', required: true },
          { id: 'prop_zone_traffic', name: 'traffic_density', label: '트래픽 밀도', type: 'number', required: false },
          { id: 'prop_zone_dwell', name: 'dwell_time_avg', label: '평균 체류 시간', type: 'number', required: false },
          { id: 'prop_zone_conversion', name: 'conversion_rate', label: '전환율(%)', type: 'number', required: false },
          { id: 'prop_zone_revenue', name: 'revenue_per_sqm', label: '평당 매출', type: 'number', required: false }
        ], user_id: userId },
        { name: 'Alert', label: '알림', description: '비즈니스 알림 및 경고', color: '#dc2626', icon: 'AlertTriangle', properties: [
          { id: 'prop_alert_id', name: 'alert_id', label: '알림 ID', type: 'string', required: true },
          { id: 'prop_alert_type', name: 'type', label: '알림 유형', type: 'string', required: true },
          { id: 'prop_alert_severity', name: 'severity', label: '심각도', type: 'string', required: true },
          { id: 'prop_alert_message', name: 'message', label: '메시지', type: 'string', required: true },
          { id: 'prop_alert_triggered', name: 'triggered_at', label: '발생 시간', type: 'datetime', required: true },
          { id: 'prop_alert_resolved', name: 'resolved', label: '해결 여부', type: 'boolean', required: false }
        ], user_id: userId }
      ];

      // 엔티티 생성
      const { data: entities, error: entityError } = await supabase
        .from('ontology_entity_types')
        .insert(retailEntities)
        .select();

      if (entityError) {
        console.error("엔티티 생성 오류:", entityError);
        throw entityError;
      }

      // 관계 타입 생성
      const retailRelations = [
        { name: 'visits', label: '방문함', description: '고객이 매장을 방문', source_entity_type: 'Customer', target_entity_type: 'Store', directionality: 'directed', properties: [], user_id: userId },
        { name: 'purchases', label: '구매함', description: '고객이 제품을 구매', source_entity_type: 'Customer', target_entity_type: 'Product', directionality: 'directed', properties: [], user_id: userId },
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

      if (relationError) {
        console.error("관계 생성 오류:", relationError);
        throw relationError;
      }

      return { entities, relations: retailRelations };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-types'] });
      queryClient.invalidateQueries({ queryKey: ['relation-types'] });
      toast({
        title: "오프라인 리테일 궁극 스키마 생성 완료",
        description: "15개 엔티티 타입과 13개 관계 타입이 생성되었습니다.",
      });
    },
    onError: (error: any) => {
      console.error("스키마 생성 오류:", error);
      toast({
        title: "스키마 생성 실패",
        description: error.message || "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const isLoading = createRetailSchemaMutation.isPending || clearSchemaMutation.isPending;

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <CardTitle>오프라인 리테일 궁극 스키마</CardTitle>
              <Badge variant="secondary" className="bg-primary/10">
                <Sparkles className="h-3 w-3 mr-1" />
                프리셋
              </Badge>
            </div>
            <CardDescription>
              매출, 동선, 방문객, 전환율, 수요예측, 재고, 가격최적화, 프로모션 효율성 등 
              오프라인 리테일 비즈니스의 모든 핵심 로직을 포함한 완성형 스키마
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">포함된 엔티티 (15개)</div>
              <div className="text-sm grid grid-cols-3 gap-2">
                <span>• 매장 (Store)</span>
                <span>• 고객 (Customer)</span>
                <span>• 제품 (Product)</span>
                <span>• 매출 (Sale)</span>
                <span>• 방문 (Visit)</span>
                <span>• 고객 동선 (CustomerPath)</span>
                <span>• 재고 (Inventory)</span>
                <span>• 수요 예측 (DemandForecast)</span>
                <span>• 가격 최적화 (PriceOptimization)</span>
                <span>• 프로모션 (Promotion)</span>
                <span>• 마케팅 캠페인 (MarketingCampaign)</span>
                <span>• 구매 전환 (PurchaseConversion)</span>
                <span>• 직원 스케줄 (StaffSchedule)</span>
                <span>• 구역 분석 (ZoneAnalysis)</span>
                <span>• 알림 (Alert)</span>
              </div>
              <div className="font-medium mt-3">관계 타입 (13개)</div>
              <div className="text-sm">
                방문, 구매, 재고 보유, 프로모션 적용, 수요 예측, 가격 최적화, 
                캠페인 타겟, 매출 생성, 동선 추적, 전환 분석, 직원 배치, 구역 분석, 알림 트리거
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">중요: 중복 오류 방지</div>
              <div className="text-sm">
                이미 같은 이름의 엔티티나 관계가 존재하는 경우 생성이 실패합니다. 
                기존 스키마를 삭제하고 새로 생성하려면 아래 옵션을 체크하세요.
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex items-center space-x-2 p-4 rounded-lg bg-muted/50">
          <Checkbox
            id="clear-existing"
            checked={clearExisting}
            onCheckedChange={(checked) => setClearExisting(checked as boolean)}
          />
          <Label
            htmlFor="clear-existing"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            기존 스키마를 모두 삭제하고 새로 생성
          </Label>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={() => createRetailSchemaMutation.mutate()}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Store className="mr-2 h-5 w-5" />
              오프라인 리테일 궁극 스키마 생성
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
