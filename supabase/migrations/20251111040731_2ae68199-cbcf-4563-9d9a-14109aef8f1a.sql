-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  category TEXT,
  cost_price DECIMAL(10, 2) NOT NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  supplier TEXT,
  lead_time_days INTEGER DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_levels table
CREATE TABLE IF NOT EXISTS public.inventory_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL DEFAULT 0,
  optimal_stock INTEGER NOT NULL,
  minimum_stock INTEGER NOT NULL,
  weekly_demand INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create auto_order_suggestions table
CREATE TABLE IF NOT EXISTS public.auto_order_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL,
  optimal_stock INTEGER NOT NULL,
  suggested_order_quantity INTEGER NOT NULL,
  urgency_level TEXT NOT NULL CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  estimated_stockout_date TIMESTAMP WITH TIME ZONE,
  potential_revenue_loss DECIMAL(10, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'ordered')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_order_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Users can view their own products"
  ON public.products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON public.products FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for inventory_levels
CREATE POLICY "Users can view their own inventory levels"
  ON public.inventory_levels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own inventory levels"
  ON public.inventory_levels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory levels"
  ON public.inventory_levels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory levels"
  ON public.inventory_levels FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for auto_order_suggestions
CREATE POLICY "Users can view their own order suggestions"
  ON public.auto_order_suggestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own order suggestions"
  ON public.auto_order_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own order suggestions"
  ON public.auto_order_suggestions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own order suggestions"
  ON public.auto_order_suggestions FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_inventory_levels_user_id ON public.inventory_levels(user_id);
CREATE INDEX idx_inventory_levels_product_id ON public.inventory_levels(product_id);
CREATE INDEX idx_auto_order_suggestions_user_id ON public.auto_order_suggestions(user_id);
CREATE INDEX idx_auto_order_suggestions_product_id ON public.auto_order_suggestions(product_id);
CREATE INDEX idx_auto_order_suggestions_status ON public.auto_order_suggestions(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_auto_order_suggestions_updated_at
  BEFORE UPDATE ON public.auto_order_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_levels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auto_order_suggestions;