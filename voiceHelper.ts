export interface VoiceOption {
  name: string;
  lang: string;
  uri: string;
}

export class VoiceController {
  private synth: SpeechSynthesis | null = null;
  private recognition: any = null;
  public isListening = false;
  public isSpeaking = false;

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
      }
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
      }
    }
  }

  public getAvailableVoices(): VoiceOption[] {
    if (!this.synth) return [];
    return this.synth.getVoices().map(v => ({
      name: v.name,
      lang: v.lang,
      uri: v.voiceURI
    }));
  }

  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: string) => void,
    onEnd: () => void,
    lang: string = 'en-US'
  ) {
    if (!this.recognition) {
      onError('Speech Recognition is not supported in this browser.');
      return;
    }

    try {
      this.recognition.lang = lang;
      this.isListening = true;

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          onResult(finalTranscript, true);
        } else if (interimTranscript) {
          onResult(interimTranscript, false);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        onError(event.error || 'Speech input error');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd();
      };

      this.recognition.start();
    } catch (e: any) {
      this.isListening = false;
      onError(e?.message || 'Could not start microphone');
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  public speak(
    text: string,
    options: { voiceURI?: string; rate?: number; pitch?: number; lang?: string } = {},
    onEnd?: () => void
  ) {
    if (!this.synth) return;

    // Stop any existing speech
    this.stopSpeaking();

    // Strip Markdown code blocks & HTML tags for speech output
    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' Code snippet omitted. ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_#~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.lang = options.lang || 'en-US';

    const voices = this.synth.getVoices();
    if (options.voiceURI) {
      const selectedVoice = voices.find(v => v.voiceURI === options.voiceURI);
      if (selectedVoice) utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  public async speakGeminiTTS(
    text: string,
    voiceName: string = 'Kore',
    onEnd?: () => void
  ): Promise<HTMLAudioElement | null> {
    this.stopSpeaking();
    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' Code snippet omitted. ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_#~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    if (!cleanText) return null;

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voiceName })
      });

      if (!response.ok) {
        throw new Error('TTS response error');
      }

      const data = await response.json();
      if (data.audioData) {
        const audio = new Audio(data.audioData);
        this.isSpeaking = true;
        audio.onended = () => {
          this.isSpeaking = false;
          if (onEnd) onEnd();
        };
        audio.onerror = () => {
          this.isSpeaking = false;
          // Fallback to local speech synth
          this.speak(cleanText, {}, onEnd);
        };
        await audio.play();
        return audio;
      }
    } catch (err) {
      console.warn('Gemini TTS failed, falling back to Web Speech API:', err);
    }

    // Fallback if Gemini TTS fails
    this.speak(cleanText, {}, onEnd);
    return null;
  }

  public stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }
}

export const voiceController = new VoiceController();
