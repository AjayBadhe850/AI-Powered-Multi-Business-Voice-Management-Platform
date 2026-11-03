import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const VoiceContext = createContext(null);

export const VoiceProvider = ({ children }) => {
  // State machine: 'IDLE' | 'LISTENING' | 'UNDERSTANDING' | 'PROCESSING' | 'SPEAKING' | 'ERROR'
  const [status, setStatus] = useState('IDLE');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [activeClarification, setActiveClarification] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [lastTimingMs, setLastTimingMs] = useState(null);
  const [activePrintReport, setActivePrintReport] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // References to prevent race conditions, microphone loops, and memory leaks
  const recognitionRef = useRef(null);
  const isProcessingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const lastQueryRef = useRef({ text: '', timestamp: 0 });
  const finalTranscriptRef = useRef('');
  const activeAudioRef = useRef(null);

  // Trigger silent or modal browser print
  const triggerPrint = useCallback((html) => {
    if (!html) return;
    try {
      let printFrame = document.getElementById('silent-print-iframe');
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'silent-print-iframe';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        document.body.appendChild(printFrame);
      }

      const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(html);
        frameDoc.close();

        setTimeout(() => {
          try {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
          } catch (e) {
            console.warn('Silent print execution fallback:', e);
          }
        }, 500);
      }
    } catch (err) {
      console.warn('Print trigger error:', err);
    }
  }, []);

  // Stop any active speech (ElevenLabs audio element or browser Web Speech)
  const stopSpeaking = useCallback(() => {
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch (e) {
        // ignore
      }
      activeAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
    setStatus('IDLE');
  }, []);

  // Natural Speech Synthesis: ElevenLabs first, seamless browser fallback
  const speak = useCallback(async (text) => {
    if (!isTtsEnabled || !text) {
      setStatus('IDLE');
      return;
    }

    // Stop microphone recognition while playing audio to prevent audio feedback loop
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
    }

    stopSpeaking();
    isSpeakingRef.current = true;
    setStatus('SPEAKING');

    // Attempt ElevenLabs low-latency TTS from backend
    try {
      const res = await api.post('/voice/tts', { text }, {
        responseType: 'blob',
        timeout: 4500,
      });

      if (res.headers['content-type']?.includes('audio') && res.data.size > 100) {
        const audioUrl = URL.createObjectURL(res.data);
        const audio = new Audio(audioUrl);
        activeAudioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          activeAudioRef.current = null;
          isSpeakingRef.current = false;
          setStatus('IDLE');
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          activeAudioRef.current = null;
          fallbackBrowserSpeech(text);
        };

        await audio.play();
        return;
      }
    } catch (err) {
      // ElevenLabs not configured or timed out, fall back immediately to browser speech
    }

    // Fallback: Web Speech API (0ms latency, always available locally)
    fallbackBrowserSpeech(text);
  }, [isTtsEnabled, stopSpeaking]);

  const fallbackBrowserSpeech = (text) => {
    if (!('speechSynthesis' in window)) {
      isSpeakingRef.current = false;
      setStatus('IDLE');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05; // Slightly brisk, responsive pace
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
      );
      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.onend = () => {
        isSpeakingRef.current = false;
        setStatus('IDLE');
      };

      utterance.onerror = () => {
        isSpeakingRef.current = false;
        setStatus('IDLE');
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      isSpeakingRef.current = false;
      setStatus('IDLE');
    }
  };

  // Main query processing: non-blocking, debounced, instant UI updates
  const processQuery = useCallback(async (queryText) => {
    const cleanText = (queryText || '').trim();
    if (!cleanText) return null;

    // Suppress duplicate submissions within 2.5s window
    const now = Date.now();
    if (
      lastQueryRef.current.text === cleanText.toLowerCase() &&
      now - lastQueryRef.current.timestamp < 2500
    ) {
      return null;
    }

    if (isProcessingRef.current) return null;

    isProcessingRef.current = true;
    lastQueryRef.current = { text: cleanText.toLowerCase(), timestamp: now };
    setStatus('UNDERSTANDING');
    setErrorMessage(null);

    // Abort recognition immediately while processing query
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
    }

    const tStart = performance.now();

    try {
      const res = await api.post('/voice/process', { query: cleanText });
      const durationMs = Math.round(performance.now() - tStart);
      setLastTimingMs(durationMs);

      const data = res.data?.data;
      if (data) {
        setLastResponse(data);

        const turn = {
          id: Date.now(),
          query: cleanText,
          response: data.spokenResponse || data.displayMessage,
          intent: data.intent,
          business: data.business,
          success: data.success,
          timingMs: durationMs,
          requiresClarification: data.requiresClarification,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        // Display response text immediately!
        setConversationHistory((prev) => [turn, ...prev]);

        if (data.requiresClarification) {
          setActiveClarification(data.spokenResponse);
        } else {
          setActiveClarification(null);
        }

        // Notify other pages/dashboards to re-fetch updated numbers
        window.dispatchEvent(new CustomEvent('business-data-updated'));

        // If query produced a printable report, open preview and trigger print dialog
        if (data.printReport) {
          setActivePrintReport(data.printReport);
          setIsPrintModalOpen(true);
          triggerPrint(data.printReport.html);
        }

        // Play audio without blocking text rendering
        if (data.spokenResponse) {
          speak(data.spokenResponse);
        } else {
          setStatus('IDLE');
        }

        return data;
      }
    } catch (err) {
      const errText = err.response?.data?.message || err.message || 'Error processing request';
      setErrorMessage(errText);
      setStatus('ERROR');
      const failTurn = {
        id: Date.now(),
        query: cleanText,
        response: `Error: ${errText}`,
        success: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setConversationHistory((prev) => [failTurn, ...prev]);
      speak(`I could not complete that request: ${errText}`);
    } finally {
      isProcessingRef.current = false;
      setTranscript('');
      setInterimTranscript('');
      finalTranscriptRef.current = '';
    }
  }, [speak]);

  // Speech Recognition initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setStatus('LISTENING');
      setErrorMessage(null);
      finalTranscriptRef.current = '';
      setTranscript('');
      setInterimTranscript('');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      if (final) {
        finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + final.trim();
        setTranscript(finalTranscriptRef.current);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setErrorMessage('Microphone access denied. Please allow microphone permissions or use typed input.');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setErrorMessage(`Speech recognition error: ${event.error}`);
      }
      setStatus((prev) => (prev === 'LISTENING' ? 'IDLE' : prev));
    };

    recognition.onend = () => {
      const captured = (finalTranscriptRef.current || '').trim();
      finalTranscriptRef.current = '';

      if (captured && !isProcessingRef.current && !isSpeakingRef.current) {
        processQuery(captured);
      } else {
        setStatus((prev) => (prev === 'LISTENING' ? 'IDLE' : prev));
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch (e) {
        // ignore
      }
      stopSpeaking();
    };
  }, [processQuery, stopSpeaking]);

  const startListening = () => {
    if (!recognitionRef.current) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use typed input.');
      return;
    }
    if (isSpeakingRef.current) stopSpeaking();
    if (isProcessingRef.current) return;

    try {
      finalTranscriptRef.current = '';
      setTranscript('');
      setInterimTranscript('');
      setErrorMessage(null);
      recognitionRef.current.start();
    } catch (err) {
      // ignore
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // ignore
      }
    }
    setStatus((prev) => (prev === 'LISTENING' ? 'IDLE' : prev));
  };

  const clearConversation = () => {
    setConversationHistory([]);
    setLastResponse(null);
    setActiveClarification(null);
    setErrorMessage(null);
    setLastTimingMs(null);
  };

  return (
    <VoiceContext.Provider
      value={{
        status,
        isListening: status === 'LISTENING',
        isProcessing: status === 'UNDERSTANDING' || status === 'PROCESSING',
        isSpeaking: status === 'SPEAKING',
        transcript,
        setTranscript,
        interimTranscript,
        lastResponse,
        lastTimingMs,
        isSpeechSupported,
        isTtsEnabled,
        setIsTtsEnabled,
        conversationHistory,
        activeClarification,
        errorMessage,
        activePrintReport,
        setActivePrintReport,
        isPrintModalOpen,
        setIsPrintModalOpen,
        triggerPrint,
        startListening,
        stopListening,
        stopSpeaking,
        clearConversation,
        processQuery,
        speak,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => useContext(VoiceContext);
