-- Add learning_viewed_at column and LEARNING_VIEWED state to interactions table

-- Add the new column
ALTER TABLE interactions
ADD COLUMN learning_viewed_at timestamptz;

-- Update the state constraint to include LEARNING_VIEWED
ALTER TABLE interactions
DROP CONSTRAINT IF EXISTS interactions_state_check;

ALTER TABLE interactions
ADD CONSTRAINT interactions_state_check
CHECK (state IN ('PENDING','DELIVERED','LINK_CLICKED','CREDENTIALS_SUBMITTED','LEARNING_VIEWED','REPORTED','NO_INTERACTION'));
