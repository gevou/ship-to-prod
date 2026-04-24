'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import Vapi from '@vapi-ai/web';

interface TranscriptEntry {
  role: 'user' | 'assistant';
  text: string;
}

type AgentStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

function MicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="11" rx="3" fill="currentColor" />
      <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" />
      <path d="M12 17v4M9 21h6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function WaveBars({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-[3px]" style={{ height: 28 }} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            backgroundColor: color,
            height: '100%',
            animation: 'wavebar 0.7s ease-in-out infinite',
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <div
      className="w-7 h-7 rounded-full border-2 border-white/20 border-t-white/70"
      style={{ animation: 'spin 0.8s linear infinite' }}
      aria-hidden="true"
    />
  );
}

export default function Home() {
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const vapiRef = useRef<Vapi | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    console.log('VAPI KEY:', process.env.NEXT_PUBLIC_VAPI_KEY, 'ASSISTANT:', process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID);

    const key = process.env.NEXT_PUBLIC_VAPI_KEY;
    if (!key) {
      setErrorMsg('NEXT_PUBLIC_VAPI_KEY is not configured');
      setStatus('error');
      return;
    }

    const vapi = new Vapi(key);
    vapiRef.current = vapi;

    vapi.on('call-start', () => { setStatus('listening'); setErrorMsg(null); });
    vapi.on('call-end', () => setStatus('idle'));
    vapi.on('speech-start', () => setStatus('speaking'));
    vapi.on('speech-end', () => setStatus('listening'));
    vapi.on('error', (err: unknown) => {
      console.error('Vapi error:', JSON.stringify(err, null, 2), err);
      const msg = (err as { message?: string })?.message ?? JSON.stringify(err) ?? 'Call failed';
      setErrorMsg(msg);
      setStatus('error');
    });
    vapi.on('message', (msg: { type: string; transcriptType?: string; role?: string; transcript?: string }) => {
      if (msg.type === 'transcript' && msg.transcriptType === 'final' && msg.role && msg.transcript) {
        setTranscript((prev) => [...prev, { role: msg.role as 'user' | 'assistant', text: msg.transcript! }]);
      }
    });

    return () => { vapi.stop(); };
  }, []);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [transcript]);

  const stopCall = useCallback(() => {
    vapiRef.current?.stop();
    setStatus('idle');
  }, []);

  const toggleCall = useCallback(async () => {
    if (!vapiRef.current) return;
    setErrorMsg(null);

    if (status === 'listening' || status === 'speaking' || status === 'connecting') {
      stopCall();
      return;
    }

    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    if (!assistantId) {
      setErrorMsg('NEXT_PUBLIC_VAPI_ASSISTANT_ID is not configured');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    try {
      await vapiRef.current.start(assistantId);
    } catch (err) {
      console.error('Vapi start error:', err);
      setErrorMsg((err as { message?: string })?.message ?? 'Failed to start call');
      setStatus('error');
    }
  }, [status, stopCall]);

  const bgColor = '#0e0a04';
  const isActive = status === 'listening' || status === 'speaking' || status === 'connecting';
  const accentColor = status === 'speaking' ? '#a78bfa' : status === 'error' ? '#f87171' : '#f59e0b';

  const buttonIcon =
    status === 'connecting' ? <Spinner /> :
    status === 'speaking' ? <WaveBars color={accentColor} /> :
    <MicIcon />;

  return (
    <div
      style={{
        height: '100dvh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        touchAction: 'none',
        overscrollBehavior: 'none',
        background: bgColor,
        color: 'white',
      }}
    >
      {/* Header */}
      <header
        className="shrink-0 flex items-start"
        style={{
          padding: 'max(env(safe-area-inset-top), 20px) 24px 8px',
          background: bgColor,
          zIndex: 10,
        }}
      >
        <div>
          <h1
            className="text-5xl font-black tracking-tight leading-none"
            style={{ color: accentColor, transition: 'color 0.4s ease' }}
          >
            Thread
          </h1>
          <p className="text-xs mt-1 tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
            voice coordinator
          </p>
        </div>
      </header>

      {/* Scrollable transcript */}
      <div
        ref={transcriptRef}
        className="flex-1 overflow-y-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {transcript.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
            <div
              className="w-px h-12"
              style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)' }}
            />
            <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Conversation will appear here
            </p>
            <div
              className="w-px h-12"
              style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)' }}
            />
          </div>
        ) : (
          transcript.map((entry, i) => (
            <Fragment key={i}>
              <div className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                  style={
                    entry.role === 'user'
                      ? {
                          background: 'rgba(245,158,11,0.18)',
                          border: '1px solid rgba(245,158,11,0.25)',
                          borderBottomRightRadius: 4,
                          color: 'white',
                        }
                      : {
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderBottomLeftRadius: 4,
                          color: 'rgba(255,255,255,0.9)',
                        }
                  }
                >
                  {entry.text}
                </div>
              </div>
            </Fragment>
          ))
        )}
      </div>

      {/* Fixed bottom bar */}
      <div
        className="shrink-0 flex flex-col items-center gap-5 backdrop-blur-xl"
        style={{
          padding: '16px 24px max(env(safe-area-inset-bottom), 24px)',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(9,9,15,0.85) 40%, rgba(9,9,15,1) 70%)',
          zIndex: 10,
        }}
      >
        {errorMsg && (
          <p className="text-xs text-center max-w-xs" style={{ color: 'rgba(248,113,113,0.8)' }}>
            {errorMsg}
          </p>
        )}

        {/* Button with pulse rings */}
        <div className="relative flex items-center justify-center">
          {(status === 'listening' || status === 'speaking') && (
            <span
              className="absolute rounded-full"
              style={{
                width: 144,
                height: 144,
                background: accentColor,
                opacity: 0.07,
                animation: 'ring-expand 2s ease-out infinite',
              }}
            />
          )}
          {(status === 'listening' || status === 'speaking') && (
            <span
              className="absolute rounded-full"
              style={{
                width: 120,
                height: 120,
                background: accentColor,
                opacity: 0.12,
                animation: 'ring-expand 2s ease-out infinite 0.6s',
              }}
            />
          )}

          <button
            onClick={toggleCall}
            disabled={status === 'connecting'}
            aria-label={isActive ? 'End call' : 'Start call'}
            className="relative z-10 rounded-full flex items-center justify-center active:scale-95"
            style={{
              width: 88,
              height: 88,
              background: isActive
                ? `rgba(${status === 'speaking' ? '167,139,250' : '245,158,11'}, 0.12)`
                : 'rgba(255,255,255,0.06)',
              border: `2px solid ${isActive ? accentColor : 'rgba(255,255,255,0.15)'}`,
              boxShadow: isActive ? `0 0 32px ${accentColor}33, 0 0 8px ${accentColor}22` : 'none',
              color: isActive ? accentColor : 'rgba(255,255,255,0.5)',
              transition: 'all 0.3s ease',
            }}
          >
            {buttonIcon}
          </button>
        </div>

        {isActive && status !== 'connecting' && (
          <button
            onClick={stopCall}
            style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: 12,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              minHeight: 44,
              padding: '0 24px',
            }}
          >
            End
          </button>
        )}

        {!isActive && (
          <p
            style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: 12,
              letterSpacing: '0.05em',
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {status === 'error' ? 'Tap to retry' : 'Tap to start a conversation'}
          </p>
        )}

        {status === 'listening' && (
          <p style={{ color: accentColor, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', minHeight: 20 }}>
            Listening
          </p>
        )}
        {status === 'speaking' && (
          <p style={{ color: accentColor, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', minHeight: 20 }}>
            Speaking
          </p>
        )}
        {status === 'connecting' && (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', minHeight: 20 }}>
            Connecting…
          </p>
        )}

        <a
          href="/dashboard"
          style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, letterSpacing: '0.05em' }}
        >
          Thread Dashboard →
        </a>
      </div>
    </div>
  );
}
