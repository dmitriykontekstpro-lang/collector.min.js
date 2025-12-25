-- ML Dataset Table for Vertex AI Studio
-- Purpose: Store flattened analytics data for lead conversion prediction

CREATE TABLE IF NOT EXISTS ml_dataset (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- TARGET VARIABLE (What we predict)
  target_is_lead BOOLEAN NOT NULL,
  
  -- FEATURES: Engagement Metrics
  total_time_sec INTEGER DEFAULT 0,
  max_scroll_depth_percent INTEGER DEFAULT 0,
  mouse_velocity_px_sec INTEGER DEFAULT 0,
  hover_hesitation_sec NUMERIC DEFAULT 0,
  
  -- FEATURES: Behavior Events
  rage_click_count INTEGER DEFAULT 0,
  tab_switch_count INTEGER DEFAULT 0,
  scroll_direction_changes INTEGER DEFAULT 0,
  text_selection_count INTEGER DEFAULT 0,
  text_copied_count INTEGER DEFAULT 0,
  
  -- FEATURES: Conversion Signals
  fields_filled_count INTEGER DEFAULT 0,
  form_start_time_sec INTEGER,
  
  -- FEATURES: Device & Context
  os_type TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  device_memory_gb NUMERIC,
  hardware_concurrency INTEGER,
  is_working_hours BOOLEAN DEFAULT false,
  is_mobile BOOLEAN DEFAULT false,
  
  -- FEATURES: Traffic Source
  traffic_source_type TEXT,
  utm_campaign TEXT,
  
  -- Metadata
  original_analytics_id BIGINT,
  
  -- Indexes for fast querying
  CONSTRAINT unique_analytics_export UNIQUE (original_analytics_id)
);

-- Index for fast filtering
CREATE INDEX idx_ml_target ON ml_dataset(target_is_lead);
CREATE INDEX idx_ml_created ON ml_dataset(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE ml_dataset IS 'Flattened analytics data prepared for Vertex AI Studio ML training';
COMMENT ON COLUMN ml_dataset.target_is_lead IS 'Target variable: whether user converted to lead (1=yes, 0=no)';
