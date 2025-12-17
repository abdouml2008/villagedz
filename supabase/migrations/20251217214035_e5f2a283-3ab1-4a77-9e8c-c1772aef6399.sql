-- Add email column to user_roles table
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update existing records with emails from auth.users (this will be done via edge function)