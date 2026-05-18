-- ============================================================
--  LokSetu 2.0 — Supabase PostgreSQL Schema
--  Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. Profiles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id        UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name      TEXT NOT NULL,
  phone     TEXT NOT NULL UNIQUE,
  area      TEXT NOT NULL,
  role      TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Complaints ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaints (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category      TEXT NOT NULL CHECK (category IN ('electricity','road','water','sanitation')),
  description   TEXT NOT NULL,
  photo_url     TEXT,
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  location_name TEXT,
  area          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','in_progress','resolved','cancelled')),
  upvote_count  INT NOT NULL DEFAULT 0,
  is_escalated  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_citizen   ON complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status    ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category  ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_escalated ON complaints(is_escalated);

-- ── 3. Upvotes ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS upvotes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  citizen_id   UUID NOT NULL REFERENCES profiles(id)   ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(complaint_id, citizen_id)
);

-- ── 4. Complaint Updates (admin remarks) ──────────────────────
CREATE TABLE IF NOT EXISTS complaint_updates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  admin_id     UUID NOT NULL REFERENCES profiles(id),
  new_status   TEXT NOT NULL,
  remark       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_updates_complaint ON complaint_updates(complaint_id);

-- ── 5. Notifications ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id   UUID NOT NULL REFERENCES profiles(id)   ON DELETE CASCADE,
  complaint_id UUID          REFERENCES complaints(id) ON DELETE CASCADE,
  message      TEXT NOT NULL,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_citizen ON notifications(citizen_id);

-- ── 6. RPC functions for upvote count ─────────────────────────
CREATE OR REPLACE FUNCTION increment_upvote(complaint_id_input UUID)
RETURNS VOID AS $$
  UPDATE complaints SET upvote_count = upvote_count + 1 WHERE id = complaint_id_input;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_upvote(complaint_id_input UUID)
RETURNS VOID AS $$
  UPDATE complaints SET upvote_count = GREATEST(0, upvote_count - 1) WHERE id = complaint_id_input;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ── 7. Row Level Security ─────────────────────────────────────
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints        ENABLE ROW LEVEL SECURITY;
ALTER TABLE upvotes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;

-- Profiles: users can see their own; admins see all
CREATE POLICY "profiles_self"  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_admin" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Complaints: citizens see own; admins see all; anyone can read for upvote context
CREATE POLICY "complaints_citizen_select" ON complaints FOR SELECT USING (
  citizen_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "complaints_citizen_insert" ON complaints FOR INSERT WITH CHECK (
  citizen_id = auth.uid()
);
CREATE POLICY "complaints_admin_update" ON complaints FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Upvotes: own only
CREATE POLICY "upvotes_own" ON upvotes FOR ALL USING (citizen_id = auth.uid());

-- Complaint updates: admins insert; all authenticated can read
CREATE POLICY "updates_read"  ON complaint_updates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "updates_admin" ON complaint_updates FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Notifications: own only
CREATE POLICY "notif_own" ON notifications FOR ALL USING (citizen_id = auth.uid());

-- ── 8. Realtime ───────────────────────────────────────────────
-- Enable realtime for live updates (run in Supabase Realtime settings or via SQL)
-- ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
