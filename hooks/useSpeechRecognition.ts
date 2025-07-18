import { useState, useRef, useEffect, useCallback } from 'react';

// Type definitions for the Web Speech API to satisfy TypeScript and provide type safety.
// These interfaces are based on the MDN Web Docs for the Web Speech API.
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

type SpeechRecognitionErrorCode =
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported';

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

// Extend the Window interface to make TypeScript aware of the SpeechRecognition APIs.
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}


// SpeechRecognition API might be prefixed in some browsers
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const useSpeechRecognition = (onTranscriptUpdate: (transcript: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>('');

  // Use a ref to hold the latest `isListening` state to avoid stale closures in event handlers.
  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;

  useEffect(() => {
    if (!SpeechRecognition) {
      setError("お使いのブラウザは音声認識をサポートしていません。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ja-JP';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      onTranscriptUpdate(finalTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setError(`音声認識エラー: ${event.error}`);
      setIsListening(false); // Ensure listening state is reset on error
    };
    
    recognition.onend = () => {
      // Use the ref to check the most current listening state.
      // This prevents the stale closure issue and ensures that auto-restart
      // only happens when it's supposed to (i.e., not after a manual stop).
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.error("Speech recognition restart failed", e);
          // If restart fails, update the state to reflect that we are no longer listening.
          setIsListening(false);
        }
      }
    };
    
    return () => {
      // Cleanup: remove handlers and stop recognition
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  // The dependency array is correct. We only want this effect to run once to set up the recognition instance.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTranscriptUpdate]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      finalTranscriptRef.current = '';
      onTranscriptUpdate('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      } catch(e) {
        console.error("Speech recognition could not start.", e);
        setError("音声認識を開始できませんでした。");
      }
    }
  }, [isListening, onTranscriptUpdate]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      // Set state to false *before* stopping. The onend handler will see this
      // via the ref on the next render and know not to restart.
      setIsListening(false);
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return { isListening, error, startListening, stopListening };
};
