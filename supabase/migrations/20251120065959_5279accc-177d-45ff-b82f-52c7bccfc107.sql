-- 시뮬레이션 시나리오 저장 테이블
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_id UUID REFERENCES stores(id),
  scenario_type TEXT NOT NULL CHECK (scenario_type IN ('layout', 'pricing', 'inventory', 'demand', 'recommendation', 'staffing', 'promotion')),
  name TEXT NOT NULL,
  description TEXT,
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  baseline_kpi JSONB DEFAULT '{}'::jsonb,
  predicted_kpi JSONB DEFAULT '{}'::jsonb,
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
  ai_insights TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시뮬레이션 결과 저장 테이블
CREATE TABLE simulation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
  result_type TEXT NOT NULL,
  result_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시나리오 비교 그룹 테이블 (A/B 테스트용)
CREATE TABLE scenario_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  scenario_ids UUID[] NOT NULL,
  comparison_type TEXT DEFAULT 'ab_test',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scenarios"
  ON scenarios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scenarios"
  ON scenarios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenarios"
  ON scenarios FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenarios"
  ON scenarios FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view simulation results for their scenarios"
  ON simulation_results FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM scenarios 
    WHERE scenarios.id = simulation_results.scenario_id 
    AND scenarios.user_id = auth.uid()
  ));

CREATE POLICY "Users can create simulation results for their scenarios"
  ON simulation_results FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM scenarios 
    WHERE scenarios.id = simulation_results.scenario_id 
    AND scenarios.user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own scenario comparisons"
  ON scenario_comparisons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scenario comparisons"
  ON scenario_comparisons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenario comparisons"
  ON scenario_comparisons FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenario comparisons"
  ON scenario_comparisons FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_scenarios_updated_at
  BEFORE UPDATE ON scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenario_comparisons_updated_at
  BEFORE UPDATE ON scenario_comparisons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 인덱스 생성
CREATE INDEX idx_scenarios_user_id ON scenarios(user_id);
CREATE INDEX idx_scenarios_store_id ON scenarios(store_id);
CREATE INDEX idx_scenarios_type ON scenarios(scenario_type);
CREATE INDEX idx_scenarios_status ON scenarios(status);
CREATE INDEX idx_simulation_results_scenario_id ON simulation_results(scenario_id);
CREATE INDEX idx_scenario_comparisons_user_id ON scenario_comparisons(user_id);