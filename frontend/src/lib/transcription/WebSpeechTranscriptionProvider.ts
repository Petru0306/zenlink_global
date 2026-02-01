/**
 * Web Speech API Transcription Provider
 * Supports RO + EN with auto-detect
 */

import type { TranscriptionProvider } from './TranscriptionProvider';

export class WebSpeechTranscriptionProvider implements TranscriptionProvider {
  private recognition: any = null;
  private partialCallback: ((text: string) => void) | null = null;
  private finalCallback: ((text: string) => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;
  private language: 'auto' | 'ro' | 'en' = 'auto';
  private listening: boolean = false;
  private currentPartial: string = '';
  private finalBuffer: string = '';
  private wasRecording: boolean = false;
  private flushCallback: (() => void) | null = null;

  constructor() {
    if (this.isSupported()) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  isSupported(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.listening = true;
      this.wasRecording = true;
    };

    this.recognition.onend = () => {
      this.listening = false;
      
      // If flushCallback is set, it means we're in flushAndStop() - trigger it
      if (this.flushCallback) {
        // Small delay to ensure last onresult has been processed
        setTimeout(() => {
          if (this.flushCallback) {
            this.flushCallback();
          }
        }, 50);
        return;
      }
      
      // Otherwise, if we were recording and have draft, commit it (for auto-stop scenarios)
      if (this.wasRecording && (this.finalBuffer || this.currentPartial)) {
        const segmentText = (this.finalBuffer + ' ' + this.currentPartial).trim();
        if (segmentText && this.finalCallback) {
          this.finalCallback(segmentText);
          this.resetBuffers();
        }
      }
      
      // Auto-restart only if we're still supposed to be listening
      if (this.wasRecording && this.listening) {
        try {
          this.recognition.start();
        } catch (e) {
          // Already started or error
        }
      }
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Accumulate final text in buffer
      if (finalTranscript) {
        this.finalBuffer += finalTranscript;
        // Don't clear partial immediately - keep it until next interim result
        if (this.finalCallback) {
          this.finalCallback(finalTranscript.trim());
        }
      }

      // Update partial for live display (this replaces previous partial)
      if (interimTranscript) {
        this.currentPartial = interimTranscript;
        if (this.partialCallback) {
          this.partialCallback(interimTranscript);
        }
      } else if (finalTranscript) {
        // If we got final but no interim, clear partial
        this.currentPartial = '';
        if (this.partialCallback) {
          this.partialCallback('');
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      this.listening = false;
      this.wasRecording = false;
      
      // Map error codes to user-friendly messages
      let errorMessage = 'Speech recognition error';
      if (event.error === 'no-speech') {
        errorMessage = 'No speech detected. Please try again.';
      } else if (event.error === 'audio-capture') {
        errorMessage = 'Microphone not accessible. Please check permissions.';
      } else if (event.error === 'not-allowed') {
        errorMessage = 'Microphone access denied. Please allow microphone access.';
      } else if (event.error) {
        errorMessage = `Error: ${event.error}`;
      }
      
      if (this.errorCallback) {
        this.errorCallback(new Error(errorMessage));
      }
    };
  }

  async start(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Speech recognition not supported in this browser');
    }
    if (!this.recognition) {
      throw new Error('Recognition not initialized');
    }

    // If already listening, don't start again
    if (this.listening) {
      console.log('Already listening, skipping start');
      return;
    }

    // Reset buffers when starting new recording
    this.resetBuffers();
    this.flushCallback = null; // Clear any pending flush

    // Set language
    if (this.language === 'auto') {
      // Try Romanian first, fallback to English
      this.recognition.lang = 'ro-RO';
    } else if (this.language === 'ro') {
      this.recognition.lang = 'ro-RO';
    } else {
      this.recognition.lang = 'en-US';
    }

    try {
      this.recognition.start();
      this.listening = true;
      this.wasRecording = true;
      console.log('Speech recognition started, language:', this.recognition.lang);
    } catch (error: any) {
      if (error.name !== 'InvalidStateError') {
        console.error('Error starting recognition:', error);
        throw error;
      }
      // Already started, but mark as listening
      this.listening = true;
      this.wasRecording = true;
    }
  }

  stop(): void {
    if (this.recognition) {
      this.listening = false;
      this.wasRecording = false;
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore errors
      }
    }
  }

  /**
   * Flush and stop: waits for last result, then stops and returns accumulated text
   */
  async flushAndStop(): Promise<string> {
    return new Promise((resolve) => {
      if (!this.recognition || !this.wasRecording) {
        const segmentText = (this.finalBuffer + ' ' + this.currentPartial).trim();
        this.resetBuffers();
        resolve(segmentText);
        return;
      }

      let resolved = false;
      
      // Set up flush callback
      this.flushCallback = () => {
        if (resolved) return;
        resolved = true;
        const segmentText = (this.finalBuffer + ' ' + this.currentPartial).trim();
        this.resetBuffers();
        this.flushCallback = null;
        resolve(segmentText);
      };

      // Stop recognition first (this will trigger onend)
      this.listening = false;
      this.wasRecording = false;
      
      try {
        this.recognition.stop();
      } catch (e) {
        // If stop fails, resolve immediately
        if (!resolved && this.flushCallback) {
          this.flushCallback();
        }
      }

      // Fallback timeout - wait for last onresult event
      setTimeout(() => {
        if (!resolved && this.flushCallback) {
          this.flushCallback();
        }
      }, 300); // Wait 300ms for last result
    });
  }

  private resetBuffers(): void {
    this.finalBuffer = '';
    this.currentPartial = '';
  }

  onPartial(callback: (text: string) => void): void {
    this.partialCallback = callback;
  }

  onFinal(callback: (text: string) => void): void {
    this.finalCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  setLanguage(language: 'auto' | 'ro' | 'en'): void {
    this.language = language;
    if (this.recognition) {
      if (language === 'auto') {
        this.recognition.lang = 'ro-RO';
      } else if (language === 'ro') {
        this.recognition.lang = 'ro-RO';
      } else {
        this.recognition.lang = 'en-US';
      }
    }
  }

  isListening(): boolean {
    return this.listening;
  }

  getCurrentPartial(): string {
    return this.currentPartial;
  }
}

// TODO: Future implementation
// export class ServerWhisperProvider implements TranscriptionProvider {
//   // Server-side Whisper API implementation
//   // Will use WebSocket or SSE for streaming
// }
