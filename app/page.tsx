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
  const vapiRef = useRef<Vapi | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_KEY!);
    vapiRef.current = vapi;

    vapi.on('call-start', () => setIsConnected(true));
    vapi.on('call-end', () => {
      setIsConnected(false);
      setIsSpeaking(false);
    });
    vapi.on('speech-start', () => setIsSpeaking(true));
    vapi.on('speech-end', () => setIsSpeaking(false));
    vapi.on('message', (msg: any) => {
      if (msg.type === 'transcript' && msg.transcriptType === 'final') {
        setTranscript((prev) => [...prev, { role: msg.role, text: msg.transcript }]);
      }
    });

    return () => {
      vapi.stop();
    };
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const toggleCall = async () => {
    if (!vapiRef.current) return;
    if (isConnected) {
      vapiRef.current.stop();
    } else {
      await vapiRef.current.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-start p-6">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10 pt-8">
          <h1 className="text-3xl font-bold mb-2">Thread Coordinator</h1>
          <p className="text-zinc-400 text-sm">Voice AI managing your parallel workstreams</p>
        </div>

        <div className="flex justify-center mb-8">
          <button
            onClick={toggleCall}
            className={`w-28 h-28 rounded-full text-sm font-semibold transition-all duration-200 shadow-xl ${
              isConnected
                ? isSpeaking
                  ? 'bg-red-500 scale-110 shadow-red-500/40 ring-4 ring-red-500/30'
                  : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
            }`}
          >
            {isConnected ? (isSpeaking ? '● Live' : 'End Call') : '🎙 Start'}
          </button>
        </div>

        <div className="flex justify-center mb-8">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
              isConnected
                ? 'bg-green-900/40 text-green-400 border border-green-800'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-green-400 animate-pulse' : 'bg-zinc-600'
              }`}
            />
            {isConnected ? (isSpeaking ? 'Agent speaking...' : 'Listening') : 'Ready'}
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 h-96 overflow-y-auto flex flex-col gap-3">
          {transcript.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-zinc-600 text-sm">Press Start to begin your session</p>
            </div>
          ) : (
            transcript.map((entry, i) => (
              <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                    entry.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'
                  }`}
                >
                  <p className="text-xs opacity-50 mb-1 font-medium">
                    {entry.role === 'user' ? 'You' : 'Agent'}
                  </p>
                  {entry.text}
                </div>
              </div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>

        <div className="mt-6 text-center">
          <a
            href="/dashboard"
            className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
          >
            View Thread Dashboard →
          </a>
        </div>
      </div>
    </div>
  );
}
