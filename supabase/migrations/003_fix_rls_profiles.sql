-- ============================================
-- Fix RLS policy conflict on profiles table
-- ============================================

-- The issue: When the trigger handle_new_user() tries to insert into profiles,
-- it fails because there are multiple INSERT policies and all must pass (AND logic).
-- The "Users can insert own profile" policy requires auth.uid() = user_id,
-- but when the trigger runs (AFTER INSERT on auth.users), there's no authenticated
-- session, so auth.uid() returns NULL.

-- Drop the conflicting policy - the "Allow insert for new users" policy already allows all inserts
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Verify remaining policies on profiles
-- Should have:
-- 1. Allow insert for new users (WITH CHECK true)
-- 2. Users can view own profile
-- 3. Users can update own profile
