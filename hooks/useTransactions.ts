import { useCallback, useMemo, useRef, useState } from "react";

// Infer API base URL from env or fall back to local dev backend
const DEFAULT_API_BASE = "https://nickl-wallet-api.onrender.com"; // adjust if your backend runs elsewhere
const API_BASE =
  // Expo public env
  (typeof process !== "undefined" &&
    (process as any)?.env?.EXPO_PUBLIC_API_BASE_URL!) ||
  (typeof process !== "undefined" && (process as any)?.env?.API_BASE_URL) ||
  DEFAULT_API_BASE;

// Backend routes reference:
// GET    /api/v1/transactions/:userId             -> list transactions for user
// GET    /api/v1/transactions/summary/:userId     -> summary for user
// PUT    /api/v1/transactions/:id                 -> update transaction
// DELETE /api/v1/transactions/:id                 -> delete transaction

export type Transaction = {
  id: number;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  created_at?: string;
  [k: string]: any;
};

export type TransactionUpdate = Partial<
  Pick<Transaction, "title" | "amount" | "category">
>;

export type TransactionsSummary = {
  total_amount: number;
  count: number;
  byCategory: Array<{
    category: string;
    total_amount: number;
    count: number;
  }>;
};

export type UseTransactionsOptions = {
  /** Optional initial userId to auto-load on mount */
  userId?: string;
  /** Provide a custom fetch implementation if needed */
  fetchImpl?: typeof fetch;
  /** Whether to auto-fetch transactions on mount when userId is provided (default true) */
  autoFetch?: boolean;
};

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { userId: initialUserId, autoFetch = true } = options;
  const fetchImpl = options.fetchImpl ?? fetch;

  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [summary, setSummary] = useState<TransactionsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userIdRef = useRef<string | undefined>(initialUserId);

  const handleResponse = async <T>(res: Response): Promise<T> => {
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (!res.ok) {
      let message = `Request failed with status ${res.status}`;
      try {
        const body = isJson ? await res.json() : await res.text();
        const maybeMsg = (body as any)?.message ?? body;
        if (maybeMsg) message = String(maybeMsg);
      } catch {}
      throw new Error(message);
    }

    return (isJson ? await res.json() : await res.text()) as T;
  };

  const buildUrl = useCallback((path: string) => {
    const base = API_BASE?.replace(/\/$/, "");
    const p = path.startsWith("/") ? path : `/${path}`;
    console.log(`${base}${p}`);
    return `${base}${p}`;
  }, []);

  const fetchTransactions = useCallback(
    async (userId?: string) => {
      const uid = userId ?? userIdRef.current;
      if (!uid) throw new Error("userId is required to fetch transactions");
      userIdRef.current = uid;

      setLoading(true);
      setError(null);
      try {
        const res = await fetchImpl(
          buildUrl(`/api/v1/transactions/${encodeURIComponent(uid)}`),
        );
        const data = await handleResponse<Transaction[]>(res);
        setTransactions(data);
        return data;
      } catch (e: any) {
        setError(e?.message ?? "Failed to fetch transactions");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [buildUrl, fetchImpl],
  );

  const fetchSummary = useCallback(
    async (userId?: string) => {
      const uid = userId ?? userIdRef.current;
      if (!uid) throw new Error("userId is required to fetch summary");
      userIdRef.current = uid;

      setLoading(true);
      setError(null);
      try {
        const res = await fetchImpl(
          buildUrl(`/api/v1/transactions/summary/${encodeURIComponent(uid)}`),
        );
        const data = await handleResponse<TransactionsSummary>(res);
        setSummary(data);
        return data;
      } catch (e: any) {
        setError(e?.message ?? "Failed to fetch summary");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [buildUrl, fetchImpl],
  );

  const deleteTransaction = useCallback(
    async (id: number) => {
      if (id === undefined || id === null) throw new Error("id is required");

      // Optimistic update
      const prev = transactions ?? [];
      const next = prev.filter((t) => t.id !== id);
      setTransactions(next);
      setError(null);

      try {
        const res = await fetchImpl(buildUrl(`/api/v1/transactions/${id}`), {
          method: "DELETE",
        });
        const deleted = await handleResponse<Transaction>(res);
        return deleted;
      } catch (e) {
        // rollback
        setTransactions(prev);
        setError((e as any)?.message ?? "Failed to delete transaction");
        throw e;
      }
    },
    [buildUrl, fetchImpl, transactions],
  );

  const updateTransaction = useCallback(
    async (id: number, payload: TransactionUpdate) => {
      if (id === undefined || id === null) throw new Error("id is required");

      const prev = transactions ?? [];
      const index = prev.findIndex((t) => t.id === id);
      const existing = index >= 0 ? prev[index] : undefined;

      if (existing) {
        const optimistic: Transaction = {
          ...existing,
          ...payload,
        } as Transaction;
        const clone = [...prev];
        clone[index] = optimistic;
        setTransactions(clone);
      }

      setError(null);
      try {
        const res = await fetchImpl(buildUrl(`/api/v1/transactions/${id}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const updated = await handleResponse<Transaction>(res);

        // ensure state reflects server response
        if (existing) {
          const clone = [...(transactions ?? [])];
          const idx = clone.findIndex((t) => t.id === id);
          if (idx >= 0) clone[idx] = updated;
          setTransactions(clone);
        }
        return updated;
      } catch (e) {
        // rollback on failure
        if (existing) {
          const clone = [...(transactions ?? [])];
          const idx = clone.findIndex((t) => t.id === id);
          if (idx >= 0) clone[idx] = existing;
          setTransactions(clone);
        }
        setError((e as any)?.message ?? "Failed to update transaction");
        throw e;
      }
    },
    [buildUrl, fetchImpl, transactions],
  );

  const refetch = useCallback(async () => {
    if (userIdRef.current) {
      await fetchTransactions(userIdRef.current);
      await fetchSummary(userIdRef.current);
    }
  }, [fetchTransactions, fetchSummary]);

  // Auto-fetch on mount if initial userId provided
  // Intentionally not using useEffect to avoid import here; consumers can call fetch methods explicitly.
  // If autoFetch is true and initial userId exists, perform initial load once via microtask.
  if (
    autoFetch &&
    initialUserId &&
    transactions === null &&
    !loading &&
    !error
  ) {
    Promise.resolve().then(() => {
      fetchTransactions(initialUserId).catch(() => void 0);
      fetchSummary(initialUserId).catch(() => void 0);
    });
  }

  return useMemo(
    () => ({
      // state
      transactions,
      summary,
      loading,
      error,
      // actions
      fetchTransactions,
      fetchSummary,
      deleteTransaction,
      updateTransaction,
      refetch,
      // utils
      setTransactions,
      setSummary,
    }),
    [
      transactions,
      summary,
      loading,
      error,
      fetchTransactions,
      fetchSummary,
      deleteTransaction,
      updateTransaction,
      refetch,
    ],
  );
}

export default useTransactions;
