-- Create NeuralSense IoT devices table
CREATE TABLE IF NOT EXISTS public.neuralsense_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_name TEXT NOT NULL,
  device_id TEXT NOT NULL UNIQUE,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  raspberry_pi_model TEXT,
  ip_address TEXT,
  mac_address TEXT,
  last_seen TIMESTAMP WITH TIME ZONE,
  wifi_probe_enabled BOOLEAN DEFAULT true,
  probe_interval_seconds INTEGER DEFAULT 5,
  probe_range_meters INTEGER DEFAULT 50,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.neuralsense_devices ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own devices" 
ON public.neuralsense_devices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own devices" 
ON public.neuralsense_devices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices" 
ON public.neuralsense_devices 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices" 
ON public.neuralsense_devices 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_neuralsense_devices_updated_at
BEFORE UPDATE ON public.neuralsense_devices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create WiFi probe data table
CREATE TABLE IF NOT EXISTS public.wifi_probe_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.neuralsense_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  mac_address TEXT NOT NULL,
  signal_strength INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location_zone TEXT,
  device_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wifi_probe_data ENABLE ROW LEVEL SECURITY;

-- Create policies for WiFi probe data
CREATE POLICY "Users can view their own probe data" 
ON public.wifi_probe_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own probe data" 
ON public.wifi_probe_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_neuralsense_devices_user_id ON public.neuralsense_devices(user_id);
CREATE INDEX idx_neuralsense_devices_status ON public.neuralsense_devices(status);
CREATE INDEX idx_wifi_probe_data_device_id ON public.wifi_probe_data(device_id);
CREATE INDEX idx_wifi_probe_data_timestamp ON public.wifi_probe_data(timestamp DESC);