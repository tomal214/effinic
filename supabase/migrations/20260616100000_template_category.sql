ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS category text;

COMMENT ON COLUMN task_templates.category IS 'Optional filter chip: sterilisation, cleaning, equipment, financial, confidential, end_of_day, general';
