import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { KeyboardEvent, useEffect, useRef } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

export function ChatInput({ value, onChange, onSend }: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount for better UX
    inputRef.current?.focus();
  }, []);

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-4">
      <div className="flex items-center space-x-4">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          className="flex-1 rounded-full border border-gray-200 px-4 py-2 
            text-gray-900 placeholder-gray-500
            bg-gray-50 hover:bg-gray-100 
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-colors"
          aria-label="Message input"
        />
        <button
          onClick={onSend}
          disabled={!value.trim()}
          className={clsx(
            'rounded-full p-2 transition-colors',
            value.trim()
              ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'
              : 'bg-gray-100 text-gray-400'
          )}
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
} 