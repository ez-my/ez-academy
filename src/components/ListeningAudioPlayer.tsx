import { TRIAL_LISTENING_TESTS } from '../data/trialListeningTests';
import React, { useEffect, useRef, useState } from 'react';

export function ListeningAudioPlayer({ testId, label, reload = 0 }: { testId: string; label: string; reload?: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState('Loading audio…');
  const [direct, setDirect] = useState(false);
  const fileId = TRIAL_LISTENING_TESTS.find(test => test.id === testId)?.audioFileId;
  useEffect(() => { setDirect(false); }, [testId, reload]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const audio = audioRef.current;
    return () => { if (audio) { audio.pause(); } };
  }, [testId, reload]);
  const retry = () => {
    setFailed(false); setStatus('Loading audio…');
    audioRef.current?.load();
  };
  return <div className="min-w-0 space-y-2">
    <audio key={`${testId}:${reload}`} ref={audioRef} aria-label={`${label} recording`} controls preload="metadata"
      src={direct && fileId ? `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t` : `/api/listening/audio/${encodeURIComponent(testId)}`} className={`${failed ? 'hidden' : 'block'} h-12 w-full min-w-0 max-w-full`}
      onLoadStart={() => { setFailed(false); setStatus('Loading audio…'); }}
      onLoadedMetadata={() => setStatus('')}
      onCanPlay={() => setStatus('')}
      onWaiting={() => setStatus('Loading audio…')}
      onPlaying={() => { setFailed(false); setStatus(''); }}
      onError={() => { if (!direct && fileId) { setDirect(true); setStatus('Loading audio…'); return; } setFailed(true); setStatus('Press Play below. If it does not load, use “Open audio”.'); }}
    />
    {status && <p role={failed ? 'alert' : 'status'} className={`text-xs ${'text-white/60'}`}>{status}</p>}
    {failed && fileId && <iframe title={`${label} audio player`} src={`https://drive.google.com/file/d/${fileId}/preview`} allow="autoplay" className="h-40 w-full min-w-0 rounded-lg border-0 bg-white" />}
    {failed && <button type="button" onClick={retry} className="min-h-11 rounded-lg border border-white/20 px-3 text-sm font-semibold hover:bg-white/10">Try audio again</button>}
  </div>;
}
