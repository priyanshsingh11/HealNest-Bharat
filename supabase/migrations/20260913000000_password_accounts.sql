-- HealNest Bharat — email + password accounts.
--
-- Customers and caretakers now log in with an email and password held by Supabase Auth, linked to their app account
-- through app_users.auth_user_id (20260911010000_auth.sql). Device-bound accounts are gone, and with them the table
-- that recorded which browser could open which account. Safe to run whether or not that table was ever created.

drop table if exists public.account_devices;
