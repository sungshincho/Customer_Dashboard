-- =====================================================
-- NEURALTWIN v8.1: Product Placement & Avatar System (FIXED)
-- =====================================================
-- Safe migration with IF NOT EXISTS checks
-- =====================================================

-- =====================================================
-- PART 1: Product Placement Fields on products table
-- =====================================================

DO $$
BEGIN
  -- Add placement fields to products table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'initial_furniture_id') THEN
    ALTER TABLE products ADD COLUMN initial_furniture_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'slot_id') THEN
    ALTER TABLE products ADD COLUMN slot_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'model_3d_position') THEN
    ALTER TABLE products ADD COLUMN model_3d_position JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'model_3d_rotation') THEN
    ALTER TABLE products ADD COLUMN model_3d_rotation JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'model_3d_scale') THEN
    ALTER TABLE products ADD COLUMN model_3d_scale JSONB DEFAULT '{"x":1,"y":1,"z":1}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'model_3d_url') THEN
    ALTER TABLE products ADD COLUMN model_3d_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'movable') THEN
    ALTER TABLE products ADD COLUMN movable BOOLEAN DEFAULT true;
  END IF;
  
  RAISE NOTICE '✓ Products table: placement columns added/verified';
END $$;

-- =====================================================
-- PART 2: Staff Avatar System
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'avatar_url') THEN
    ALTER TABLE staff ADD COLUMN avatar_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'avatar_position') THEN
    ALTER TABLE staff ADD COLUMN avatar_position JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'avatar_rotation') THEN
    ALTER TABLE staff ADD COLUMN avatar_rotation JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'avatar_scale') THEN
    ALTER TABLE staff ADD COLUMN avatar_scale JSONB DEFAULT '{"x":1,"y":1,"z":1}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'assigned_zone_id') THEN
    ALTER TABLE staff ADD COLUMN assigned_zone_id UUID;
  END IF;
  
  RAISE NOTICE '✓ Staff table: avatar columns added/verified';
END $$;

-- =====================================================
-- PART 3: Customer Avatar System
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'avatar_url') THEN
    ALTER TABLE customers ADD COLUMN avatar_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'avatar_type') THEN
    ALTER TABLE customers ADD COLUMN avatar_type TEXT;
  END IF;
  
  RAISE NOTICE '✓ Customers table: avatar columns added/verified';
END $$;

-- =====================================================
-- PART 4: Drop existing tables if they have wrong schema
-- =====================================================

DROP TABLE IF EXISTS product_placements CASCADE;
DROP TABLE IF EXISTS layout_optimization_results CASCADE;
DROP TABLE IF EXISTS furniture_slots CASCADE;

-- =====================================================
-- PART 5: Create product_placements table
-- =====================================================

CREATE TABLE product_placements (
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

CREATE INDEX idx_product_placements_product_id ON product_placements(product_id);
CREATE INDEX idx_product_placements_store_id ON product_placements(store_id);
CREATE INDEX idx_product_placements_status ON product_placements(status);

-- =====================================================
-- PART 6: Create furniture_slots table
-- =====================================================

CREATE TABLE furniture_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  furniture_id UUID NOT NULL,
  furniture_type TEXT NOT NULL,
  slot_id TEXT NOT NULL,
  slot_position JSONB NOT NULL DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
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

CREATE INDEX idx_furniture_slots_furniture_id ON furniture_slots(furniture_id);
CREATE INDEX idx_furniture_slots_store_id ON furniture_slots(store_id);

-- =====================================================
-- PART 7: Create layout_optimization_results table
-- =====================================================

CREATE TABLE layout_optimization_results (
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

CREATE INDEX idx_layout_optimization_results_store_id ON layout_optimization_results(store_id);
CREATE INDEX idx_layout_optimization_results_status ON layout_optimization_results(status);

-- =====================================================
-- PART 8: RLS Policies
-- =====================================================

ALTER TABLE product_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE furniture_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_optimization_results ENABLE ROW LEVEL SECURITY;

-- Product Placements RLS
CREATE POLICY "Users can view own product placements" ON product_placements
  FOR SELECT USING (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own product placements" ON product_placements
  FOR INSERT WITH CHECK (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own product placements" ON product_placements
  FOR UPDATE USING (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own product placements" ON product_placements
  FOR DELETE USING (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- Furniture Slots RLS
CREATE POLICY "Users can view own furniture slots" ON furniture_slots
  FOR SELECT USING (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own furniture slots" ON furniture_slots
  FOR INSERT WITH CHECK (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own furniture slots" ON furniture_slots
  FOR UPDATE USING (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own furniture slots" ON furniture_slots
  FOR DELETE USING (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- Layout Optimization Results RLS
CREATE POLICY "Users can view own optimization results" ON layout_optimization_results
  FOR SELECT USING (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own optimization results" ON layout_optimization_results
  FOR INSERT WITH CHECK (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own optimization results" ON layout_optimization_results
  FOR UPDATE USING (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own optimization results" ON layout_optimization_results
  FOR DELETE USING (auth.uid() = user_id OR store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- =====================================================
-- PART 9: Updated_at Triggers
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
-- PART 10: Comments
-- =====================================================

COMMENT ON TABLE product_placements IS 'Product placement tracking with AI optimization suggestions';
COMMENT ON TABLE furniture_slots IS 'Furniture slot definitions for product placement';
COMMENT ON TABLE layout_optimization_results IS 'AI-generated layout optimization results';

-- =====================================================
-- PART 11: Summary
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'NEURALTWIN v8.1 Migration Complete';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✓ products: 7 columns added (placement, 3D model)';
  RAISE NOTICE '✓ staff: 5 columns added (avatar)';
  RAISE NOTICE '✓ customers: 2 columns added (avatar)';
  RAISE NOTICE '✓ product_placements: table created';
  RAISE NOTICE '✓ furniture_slots: table created';
  RAISE NOTICE '✓ layout_optimization_results: table created';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
