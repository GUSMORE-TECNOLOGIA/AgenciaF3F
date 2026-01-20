ALTER TABLE public.ocorrencias
  ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_status TEXT;

ALTER TABLE public.ocorrencias
  DROP CONSTRAINT IF EXISTS ocorrencias_reminder_status_check;

ALTER TABLE public.ocorrencias
  ADD CONSTRAINT ocorrencias_reminder_status_check
    CHECK (reminder_status IS NULL OR reminder_status IN ('pendente', 'feito', 'cancelado'));

CREATE INDEX IF NOT EXISTS idx_ocorrencias_reminder_at ON public.ocorrencias(reminder_at);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_reminder_status ON public.ocorrencias(reminder_status) WHERE reminder_status IS NOT NULL;
