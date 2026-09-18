import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Per-thread interaction state, persisted per browser so the demo survives a
 * reload. "Reset" clears it.
 */
export interface ThreadState {
  status: 'open' | 'resolved';
  decision?: string;
  checked?: string[];
  hunks?: Record<string, 'accepted' | 'rejected'>;
}

const KEY = 'genui-workshop.threads.v1';

function load(): Record<string, ThreadState> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, ThreadState>) : {};
  } catch {
    return {};
  }
}

export function useThreadState() {
  const [state, setState] = useState<Record<string, ThreadState>>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // storage unavailable: state is in memory only
    }
  }, [state]);

  const get = useCallback((id: string): ThreadState => state[id] ?? { status: 'open' }, [state]);

  const update = useCallback((id: string, patch: Partial<ThreadState>) => {
    setState((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { status: 'open' }), ...patch } }));
  }, []);

  const resolve = useCallback((id: string, decision?: string) => update(id, { status: 'resolved', decision }), [update]);
  const reopen = useCallback((id: string) => update(id, { status: 'open' }), [update]);
  const reset = useCallback(() => setState({}), []);

  const resolvedCount = useMemo(() => Object.values(state).filter((s) => s.status === 'resolved').length, [state]);

  return { get, update, resolve, reopen, reset, resolvedCount };
}

export type ThreadStateApi = ReturnType<typeof useThreadState>;
