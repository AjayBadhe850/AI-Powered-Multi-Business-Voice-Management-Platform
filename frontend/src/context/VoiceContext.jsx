import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

const VoiceContext = createContext(null);

export const VoiceProvider = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [activeClarification, setActiveClarification] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const recognitionRef = useRef(null);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. Please allow microphone permissions in your browser or use typed input below.');
        } else if (event.error === 'no-speech') {
          setErrorMessage('No speech was detected. Please try speaking again.');
        } else {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSpeechSupported(false);
      console.warn('Web Speech API is not supported in this browser. Typed input fallback is fully available.');
    }
  }, []);

  // Text-To-Speech function
  const speak = (text) => {
    if (!isTtsEnabled || !('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      // Pick a natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis error:', err);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use the typed input box.');
      return;
    }
    try {
      setTranscript('');
      setErrorMessage(null);
      recognitionRef.current.start();
    } catch (err) {
      console.warn('Could not start recognition:', err);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const processQuery = async (queryText) => {
    const textToProcess = (queryText || transcript).trim();
    if (!textToProcess) return null;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await api.post('/voice/process', { query: textToProcess });
      const data = res.data?.data;

      if (data) {
        setLastResponse(data);

        // Update history
        const turn = {
          id: Date.now(),
          query: textToProcess,
          response: data.spokenResponse || data.displayMessage,
          intent: data.intent,
          business: data.business,
          success: data.success,
          requiresClarification: data.requiresClarification,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setConversationHistory((prev) => [turn, ...prev]);

        if (data.requiresClarification) {
          setActiveClarification(data.spokenResponse);
        } else {
          setActiveClarification(null);
        }

        // Speak confirmed backend result
        if (data.spokenResponse) {
          speak(data.spokenResponse);
        }

        // Notify page components to refresh data
        window.dispatchEvent(new CustomEvent('vocal-labs-data-updated'));

        return data;
      }
    } catch (err) {
      const errText = err.response?.data?.message || err.message || 'Error processing request';
      setErrorMessage(errText);
      const failTurn = {
        id: Date.now(),
        query: textToProcess,
        response: `Error: ${errText}`,
        success: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setConversationHistory((prev) => [failTurn, ...prev]);
      speak(`I could not complete that request: ${errText}`);
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  };

  return (
    <VoiceContext.Provider
      value={{
        isListening,
        transcript,
        setTranscript,
        isProcessing,
        lastResponse,
        isSpeechSupported,
        isTtsEnabled,
        setIsTtsEnabled,
        conversationHistory,
        activeClarification,
        errorMessage,
        startListening,
        stopListening,
        processQuery,
        speak,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => useContext(VoiceContext);
