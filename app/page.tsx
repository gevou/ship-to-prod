'use client';

import { useEffect, useRef, useState } from 'react';
import Vapi from '@vapi-ai/web';

interface TranscriptEntry {
  role: 'user' | 'assistant';
  text: string;
}

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const vapiRef = useRef<Vapi | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_VAPI_KEY;
    if (!key) {
      setError('NEXT_PUBLIC_VAPI_KEY is not configured');
      return;
    }

    const vapi = new Vapi(key);
    vapiRef.current = vapi;

    vapi.on('call-start', () => { setIsConnected(true); setError(null); });
    vapi.on('call-end', () => { setIsConnected(false); setIsSpeaking(false); });
    vapi.on('speech-start', () => setIsSpeaking(true));
    vapi.on('speech-end', () => setIsSpeaking(false));
    vapi.on('error', (err: any) => {
      setError(err?.message ?? 'Call failed');
      setIsConnected(false);
      setIsSpeaking(false);
    });
    vapi.on('message', (msg: any) => {
      if (msg.type === 'transcript' && msg.transcriptType === 'final') {
        setTranscript((prev) => [...prev, { role: msg.role, text: msg.transcript }]);
      }
    });

    return () => { vapi.stop(); };
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const toggleCall = async () => {
    if (!vapiRef.current) return;
    setError(null);
    if (isConnected) {
      vapiRef.current.stop();
    } else {
      const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
      if (!assistantId) {
        setError('NEXT_PUBLIC_VAPI_ASSISTANT_ID is not configured');
        return;
      }
      await vapiRef.current.start(assistantId);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#09090f] text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">

        <div className="text-center mb-14">
          <h1 className="text-2xl font-semibold tracking-tight mb-1.5">Thread Coordinator</h1>
          <p className="text-zinc-500 text-sm">Voice AI for parallel workstreams</p>
        </div>

        {/* Mic button */}
        <div className="flex justify-center mb-10">
          <div className="relative flex items-center justify-center">
            {isConnected && (
              <>
                <span className="absolute w-[120px] h-[120px] rounded-full bg-amber-500/10 animate-ping" />
                <span className="absolute w-[104px] h-[104px] rounded-full bg-amber-500/15 animate-pulse" />
              </>
            )}
            <button
              onClick={toggleCall}
              style={{ width: 88, height: 88 }}
              className={`relative rounded-full font-semibold transition-all duration-300 focus:outline-none active:scale-95 ${
                isConnected
                  ? isSpeaking
                    ? 'bg-amber-500 shadow-[0_0_32px_rgba(245,158,11,0.5)] scale-105'
                    : 'bg-amber-600 shadow-[0_0_24px_rgba(217,119,6,0.35)]'
                  : 'bg-zinc-800 hover:bg-zinc-750 shadow-[0_4px_24px_rgba(0,0,0,0.6)] border border-zinc-700/80 hover:border-zinc-600'
              }`}
            >
              <span className="text-2xl select-none">
                {isConnected ? (isSpeaking ? '◉' : '◎') : '🎙'}
              </span>
            </button>
          </div>
        </div>

        {/* Status pill */}
        <div className="flex justify-center mb-7">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium tracking-wide ${
              isConnected
                ? 'bg-amber-950/50 text-amber-400 border border-amber-900/50'
                : 'bg-zinc-900/80 text-zinc-500 border border-zinc-800'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                isConnected ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'
              }`}
            />
            {isConnected ? (isSpeaking ? 'Agent speaking…' : 'Listening') : 'Ready'}
          </span>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-950/40 border border-red-900/40 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        {/* Transcript */}
        <div className="backdrop-blur-md bg-white/[0.025] border border-white/[0.05] rounded-2xl p-4 h-72 overflow-y-auto flex flex-col gap-3">
          {transcript.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-zinc-600 text-sm">Tap the mic to begin</p>
            </div>
          ) : (
            transcript.map((entry, i) => (
              <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    entry.role === 'user'
                      ? 'bg-amber-600/80 text-white rounded-br-sm'
                      : 'bg-zinc-800/80 text-zinc-200 rounded-bl-sm'
                  }`}
                >
                  {entry.text}
                </div>
              </div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>

        <div className="mt-6 text-center">
          <a href="/dashboard" className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors tracking-wide">
            Thread Dashboard →
          </a>
        </div>

      </div>
    </div>
  );
}
