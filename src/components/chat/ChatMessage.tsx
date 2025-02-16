import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  // Handle timestamp hydration by using client-side formatting
  const [formattedTime, setFormattedTime] = useState<string>('');

  useEffect(() => {
    setFormattedTime(
      message.timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  }, [message.timestamp]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={clsx(
        'flex',
        message.sender === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={clsx(
          'max-w-[80%] rounded-2xl px-4 py-2 shadow-sm',
          message.sender === 'user'
            ? 'bg-chat-user text-gray-900'
            : 'bg-chat-bot text-gray-800'
        )}
      >
        <p className="text-sm">{message.content}</p>
        <span className="text-xs text-gray-500 mt-1 block">
          {formattedTime}
        </span>
      </div>
    </motion.div>
  );
} 