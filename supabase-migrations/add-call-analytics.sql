-- Add call analytics columns to interactions table
ALTER TABLE interactions
ADD COLUMN IF NOT EXISTS call_transcript TEXT,
ADD COLUMN IF NOT EXISTS call_recording_url TEXT,
ADD COLUMN IF NOT EXISTS call_duration INTEGER,
ADD COLUMN IF NOT EXISTS call_analytics JSONB;

-- Create index for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_interactions_call_analytics ON interactions USING GIN (call_analytics);

COMMENT ON COLUMN interactions.call_transcript IS 'Full transcript of the vishing call';
COMMENT ON COLUMN interactions.call_recording_url IS 'URL to the call recording';
COMMENT ON COLUMN interactions.call_duration IS 'Call duration in seconds';
COMMENT ON COLUMN interactions.call_analytics IS 'Structured analytics data from VAPI including susceptibility, red flags, response analysis, quality metrics, and training recommendations';
