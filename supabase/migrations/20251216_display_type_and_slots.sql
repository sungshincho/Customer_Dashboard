-- =====================================================
-- NEURALTWIN v8.2: Display Type & Slot Compatibility
-- =====================================================
-- Description:
--   1. Add display_type to products (hanging, folded, standing, etc.)
--   2. Add compatible_display_types to furniture_slots
--   3. Add slot compatibility validation
-- =====================================================

-- =====================================================
-- PART 1: Product Display Type
-- =====================================================

-- Display type enum-like check
ALTER TABLE products ADD COLUMN IF NOT EXISTS display_type TEXT
  DEFAULT 'standing'
  CHECK (display_type IN ('hanging', 'folded', 'standing', 'boxed', 'stacked'));

COMMENT ON COLUMN products.display_type IS 'Product display form: hanging(걸림), folded(접힘), standing(세움), boxed(박스), stacked(적층)';

-- =====================================================
-- PART 2: Slot Compatibility Extension
-- =====================================================

-- Add compatible display types to furniture_slots
ALTER TABLE furniture_slots ADD COLUMN IF NOT EXISTS compatible_display_types TEXT[]
  DEFAULT ARRAY['standing'];

-- Add slot type for better categorization
ALTER TABLE furniture_slots ADD COLUMN IF NOT EXISTS slot_type TEXT
  DEFAULT 'shelf'
  CHECK (slot_type IN ('hanger', 'shelf', 'table', 'rack', 'hook', 'drawer'));

COMMENT ON COLUMN furniture_slots.compatible_display_types IS 'Array of compatible display types for this slot';
COMMENT ON COLUMN furniture_slots.slot_type IS 'Physical slot type: hanger, shelf, table, rack, hook, drawer';

-- =====================================================
-- PART 3: Furniture Type to Slot Type Mapping Reference
-- =====================================================

/*
Furniture Type → Default Slot Types & Compatible Display Types:

| Furniture Type      | Slot Type | Compatible Display Types       |
|---------------------|-----------|--------------------------------|
| clothing_rack       | hanger    | hanging                        |
| display_table       | table     | folded, boxed                  |
| wall_shelf          | shelf     | standing, folded, boxed        |
| glass_showcase      | shelf     | standing, boxed                |
| shoe_rack           | rack      | standing                       |
| accessory_stand     | hook      | hanging, standing              |
| mannequin           | -         | (mannequin은 슬롯 없음)         |
| checkout_counter    | shelf     | standing, boxed                |
| fitting_room_bench  | table     | folded                         |
*/

-- =====================================================
-- PART 4: Validation Function
-- =====================================================

CREATE OR REPLACE FUNCTION check_slot_display_compatibility(
  p_slot_id UUID,
  p_product_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_slot_display_types TEXT[];
  v_product_display_type TEXT;
BEGIN
  -- Get slot compatible types
  SELECT compatible_display_types INTO v_slot_display_types
  FROM furniture_slots WHERE id = p_slot_id;

  -- Get product display type
  SELECT display_type INTO v_product_display_type
  FROM products WHERE id = p_product_id;

  -- Check compatibility
  RETURN v_product_display_type = ANY(v_slot_display_types);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_slot_display_compatibility IS 'Check if product display type is compatible with slot';
