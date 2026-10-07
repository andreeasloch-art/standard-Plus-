-- Neue Rolle „busunternehmen“ (eigene Migration: neue Enum-Werte dürfen erst in der nächsten Transaktion benutzt werden)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'busunternehmen';
