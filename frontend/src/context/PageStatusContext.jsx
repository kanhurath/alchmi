import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PageStatusContext = createContext({ statuses: {}, refresh: () => {}, loading: true });

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/page-status`;

export function PageStatusProvider({ children }) {
  const [statuses, setStatuses] = useState({});
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(() => {
    fetch(API)
      .then(r => r.json())
      .then(d => { setStatuses(d); setLoading(false); })
      .catch(() => setLoading(false)); // on error default to all published
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <PageStatusContext.Provider value={{ statuses, refresh: load, loading }}>
      {children}
    </PageStatusContext.Provider>
  );
}

export const usePageStatuses = () => useContext(PageStatusContext);
