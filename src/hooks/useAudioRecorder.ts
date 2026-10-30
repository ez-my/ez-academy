import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0); // ms
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isFinalTranscript, setIsFinalTranscript] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recognitionStopTimerRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [transcriptionAvailable, setTranscriptionAvailable] = useState(true);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIdRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const acceptRecognitionRef = useRef(false);
  
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTranscriptionAvailable(false);
      setTranscriptionError('Live transcription is not supported here. Your audio is still being recorded; you can enter what you said before requesting feedback.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-GB';
    recognitionRef.current = recognition;
    acceptRecognitionRef.current = true;
    setIsTranscribing(true);
    setTranscriptionAvailable(true);
    setTranscriptionError(null);

    recognition.onresult = (event: any) => {
      if (!acceptRecognitionRef.current || recognitionRef.current !== recognition) return;
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const phrase = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += phrase + ' ';
          setIsFinalTranscript(true);
        } else {
          interim += phrase;
          setIsFinalTranscript(false);
        }
      }
      setTranscript((finalTranscriptRef.current + interim).trim());
    };
    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        acceptRecognitionRef.current = false;
        setTranscriptionAvailable(false);
        setTranscriptionError('Live transcription was blocked. Your audio is still being recorded.');
      } else if (event.error === 'network' || event.error === 'audio-capture') {
        acceptRecognitionRef.current = false;
        setTranscriptionAvailable(false);
        setTranscriptionError('Live transcription is unavailable right now. Your audio is still being recorded.');
      }
    };
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      if (recognitionStopTimerRef.current) clearTimeout(recognitionStopTimerRef.current);
      recognitionStopTimerRef.current = null;
      recognitionRef.current = null;
      setIsTranscribing(false);
      if (acceptRecognitionRef.current && recorderRef.current?.state === 'recording') {
        window.setTimeout(() => {
          if (acceptRecognitionRef.current && !recognitionRef.current && recorderRef.current?.state === 'recording') {
            startRecognition();
          }
        }, 150);
      }
    };
    try {
      recognition.start();
    } catch (err) {
      recognitionRef.current = null;
      acceptRecognitionRef.current = false;
      setIsTranscribing(false);
      setTranscriptionAvailable(false);
      setTranscriptionError('Live transcription could not start. Your audio is still being recorded.');
    }
  }, []);

  const startRecording = useCallback(async (sensitivity: number = 1, transcribe: boolean = true) => {
    setError(null);
    setTranscriptionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      streamRef.current = stream;
      const recordingId = ++recordingIdRef.current;
      
      // Setup Web Audio API and GainNode
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const recordingContext = audioContextRef.current;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = Math.min(Math.max(sensitivity, 0.5), 1.5);
      
      const destination = audioContextRef.current.createMediaStreamDestination();
      source.connect(gainNode);
      gainNode.connect(destination);

      const recorder = new MediaRecorder(destination.stream);
      recorderRef.current = recorder;
      setAudioBlob(null);
      chunksRef.current = [];
      finalTranscriptRef.current = '';

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (recordingIdRef.current === recordingId) {
          setAudioBlob(blob);
          setIsRecording(false);
          setIsPaused(false);
        }
        stream.getTracks().forEach(track => track.stop());
        if (streamRef.current === stream) streamRef.current = null;
        void recordingContext.close();
        if (audioContextRef.current === recordingContext) audioContextRef.current = null;
        if (recorderRef.current === recorder) recorderRef.current = null;
      };

      recorder.start();
      if (transcribe && navigator.onLine) {
        startRecognition();
      } else {
        setTranscriptionAvailable(false);
        setTranscriptionError('Offline practice records your voice. Transcription and feedback are available when you are online.');
      }
      setMediaRecorder(recorder);
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      setTranscript('');

      // 100ms precision timer
      let lastTick = Date.now();
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        setDuration(prev => prev + (now - lastTick));
        lastTick = now;
      }, 100);
      return true;
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      let errorMsg = 'Could not access microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Microphone permission denied. Please allow microphone access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No microphone found on this device.';
      }
      setError(errorMsg);
      return false;
    }
  }, [startRecognition]);

  const finishRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (recognitionStopTimerRef.current) clearTimeout(recognitionStopTimerRef.current);
    // Final results may arrive after stop(), on both Pause and Finish.
    recognitionStopTimerRef.current = window.setTimeout(() => {
      if (recognitionRef.current !== recognition) return;
      acceptRecognitionRef.current = false;
      recognitionRef.current = null;
      recognitionStopTimerRef.current = null;
      setIsTranscribing(false);
      if (recorderRef.current?.state === 'recording' && transcriptionAvailable && navigator.onLine) startRecognition();
    }, 1500);
    try { recognition.stop(); } catch(e) {
      if (recognitionStopTimerRef.current) clearTimeout(recognitionStopTimerRef.current);
      recognitionStopTimerRef.current = null;
      acceptRecognitionRef.current = false;
      recognitionRef.current = null;
      setIsTranscribing(false);
    }
  }, [startRecognition, transcriptionAvailable]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorder && isRecording && !isPaused) {
      try {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.pause();
        }
        setIsPaused(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        finishRecognition();
      } catch (err) {
        console.error("Error pausing recording:", err);
      }
    }
  }, [mediaRecorder, isRecording, isPaused, finishRecognition]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorder && isRecording && isPaused) {
      try {
        if (mediaRecorder.state === 'paused') {
          mediaRecorder.resume();
        }
        setIsPaused(false);
        
        if (transcriptionAvailable && navigator.onLine && !recognitionRef.current) startRecognition();

        let lastTick = Date.now();
        timerRef.current = window.setInterval(() => {
          const now = Date.now();
          setDuration(prev => prev + (now - lastTick));
          lastTick = now;
        }, 100);
      } catch (err) {
        console.error("Error resuming recording:", err);
      }
    }
  }, [mediaRecorder, isRecording, isPaused, startRecognition, transcriptionAvailable]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      finishRecognition();
    }
  }, [mediaRecorder, isRecording, finishRecognition]);

  const reset = useCallback(() => {
    recordingIdRef.current += 1;
    if (recognitionStopTimerRef.current) clearTimeout(recognitionStopTimerRef.current);
    recognitionStopTimerRef.current = null;
    setIsTranscribing(false);
    acceptRecognitionRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
      recognitionRef.current = null;
    }
    if (recorderRef.current?.state !== 'inactive') {
      try { recorderRef.current?.stop(); } catch(e) {}
    }
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    finalTranscriptRef.current = '';
    setTranscriptionError(null);
    setTranscriptionAvailable(true);
    setAudioBlob(null);
    setDuration(0);
    setTranscript('');
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  useEffect(() => () => {
    if (recognitionStopTimerRef.current) clearTimeout(recognitionStopTimerRef.current);
    acceptRecognitionRef.current = false;
    try { recognitionRef.current?.stop(); } catch(e) {}
    try { if (recorderRef.current?.state !== 'inactive') recorderRef.current?.stop(); } catch(e) {}
    streamRef.current?.getTracks().forEach(track => track.stop());
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const clearTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
  }, []);

  // Restore a recording kept on this device for later review.
  const loadRecording = useCallback((blob: Blob, savedTranscript = '') => {
    setAudioBlob(blob);
    setTranscript(savedTranscript);
    finalTranscriptRef.current = savedTranscript;
    setDuration(0);
    setError(null);
  }, []);

  return {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    transcript,
    setTranscript,
    isFinalTranscript,
    isTranscribing,
    error,
    transcriptionError,
    transcriptionAvailable,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    reset,
    clearTranscript,
    loadRecording,
  };
}
