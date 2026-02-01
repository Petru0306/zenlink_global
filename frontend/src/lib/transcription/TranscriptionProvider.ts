/**
 * Transcription Provider Abstraction
 * Allows swapping STT providers (Web Speech API, Whisper, etc.)
 */

export interface TranscriptionProvider {
  start(): Promise<void>;
  stop(): void;
  isSupported(): boolean;
  onPartial(callback: (text: string) => void): void;
  onFinal(callback: (text: string) => void): void;
  onError(callback: (error: Error) => void): void;
  setLanguage(language: 'auto' | 'ro' | 'en'): void;
  isListening(): boolean;
}
