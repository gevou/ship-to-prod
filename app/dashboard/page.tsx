'use client';

import { useEffect, useState } from 'react';

interface Thread {
  id: string;
  name: string;
  status: string;
  summary: string;
  messageCount: number;
}

export default function Dashboard() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchThreads = async () => {
    const res = await fetch('/api/threads');
    const data = await res.json();
    setThreads(data);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Thread Dashboard</h1>
            {lastUpdated && (
              <p className="text-zinc-500 text-xs mt-1">
                Updated {lastUpdated.toLocaleTimeString()} · auto-refreshes every 5s
              </p>
            )}
          </div>
          <a href="/" className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors">
            ← Voice UI
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {threads.length === 0 ? (
            <div className="col-span-3 text-center text-zinc-600 py-16">
              Loading threads...
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="font-semibold text-white leading-tight">{thread.name}</h2>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                      thread.status === 'active'
                        ? 'bg-green-900/50 text-green-400 border border-green-800'
                        : thread.status === 'waiting'
                        ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-800'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}
                  >
                    {thread.status}
                  </span>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed mb-4">{thread.summary}</p>
                <p className="text-zinc-600 text-xs">
                  {thread.messageCount || 0} message{thread.messageCount !== 1 ? 's' : ''}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
