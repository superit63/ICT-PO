-- Add hospital_id column to visits table
-- This column will be automatically populated from doctor.hospital_id via trigger

ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES hospitals(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_visits_hospital_id ON visits(hospital_id);

-- Backfill existing visits with hospital_id from their doctors
UPDATE visits v
SET hospital_id = d.hospital_id
FROM doctors d
WHERE v.doctor_id = d.id
  AND v.hospital_id IS NULL;

-- Create function to automatically set hospital_id from doctor
CREATE OR REPLACE FUNCTION set_visit_hospital_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get hospital_id from the doctor
  SELECT hospital_id INTO NEW.hospital_id
  FROM doctors
  WHERE id = NEW.doctor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-populate hospital_id on insert
DROP TRIGGER IF EXISTS trigger_set_visit_hospital_id_insert ON visits;
CREATE TRIGGER trigger_set_visit_hospital_id_insert
  BEFORE INSERT ON visits
  FOR EACH ROW
  EXECUTE FUNCTION set_visit_hospital_id();

-- Create trigger to auto-update hospital_id on update (in case doctor changes hospital)
DROP TRIGGER IF EXISTS trigger_set_visit_hospital_id_update ON visits;
CREATE TRIGGER trigger_set_visit_hospital_id_update
  BEFORE UPDATE ON visits
  FOR EACH ROW
  WHEN (OLD.doctor_id IS DISTINCT FROM NEW.doctor_id)
  EXECUTE FUNCTION set_visit_hospital_id();

