'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessage, Message } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { Container } from '@/components/ui/Container';


import OpenAI from 'openai';

// Initialize OpenAI client
export const getOpenAIClient = () => {
  const apiKey = localStorage.getItem('medipal_api_key');
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found');
  }

  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });
};

const getChatCompletion = async (messages: { role: 'user' | 'assistant' | 'system'; content: string }[]) => {
  const openai = getOpenAIClient();
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are MediPal, an AI medical assistant. Provide accurate, helpful medical information while being clear about your limitations and encouraging users to seek professional medical advice for diagnosis and treatment."
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error getting chat completion:', error);
    throw error;
  }
}; 

export default function ChatPage() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I am your MediPal. How can I assist you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = () => {
    if (mounted && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (mounted && messages.length > 0) {
      // Only scroll on new messages
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.timestamp.getTime() > Date.now() - 1000) {
        scrollToBottom();
      }
    }
  }, [messages, mounted]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputMessage('');
    setIsTyping(true);
    setError(null);

    try {
      // Convert messages to OpenAI format
      const chatMessages = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));
      chatMessages.push({ role: 'user', content: inputMessage });

      // Get response from OpenAI
      const response = await getChatCompletion(chatMessages);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response || 'I apologize, but I was unable to generate a response. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(
        err instanceof Error && err.message === 'OpenAI API key not found'
          ? 'Please set your OpenAI API key in the settings page to continue.'
          : 'An error occurred while processing your message. Please try again.'
      );
      // Remove the user's message if we couldn't get a response
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsTyping(false);
    }
  };

  if (!mounted) {
    return null; // Prevent hydration issues by not rendering until mounted
  }

  return (
    <Container>
      <ChatHeader
        title="MediPal"
        subtitle="Your Virtual Health Assistant"
        avatarText="MP"
      />

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 space-y-4">
          <AnimatePresence initial={mounted}>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </AnimatePresence>
          
          {isTyping && <TypingIndicator />}
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} className="h-px" />
        </div>
      </div>

      <ChatInput
        value={inputMessage}
        onChange={setInputMessage}
        onSend={handleSendMessage}
      />
    </Container>
  );
}
