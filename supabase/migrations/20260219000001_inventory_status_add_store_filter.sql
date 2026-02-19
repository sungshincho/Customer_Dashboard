-- =====================================================
-- get_inventory_status: p_store_id 파라미터 추가
--
-- 변경: products.store_id 기반 매장 필터링 추가
-- 목적: 멀티스토어 환경에서 현재 매장의 재고만 조회
-- 기존 p_org_id만 사용하던 것에 p_store_id 추가
-- p_store_id가 NULL이면 기존 동작(org 전체) 유지
-- Date: 2026-02-19
-- =====================================================

DROP FUNCTION IF EXISTS public.get_inventory_status(uuid);

CREATE OR REPLACE FUNCTION public.get_inventory_status(
  p_org_id uuid,
  p_store_id uuid DEFAULT NULL
)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  sku text,
  category text,
  price numeric,
  current_stock integer,
  minimum_stock integer,
  optimal_stock integer,
  weekly_demand numeric,
  stock_status text,
  days_until_stockout integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    il.product_id,
    COALESCE(pr.product_name, 'Unknown') AS product_name,
    COALESCE(pr.sku, '') AS sku,
    COALESCE(pr.category, '기타') AS category,
    pr.price,
    il.current_stock,
    il.minimum_stock,
    il.optimal_stock,
    il.weekly_demand,
    CASE
      WHEN il.current_stock <= il.minimum_stock THEN 'critical'
      WHEN il.current_stock < (il.optimal_stock * 0.5)::integer THEN 'low'
      WHEN il.current_stock > (il.optimal_stock * 1.5)::integer THEN 'overstock'
      ELSE 'normal'
    END AS stock_status,
    CASE
      WHEN il.weekly_demand IS NOT NULL AND il.weekly_demand > 0
        THEN FLOOR(il.current_stock * 7.0 / il.weekly_demand)::integer
      ELSE NULL
    END AS days_until_stockout
  FROM inventory_levels il
  LEFT JOIN products pr ON pr.id = il.product_id
  WHERE il.org_id = p_org_id
    AND (p_store_id IS NULL OR pr.store_id = p_store_id);
$$;

GRANT EXECUTE ON FUNCTION public.get_inventory_status(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_inventory_status(uuid, uuid) TO service_role;

COMMENT ON FUNCTION public.get_inventory_status IS '재고 현황 조회 - p_store_id 추가로 매장별 필터링 지원 (NULL이면 org 전체)';
