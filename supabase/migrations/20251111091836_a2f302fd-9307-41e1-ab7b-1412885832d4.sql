-- Create table for external data sources
CREATE TABLE public.external_data_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'weather', 'demographics', 'economic', 'social', 'custom'
  api_url TEXT,
  api_key_encrypted TEXT, -- Encrypted API key
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for data synchronization schedules
CREATE TABLE public.data_sync_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data_source_id UUID NOT NULL REFERENCES public.external_data_sources(id) ON DELETE CASCADE,
  schedule_name TEXT NOT NULL,
  cron_expression TEXT NOT NULL, -- e.g., '0 0 * * *' for daily at midnight
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  last_status TEXT, -- 'success', 'failed', 'running'
  error_message TEXT,
  sync_config JSONB DEFAULT '{}'::jsonb, -- Additional sync configuration
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for sync history/logs
CREATE TABLE public.data_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  schedule_id UUID NOT NULL REFERENCES public.data_sync_schedules(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL, -- 'success', 'failed', 'running'
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.external_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sync_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for external_data_sources
CREATE POLICY "Users can view their own data sources"
  ON public.external_data_sources
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own data sources"
  ON public.external_data_sources
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data sources"
  ON public.external_data_sources
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data sources"
  ON public.external_data_sources
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for data_sync_schedules
CREATE POLICY "Users can view their own sync schedules"
  ON public.data_sync_schedules
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync schedules"
  ON public.data_sync_schedules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync schedules"
  ON public.data_sync_schedules
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync schedules"
  ON public.data_sync_schedules
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for data_sync_logs
CREATE POLICY "Users can view their own sync logs"
  ON public.data_sync_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs"
  ON public.data_sync_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_external_data_sources_updated_at
  BEFORE UPDATE ON public.external_data_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_sync_schedules_updated_at
  BEFORE UPDATE ON public.data_sync_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();