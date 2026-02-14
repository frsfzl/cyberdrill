-- Add VAPI voice call support columns to campaigns table
-- Run this in Supabase SQL Editor

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS delivery_method text NOT NULL DEFAULT 'email'
  CHECK (delivery_method IN ('email','vapi','both')),
ADD COLUMN IF NOT EXISTS vapi_delay_minutes integer NOT NULL DEFAULT 5;

-- Remove old Retell columns if they exist
ALTER TABLE campaigns
DROP COLUMN IF EXISTS enable_vishing,
DROP COLUMN IF EXISTS vishing_delay_minutes;
