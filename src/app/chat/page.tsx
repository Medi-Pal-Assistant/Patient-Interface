'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessage, Message } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { Container } from '@/components/ui/Container';
import { getChatCompletion } from '@/lib/openai';

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

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
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

      <ChatInput
        value={inputMessage}
        onChange={setInputMessage}
        onSend={handleSendMessage}
      />
    </Container>
  );
}
