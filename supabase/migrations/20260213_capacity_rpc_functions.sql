-- Function to handle atomic approval
CREATE OR REPLACE FUNCTION public.approve_request_with_capacity(request_id uuid)
RETURNS void AS $$
DECLARE
  req record;
  day record;
  d date;
  current_capacity record;
BEGIN
  -- Get request details
  SELECT * INTO req FROM public.requests WHERE id = request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada';
  END IF;

  IF req.status = 'approved' THEN
    RAISE EXCEPTION 'La solicitud ya está aprobada';
  END IF;

  -- Iterate through days
  FOR d IN SELECT generate_series(req.start_date, req.end_date, '1 day')::date LOOP
    -- Lock row
    SELECT * INTO current_capacity 
    FROM public.daily_availability 
    WHERE date = d 
    FOR UPDATE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'No hay configuración de capacidad para el día %', d;
    END IF;
    
    IF current_capacity.is_locked THEN
      RAISE EXCEPTION 'El día % está bloqueado manualmente', d;
    END IF;
    
    IF (current_capacity.max_absence - current_capacity.approved_count) <= 0 THEN
      RAISE EXCEPTION 'Cupo excedido para el día %', d;
    END IF;
    
    -- Update count
    UPDATE public.daily_availability 
    SET approved_count = approved_count + 1, updated_at = now()
    WHERE date = d;
  END LOOP;

  -- Update request status
  UPDATE public.requests 
  SET status = 'approved' 
  WHERE id = request_id;

  -- Update user balance
  DECLARE
    days_count integer;
  BEGIN
    days_count := (req.end_date - req.start_date) + 1;
    
    IF req.type = 'PO' THEN
      UPDATE public.profiles SET balance_po = balance_po - days_count WHERE id = req.user_id;
    ELSIF req.type = 'DA' THEN
      UPDATE public.profiles SET balance_da = balance_da - days_count WHERE id = req.user_id;
    ELSIF req.type = 'AP' THEN
      UPDATE public.profiles SET balance_ap = balance_ap - days_count WHERE id = req.user_id;
    END IF;
  END;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle cancellation/rejection (revert capacity)
CREATE OR REPLACE FUNCTION public.revert_capacity_for_request(request_id uuid)
RETURNS void AS $$
DECLARE
  req record;
  d date;
BEGIN
  SELECT * INTO req FROM public.requests WHERE id = request_id;
  
  IF NOT FOUND THEN
     RETURN; -- Nothing to do
  END IF;

  IF req.status = 'approved' THEN
      FOR d IN SELECT generate_series(req.start_date, req.end_date, '1 day')::date LOOP
        UPDATE public.daily_availability 
        SET approved_count = GREATEST(0, approved_count - 1), updated_at = now()
        WHERE date = d;
      END LOOP;
      
      -- Revert Balance
      DECLARE
        days_count integer;
      BEGIN
        days_count := (req.end_date - req.start_date) + 1;
        
        IF req.type = 'PO' THEN
          UPDATE public.profiles SET balance_po = balance_po + days_count WHERE id = req.user_id;
        ELSIF req.type = 'DA' THEN
          UPDATE public.profiles SET balance_da = balance_da + days_count WHERE id = req.user_id;
        ELSIF req.type = 'AP' THEN
          UPDATE public.profiles SET balance_ap = balance_ap + days_count WHERE id = req.user_id;
        END IF;
      END;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.approve_request_with_capacity TO authenticated;
GRANT EXECUTE ON FUNCTION public.revert_capacity_for_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_request_with_capacity TO service_role;
GRANT EXECUTE ON FUNCTION public.revert_capacity_for_request TO service_role;
