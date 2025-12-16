-- =====================================================
-- NEURALTWIN v8.1: Product Placement & Avatar System
-- =====================================================
-- Description:
--   1. Add product placement fields for furniture-product mapping
--   2. Add avatar fields to staff table for 3D visualization
--   3. Add avatar fields to customers table for simulation
-- =====================================================

-- =====================================================
-- PART 1: Product Placement System
-- =====================================================

-- Add placement fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS initial_furniture_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS slot_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS model_3d_position JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS model_3d_rotation JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS model_3d_scale JSONB DEFAULT '{"x":1,"y":1,"z":1}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS model_3d_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS movable BOOLEAN DEFAULT true;

-- Create product_placements table for optimization history
CREATE TABLE IF NOT EXISTS product_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Current placement
  current_zone_id UUID,
  current_furniture_id UUID,
  current_slot_id TEXT,
  current_position JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
  current_rotation JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,

  -- Suggested placement (from AI optimization)
  suggested_zone_id UUID,
  suggested_furniture_id UUID,
  suggested_slot_id TEXT,
  suggested_position JSONB,
  suggested_rotation JSONB,

  -- Optimization metadata
  optimization_reason TEXT,
  expected_revenue_impact NUMERIC(5,2),
  expected_visibility_score NUMERIC(3,2),
  expected_accessibility_score NUMERIC(3,2),
  confidence NUMERIC(3,2),
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected', 'expired')),
  applied_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for product placements
CREATE INDEX IF NOT EXISTS idx_product_placements_product_id ON product_placements(product_id);
CREATE INDEX IF NOT EXISTS idx_product_placements_store_id ON product_placements(store_id);
CREATE INDEX IF NOT EXISTS idx_product_placements_status ON product_placements(status);

-- =====================================================
-- PART 2: Staff Avatar System
-- =====================================================

-- Add avatar fields to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS avatar_position JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS avatar_rotation JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS avatar_scale JSONB DEFAULT '{"x":1,"y":1,"z":1}'::jsonb;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS assigned_zone_id UUID;

-- =====================================================
-- PART 3: Customer Avatar System
-- =====================================================

-- Add avatar fields to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS avatar_type TEXT CHECK (avatar_type IN ('vip', 'regular', 'new'));

-- =====================================================
-- PART 4: Furniture Slots Table
-- =====================================================

-- Create furniture_slots table for slot management
CREATE TABLE IF NOT EXISTS furniture_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  furniture_id UUID NOT NULL,
  furniture_type TEXT NOT NULL,
  slot_id TEXT NOT NULL,
  slot_position JSONB NOT NULL, -- relative position within furniture
  slot_rotation JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
  max_product_width NUMERIC(5,2),
  max_product_height NUMERIC(5,2),
  max_product_depth NUMERIC(5,2),
  is_occupied BOOLEAN DEFAULT false,
  occupied_by_product_id UUID,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(furniture_id, slot_id)
);

CREATE INDEX IF NOT EXISTS idx_furniture_slots_furniture_id ON furniture_slots(furniture_id);
CREATE INDEX IF NOT EXISTS idx_furniture_slots_store_id ON furniture_slots(store_id);

-- =====================================================
-- PART 5: Layout Optimization Results Table
-- =====================================================

-- Create layout_optimization_results table
CREATE TABLE IF NOT EXISTS layout_optimization_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  optimization_type TEXT NOT NULL CHECK (optimization_type IN ('furniture', 'product', 'both')),

  -- Results
  furniture_changes JSONB DEFAULT '[]'::jsonb,
  product_changes JSONB DEFAULT '[]'::jsonb,

  -- Summary
  total_furniture_changes INTEGER DEFAULT 0,
  total_product_changes INTEGER DEFAULT 0,
  expected_revenue_improvement NUMERIC(5,2),
  expected_traffic_improvement NUMERIC(5,2),
  expected_conversion_improvement NUMERIC(5,2),

  -- Status
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'reviewing', 'approved', 'applied', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_layout_optimization_results_store_id ON layout_optimization_results(store_id);
CREATE INDEX IF NOT EXISTS idx_layout_optimization_results_status ON layout_optimization_results(status);

-- =====================================================
-- PART 6: RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE product_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE furniture_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_optimization_results ENABLE ROW LEVEL SECURITY;

-- Product Placements RLS
CREATE POLICY "Users can view own product placements" ON product_placements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own product placements" ON product_placements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own product placements" ON product_placements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own product placements" ON product_placements
  FOR DELETE USING (auth.uid() = user_id);

-- Furniture Slots RLS
CREATE POLICY "Users can view own furniture slots" ON furniture_slots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own furniture slots" ON furniture_slots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own furniture slots" ON furniture_slots
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own furniture slots" ON furniture_slots
  FOR DELETE USING (auth.uid() = user_id);

-- Layout Optimization Results RLS
CREATE POLICY "Users can view own optimization results" ON layout_optimization_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own optimization results" ON layout_optimization_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own optimization results" ON layout_optimization_results
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own optimization results" ON layout_optimization_results
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- PART 7: Updated_at Triggers
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_product_placements_updated_at ON product_placements;
CREATE TRIGGER update_product_placements_updated_at
  BEFORE UPDATE ON product_placements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_furniture_slots_updated_at ON furniture_slots;
CREATE TRIGGER update_furniture_slots_updated_at
  BEFORE UPDATE ON furniture_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_layout_optimization_results_updated_at ON layout_optimization_results;
CREATE TRIGGER update_layout_optimization_results_updated_at
  BEFORE UPDATE ON layout_optimization_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE product_placements IS 'Product placement tracking with AI optimization suggestions';
COMMENT ON TABLE furniture_slots IS 'Furniture slot definitions for product placement';
COMMENT ON TABLE layout_optimization_results IS 'AI-generated layout optimization results';

COMMENT ON COLUMN staff.avatar_url IS '3D avatar model URL for staff visualization';
COMMENT ON COLUMN staff.avatar_position IS '3D position of staff avatar in store';
COMMENT ON COLUMN staff.avatar_rotation IS '3D rotation of staff avatar';
COMMENT ON COLUMN staff.avatar_scale IS '3D scale of staff avatar';

COMMENT ON COLUMN customers.avatar_url IS '3D avatar model URL for customer simulation';
COMMENT ON COLUMN customers.avatar_type IS 'Customer segment type for avatar selection (vip/regular/new)';

COMMENT ON COLUMN products.initial_furniture_id IS 'Initial furniture where product is placed';
COMMENT ON COLUMN products.slot_id IS 'Slot ID within the furniture (A1, B2, etc.)';
COMMENT ON COLUMN products.model_3d_position IS '3D position of product model';
COMMENT ON COLUMN products.model_3d_url IS '3D model URL for product visualization';
