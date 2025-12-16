-- =====================================================
-- NEURALTWIN: Furniture Table Migration
-- =====================================================
-- Description:
--   1. Create furniture table for 3D furniture assets
--   2. Link furniture_slots to furniture table
--   3. Add furniture position/rotation/scale for 3D rendering
-- =====================================================

-- =====================================================
-- PART 1: Create Furniture Table
-- =====================================================

CREATE TABLE IF NOT EXISTS furniture (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES zones_dim(id) ON DELETE SET NULL,

  -- Furniture identification
  furniture_code TEXT NOT NULL,  -- e.g., 'RACK-001', 'SHELF-001'
  furniture_name TEXT NOT NULL,  -- e.g., '의류 행거 (더블)', '선반 진열대'
  furniture_type TEXT NOT NULL,  -- e.g., 'clothing_rack', 'shelf_display', 'table_display'

  -- Physical properties
  width NUMERIC(6,3),   -- meters
  height NUMERIC(6,3),  -- meters
  depth NUMERIC(6,3),   -- meters

  -- 3D Model
  model_url TEXT,  -- GLB file URL in storage
  thumbnail_url TEXT,  -- Preview image URL

  -- 3D Transform (world coordinates)
  position JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
  rotation JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
  scale JSONB DEFAULT '{"x":1,"y":1,"z":1}'::jsonb,

  -- Behavior
  movable BOOLEAN DEFAULT false,  -- Can be moved by user/AI optimization
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT furniture_code_unique UNIQUE (store_id, furniture_code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_furniture_store_id ON furniture(store_id);
CREATE INDEX IF NOT EXISTS idx_furniture_zone_id ON furniture(zone_id);
CREATE INDEX IF NOT EXISTS idx_furniture_type ON furniture(furniture_type);

-- RLS
ALTER TABLE furniture ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view furniture in their stores" ON furniture
  FOR SELECT USING (
    user_id = auth.uid() OR
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert furniture in their stores" ON furniture
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update furniture in their stores" ON furniture
  FOR UPDATE USING (
    user_id = auth.uid() OR
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete furniture in their stores" ON furniture
  FOR DELETE USING (
    user_id = auth.uid() OR
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

-- =====================================================
-- PART 2: Update furniture_slots FK (if table exists)
-- =====================================================

-- Add FK constraint if furniture_slots exists and doesn't have it
DO $$
BEGIN
  -- Check if furniture_slots table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'furniture_slots') THEN
    -- Check if FK constraint already exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'furniture_slots_furniture_id_fkey'
    ) THEN
      -- Note: We don't add FK here because furniture_slots may have placeholder UUIDs
      -- FK will be validated after proper furniture data is seeded
      RAISE NOTICE 'furniture_slots table exists. FK will be added after data migration.';
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 3: Furniture Type Reference
-- =====================================================

COMMENT ON TABLE furniture IS 'Store furniture assets for 3D digital twin visualization';
COMMENT ON COLUMN furniture.furniture_type IS
'Furniture type categories:
- clothing_rack: 의류 행거 (hanging slots)
- clothing_rack_double: 의류 행거 더블 (hanging slots x2)
- clothing_rack_single: 의류 행거 싱글 (hanging slots)
- shelf_display: 선반 진열대 (shelf slots)
- table_display: 테이블 진열대 (table slots)
- glass_showcase: 유리 쇼케이스 (shelf slots, locked)
- shoe_rack: 신발 진열대 (rack slots)
- accessory_stand: 액세서리 스탠드 (hook slots)
- mannequin: 마네킹 (special)
- checkout_counter: 계산대 (special)
- fitting_room: 피팅룸 (special)';

-- =====================================================
-- PART 4: Create furniture_slots table if not exists
-- =====================================================

CREATE TABLE IF NOT EXISTS furniture_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  furniture_id UUID NOT NULL,  -- Will reference furniture(id) after data migration
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Slot identification
  slot_id TEXT NOT NULL,  -- e.g., 'H1', 'S1-1', 'T1-2'
  furniture_type TEXT NOT NULL,  -- Denormalized for quick access
  slot_type TEXT DEFAULT 'shelf' CHECK (slot_type IN ('hanger', 'shelf', 'table', 'rack', 'hook', 'drawer')),

  -- Slot position (relative to furniture origin)
  slot_position JSONB NOT NULL DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
  slot_rotation JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,

  -- Compatibility
  compatible_display_types TEXT[] DEFAULT ARRAY['standing'],

  -- Size constraints (meters)
  max_product_width NUMERIC(5,3),
  max_product_height NUMERIC(5,3),
  max_product_depth NUMERIC(5,3),

  -- Occupancy
  is_occupied BOOLEAN DEFAULT false,
  occupied_by_product_id UUID,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT furniture_slots_unique UNIQUE (furniture_id, slot_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_furniture_slots_furniture_id ON furniture_slots(furniture_id);
CREATE INDEX IF NOT EXISTS idx_furniture_slots_store_id ON furniture_slots(store_id);
CREATE INDEX IF NOT EXISTS idx_furniture_slots_slot_type ON furniture_slots(slot_type);
CREATE INDEX IF NOT EXISTS idx_furniture_slots_is_occupied ON furniture_slots(is_occupied);

-- RLS
ALTER TABLE furniture_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view slots in their stores" ON furniture_slots
  FOR SELECT USING (
    user_id = auth.uid() OR
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage slots in their stores" ON furniture_slots
  FOR ALL USING (
    user_id = auth.uid() OR
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

-- =====================================================
-- PART 5: Helper Functions
-- =====================================================

-- Function to check slot-product compatibility
CREATE OR REPLACE FUNCTION check_slot_product_compatibility(
  p_slot_id UUID,
  p_product_display_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_compatible_types TEXT[];
BEGIN
  SELECT compatible_display_types INTO v_compatible_types
  FROM furniture_slots
  WHERE id = p_slot_id;

  IF v_compatible_types IS NULL THEN
    RETURN false;
  END IF;

  RETURN p_product_display_type = ANY(v_compatible_types);
END;
$$ LANGUAGE plpgsql;

-- Function to get available slots for a display type
CREATE OR REPLACE FUNCTION get_available_slots_for_display_type(
  p_store_id UUID,
  p_display_type TEXT
) RETURNS TABLE (
  slot_id UUID,
  furniture_id UUID,
  slot_code TEXT,
  slot_type TEXT,
  slot_position JSONB,
  furniture_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fs.id,
    fs.furniture_id,
    fs.slot_id,
    fs.slot_type,
    fs.slot_position,
    fs.furniture_type
  FROM furniture_slots fs
  WHERE fs.store_id = p_store_id
    AND fs.is_occupied = false
    AND p_display_type = ANY(fs.compatible_display_types);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 6: Updated timestamp trigger
-- =====================================================

CREATE OR REPLACE FUNCTION update_furniture_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS furniture_updated_at ON furniture;
CREATE TRIGGER furniture_updated_at
  BEFORE UPDATE ON furniture
  FOR EACH ROW
  EXECUTE FUNCTION update_furniture_updated_at();

DROP TRIGGER IF EXISTS furniture_slots_updated_at ON furniture_slots;
CREATE TRIGGER furniture_slots_updated_at
  BEFORE UPDATE ON furniture_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_furniture_updated_at();
