-- Safe atomic decrement helper called by the edge function.
-- Prevents going below 0.
CREATE OR REPLACE FUNCTION decrement_limit(tenant uuid, col text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF col = 'sms_limit_remaining' THEN
    UPDATE barbershops
    SET sms_limit_remaining = GREATEST(sms_limit_remaining - 1, 0)
    WHERE id = tenant;
  ELSIF col = 'call_limit_remaining' THEN
    UPDATE barbershops
    SET call_limit_remaining = GREATEST(call_limit_remaining - 1, 0)
    WHERE id = tenant;
  END IF;
END;
$$;
