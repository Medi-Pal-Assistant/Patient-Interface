'use client';

import { useEffect, useRef } from 'react';
import { IoMic, IoMicOff } from "react-icons/io5";
import clsx from 'clsx';

interface VoiceChatProps {
  isListening: boolean;
  audioLevel: number;
  transcript: string;
  isProcessing: boolean;
  isSessionInitializing: boolean;
  microphonePermission: 'granted' | 'denied' | 'prompt';
  retryCount: number;
  onToggleListening: () => void;
}

export function VoiceChat({
  isListening,
  audioLevel,
  transcript,
  isProcessing,
  isSessionInitializing,
  microphonePermission,
  retryCount,
  onToggleListening,
}: VoiceChatProps) {
  const showError = useRef(false);

  useEffect(() => {
    if (microphonePermission === 'denied' && !showError.current) {
      showError.current = true;
      // You can implement your own toast notification here if needed
    }
  }, [microphonePermission]);

  return (
    <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-xl">
      <div className="flex flex-col gap-3">
        {transcript && (
          <p className="text-sm text-gray-600">
            {transcript}
          </p>
        )}
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden max-w-[200px] mb-2">
            <div
              className={clsx(
                "h-full transition-all duration-100 ease-out",
                isListening ? "bg-blue-500" : "bg-gray-400"
              )}
              style={{ width: `${audioLevel * 100}%` }}
            />
          </div>
          <button
            type="button"
            onClick={onToggleListening}
            disabled={isProcessing || microphonePermission === 'denied' || isSessionInitializing}
            className={clsx(
              "relative w-16 h-16 rounded-full flex items-center justify-center transition-colors",
              isListening ? "bg-red-500 hover:bg-red-600" : 
                microphonePermission === 'denied' ? "bg-gray-400" : 
                "bg-blue-500 hover:bg-blue-600",
              (isProcessing || microphonePermission === 'denied' || isSessionInitializing) && "opacity-50 cursor-not-allowed",
              "text-white shadow-sm",
              isListening && "before:absolute before:inset-[-8px] before:border-3 before:border-red-500 before:rounded-full before:animate-pulse",
              isListening && "after:absolute after:inset-[-4px] after:border-3 after:border-red-500 after:rounded-full after:animate-pulse after:animation-delay-750"
            )}
            title={
              isSessionInitializing 
                ? "Initializing session..."
                : microphonePermission === 'denied' 
                  ? "Microphone access denied. Please enable it in your browser settings." 
                  : isListening 
                    ? "Stop recording" 
                    : "Start recording"
            }
          >
            {isProcessing || isSessionInitializing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              isListening ? (
                <IoMicOff className="w-7 h-7" />
              ) : (
                <IoMic className="w-7 h-7" />
              )
            )}
          </button>
        </div>
        {microphonePermission === 'denied' && (
          <div className="flex flex-col items-center gap-2 mt-2">
            <p className="text-sm text-red-500 text-center">
              Microphone access is required. Please enable it in your browser settings.
            </p>
            {retryCount < 5 && (
              <p className="text-xs text-gray-500">
                Retrying to get access... ({5 - retryCount} attempts remaining)
              </p>
            )}
          </div>
        )}
        {microphonePermission === 'prompt' && !isListening && (
          <p className="text-sm text-gray-500 text-center mt-2">
            Click the microphone button to allow voice access
          </p>
        )}
      </div>
    </div>
  );
} 