import { useState, useEffect, useRef } from 'react';

/**
 * Hook para captura de voz usando a Web Speech API nativa (HTML5)
 */
export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Captura uma fala por vez
      recognition.interimResults = true; // Mostra resultados parciais em tempo real
      recognition.lang = 'pt-BR'; // Português do Brasil

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Permissão do microfone negada. Habilite o microfone no navegador.');
        } else if (event.error === 'no-speech') {
          setError('Nenhuma fala detectada. Tente falar mais perto do microfone.');
        } else {
          setError(`Erro no reconhecimento: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      setError('Reconhecimento de voz não suportado neste navegador. Use o Google Chrome ou Safari.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (!isSupported) {
      alert('Seu navegador não suporta reconhecimento de voz direto. Recomendamos usar o Chrome ou Safari.');
      return;
    }
    setTranscript('');
    setError(null);
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.warn('Recognition already started:', err);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    setTranscript
  };
}
