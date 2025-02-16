'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { IoMic, IoMicOff } from 'react-icons/io5';
import { SettingsPanel } from '@/components/ui/settings-panel';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessage, Message } from '@/components/chat/ChatMessage';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { AnimatePresence } from 'framer-motion';
import { Container } from '@/components/ui/Container';

type MessageRole = 'assistant' | 'user';

interface VoiceMessage {
  role: MessageRole;
  content: string;
}

export default function VoiceChatPage() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I am your MediPal Voice Assistant. Speak to interact with me!',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [sendWithoutConfirm, setSendWithoutConfirm] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, [messages]);

  const initializeAudio = useCallback(async () => {
    try {
      // Reset any previous error states
      setPermissionError(null);

      // First check if we already have permission
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      if (permissionStatus.state === 'denied') {
        setHasMicPermission(false);
        setPermissionError('Microphone access is blocked. Please allow microphone access in your browser settings and refresh the page.');
        return;
      }

      // If permission is prompt or granted, request microphone access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });

        mediaStreamRef.current = stream;
        setHasMicPermission(true);

        // Initialize audio context and analyzer
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);

        const updateAudioLevel = () => {
          if (!analyserRef.current) return;
          
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          setAudioLevel(average);
          
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        };
        
        updateAudioLevel();
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setPermissionError('Microphone permission was denied. Please allow microphone access and try again.');
          } else {
            setPermissionError('Error accessing microphone: ' + err.message);
          }
        }
        setHasMicPermission(false);
      }

    } catch (error) {
      console.error('Error initializing audio:', error);
      setHasMicPermission(false);
      setPermissionError('An error occurred while setting up the microphone. Please refresh and try again.');
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      initializeAudio();
    }
  }, [mounted, initializeAudio]);

  const handleSetApiKey = () => {
    setIsApiKeySet(true);
  };

  const handleChangeKey = () => {
    setApiKey('');
    setIsApiKeySet(false);
  };

  const scrollToBottom = () => {
    if (mounted && messagesEndRef.current) {
      const messageContainer = messagesEndRef.current;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              messageContainer.scrollIntoView({ behavior: 'smooth' });
            }
          });
        },
        { threshold: 1.0 }
      );

      observer.observe(messageContainer);
      return () => observer.disconnect();
    }
  };

  useEffect(() => {
    if (mounted) {
      scrollToBottom();
    }
  }, [messages, mounted]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  if (!mounted) {
    return null;
  }

  return (
    <Container>
      <ChatHeader
        title="MediPal Voice"
        subtitle="Your Voice-Enabled Health Assistant"
        avatarText="MV"
      />

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <AnimatePresence initial={mounted}>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-px" />
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex justify-center">
          <button
            onClick={toggleRecording}
            disabled={!hasMicPermission}
            className={clsx(
              "p-4 rounded-full transition-all transform hover:scale-110",
              isRecording
                ? "bg-red-500 text-white animate-pulse"
                : "bg-blue-500 text-white",
              !hasMicPermission && "bg-gray-300 cursor-not-allowed hover:scale-100"
            )}
          >
            {isRecording ? (
              <IoMicOff className="w-6 h-6" />
            ) : (
              <IoMic className="w-6 h-6" />
            )}
          </button>
        </div>
        {isRecording && (
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-100"
                style={{ width: `${Math.min(100, (audioLevel / 255) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {!hasMicPermission && (
        <div className="p-4 text-center">
          <p className="text-red-500 mb-2">Microphone access is required for voice chat</p>
          <button
            onClick={initializeAudio}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Allow Microphone Access
          </button>
        </div>
      )}

      {permissionError && (
        <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
          {permissionError}
        </div>
      )}
    </Container>
  );
} 