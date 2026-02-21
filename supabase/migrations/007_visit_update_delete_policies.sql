-- Allow KADER to update and delete visits for their posyandu
-- Kunjungan Balita
CREATE POLICY "kb_kader_update" ON kunjungan_balita 
  FOR UPDATE TO authenticated 
  USING (get_user_role() = 'KADER' AND posyandu_id = get_user_posyandu_id());

CREATE POLICY "kb_kader_delete" ON kunjungan_balita 
  FOR DELETE TO authenticated 
  USING (get_user_role() = 'KADER' AND posyandu_id = get_user_posyandu_id());

-- Kunjungan Lansia
CREATE POLICY "kl_kader_update" ON kunjungan_lansia 
  FOR UPDATE TO authenticated 
  USING (get_user_role() = 'KADER' AND posyandu_id = get_user_posyandu_id());

CREATE POLICY "kl_kader_delete" ON kunjungan_lansia 
  FOR DELETE TO authenticated 
  USING (get_user_role() = 'KADER' AND posyandu_id = get_user_posyandu_id());
