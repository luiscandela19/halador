-- RPC Function to safely approve a trip request
-- This ensures that seats are available before approving, preventing overbooking.

CREATE OR REPLACE FUNCTION public.approve_trip_request(request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trip_id UUID;
  v_seats_available INTEGER;
BEGIN
  -- 1. Get trip info and lock the row to prevent race conditions
  SELECT t.id, t.seats_available 
  INTO v_trip_id, v_seats_available
  FROM public.trip_requests tr
  JOIN public.trips t ON t.id = tr.trip_id
  WHERE tr.id = request_id
  FOR UPDATE OF t; -- Locks the trip row

  -- 2. Validate
  IF v_trip_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solicitud o viaje no encontrado');
  END IF;

  IF v_seats_available < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No hay asientos disponibles');
  END IF;

  -- 3. Update Request Status
  UPDATE public.trip_requests
  SET status = 'accepted'
  WHERE id = request_id;

  -- 4. Decrement Seats
  UPDATE public.trips
  SET seats_available = seats_available - 1
  WHERE id = v_trip_id;

  -- 5. Mark trip as 'full' if needed (optional logic, nice to have)
  UPDATE public.trips
  SET status = 'full'
  WHERE id = v_trip_id AND seats_available = 0;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
