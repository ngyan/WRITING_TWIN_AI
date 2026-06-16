// Ambient declarations for the webkit-prefixed Web Speech API.
// lib.dom.d.ts ships SpeechRecognitionResult / SpeechRecognitionResultList but
// NOT the SpeechRecognition interface, its event types, or the webkit global.

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((e: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare const webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};
