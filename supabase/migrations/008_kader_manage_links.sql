-- Migration 008: Allow Kader to manage parent-child links
-- This enables parents to see their children's data

CREATE POLICY "otb_kader_all" ON orang_tua_balita
  FOR ALL TO authenticated
  USING (
    get_user_role() = 'KADER' AND
    balita_id IN (SELECT id FROM balita WHERE posyandu_id = get_user_posyandu_id())
  );
