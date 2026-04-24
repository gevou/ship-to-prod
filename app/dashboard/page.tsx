'use client';

import { useEffect, useRef, useState } from 'react';

interface ThreadMessage {
  timestamp: string;
  [key: string]: unknown;
}

interface Thread {
  id: string;
  name: string;
  status: string;
  summary: string;
  messageCount: number;
  history: ThreadMessage[];
}

export default function Dashboard() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set());
  const prevCountsRef = useRef<Record<string, number>>({});

  const fetchThreads = async () => {
    const res = await fetch('/api/threads');
    const data: Thread[] = await res.json();

    const newlyFlashing: string[] = [];
    data.forEach((thread) => {
      const prev = prevCountsRef.current[thread.id];
      if (prev !== undefined && thread.messageCount > prev) {
        newlyFlashing.push(thread.id);
      }
      prevCountsRef.current[thread.id] = thread.messageCount;
    });

    if (newlyFlashing.length > 0) {
      setFlashingIds((prev) => new Set([...prev, ...newlyFlashing]));
      setTimeout(() => {
        setFlashingIds((prev) => {
          const next = new Set(prev);
          newlyFlashing.forEach((id) => next.delete(id));
          return next;
        });
      }, 2500);
    }

    setThreads(prev => {
      const merged = [...prev];
      for (const newThread of data) {
        const existing = merged.find(t => t.id === newThread.id);
        if (existing) {
          const existingTimestamps = new Set(existing.history.map(m => m.timestamp));
          const newMsgs = newThread.history.filter(m => !existingTimestamps.has(m.timestamp));
          existing.history = [...existing.history, ...newMsgs];
          existing.summary = newThread.summary;
          existing.status = newThread.status;
        } else {
          merged.push(newThread);
        }
      }
      merged.sort((a, b) => a.id.localeCompare(b.id));
      return merged;
    });
    setLastUpdated(new Date());
  };

  useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090f] text-white p-6">
      <style>{`
        @keyframes dot-amber {
          0%, 100% { background-color: rgb(82 82 91 / 0.35); box-shadow: none; }
          50% { background-color: rgb(245 158 11); box-shadow: 0 0 7px rgb(245 158 11 / 0.55); }
        }
        .dot-flash { animation: dot-amber 0.83s ease-in-out 3 forwards; }
      `}</style>

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Thread Dashboard</h1>
            {lastUpdated && (
              <p className="text-zinc-600 text-xs mt-1">
                Updated {lastUpdated.toLocaleTimeString()} · refreshes every 5s
              </p>
            )}
          </div>
          <a href="/" className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors">
            ← Voice UI
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {threads.length === 0 ? (
            <div className="col-span-3 text-center text-zinc-700 py-16 text-sm">
              Loading…
            </div>
          ) : (
            threads.map((thread) => {
              const flashing = flashingIds.has(thread.id);
              return (
                <div
                  key={thread.id}
                  className="backdrop-blur-md bg-white/[0.025] border border-white/[0.05] rounded-xl p-5 hover:border-white/[0.08] transition-colors"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <span
                      className={flashing ? 'dot-flash' : ''}
                      style={{
                        display: 'inline-block',
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        flexShrink: 0,
                        backgroundColor: flashing ? undefined : 'rgb(82 82 91 / 0.35)',
                      }}
                    />
                    <h2 className="font-semibold text-white leading-tight">{thread.name}</h2>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-4">{thread.summary}</p>
                  <p className="text-zinc-600 text-xs">
                    {thread.messageCount || 0} message{thread.messageCount !== 1 ? 's' : ''}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
