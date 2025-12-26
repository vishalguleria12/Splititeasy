import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export function useCurrencies() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCurrencies() {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('code');

      if (!error && data) {
        setCurrencies(data);
      }
      setLoading(false);
    }
    fetchCurrencies();
  }, []);

  return { currencies, loading };
}
