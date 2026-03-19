"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface WorkerData {
  id: string;
  walletBalance: string | number;
  qrCode: string;
  employerName?: string;
  jobTitle?: string;
  whatsappPhone?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankBranchCode?: string;
  tips: Array<{
    id: string;
    amount: string | number;
    netAmount: string | number;
    feePlatform: string | number;
    feeGateway: string | number;
    paymentId: string;
    customerName?: string;
    customerMessage?: string;
    status: string;
    createdAt: string;
  }>;
  _count: { tips: number };
  user: { firstName: string; lastName: string; email?: string; phone?: string };
}

interface WorkerContextType {
  worker: WorkerData | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const WorkerContext = createContext<WorkerContextType>({
  worker: null,
  loading: true,
  refresh: async () => {},
});

export function useWorker() {
  return useContext(WorkerContext);
}

export function WorkerProvider({ children }: { children: ReactNode }) {
  const [worker, setWorker] = useState<WorkerData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorker = useCallback(async () => {
    try {
      const res = await fetch("/api/workers/me");
      const d = await res.json();
      if (d.worker) setWorker(d.worker);
    } catch (err) {
      console.error("Failed to fetch worker:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorker();
  }, [fetchWorker]);

  const refresh = useCallback(async () => {
    await fetchWorker();
  }, [fetchWorker]);

  return (
    <WorkerContext.Provider value={{ worker, loading, refresh }}>
      {children}
    </WorkerContext.Provider>
  );
}
