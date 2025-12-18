-- Function to decrease product stock
CREATE OR REPLACE FUNCTION public.decrease_product_stock(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products 
  SET stock = GREATEST(0, COALESCE(stock, 0) - p_quantity)
  WHERE id = p_product_id;
END;
$$;

-- Function to increase product stock (for cancelled orders)
CREATE OR REPLACE FUNCTION public.increase_product_stock(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products 
  SET stock = COALESCE(stock, 0) + p_quantity
  WHERE id = p_product_id;
END;
$$;