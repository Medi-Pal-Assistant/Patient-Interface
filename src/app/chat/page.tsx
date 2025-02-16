"use client";

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessage, Message } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { Container } from '@/components/ui/Container';
import { useToolDefinitions } from '@/lib/tools';
import { searchPatient, getPatientById } from '@/lib/qdrant';

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

const SYSTEM_MESSAGE = {
  role: "system" as const,
  content: `You are MediPal, an AI medical assistant. Help users with:
- Understanding general medical concepts and terminology
- Providing information about common health conditions and symptoms
- Offering general wellness and preventive health advice
- Explaining medical procedures and treatments in simple terms
- Providing medication information and potential side effects
- Answering questions about healthy lifestyle choices
- Suggesting when to seek professional medical care

Remember to:
- Always clarify that you provide general information, not medical diagnosis
- Encourage users to consult healthcare professionals for specific medical advice
- Be clear about your limitations as an AI assistant
- Maintain a compassionate and professional tone
- Prioritize user privacy and confidentiality
- Provide evidence-based information when possible
- Use the available tools to look up patient information when needed`
};

const getChatCompletion = async (
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  tools: any[]
) => {
  const openai = getOpenAIClient();
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [SYSTEM_MESSAGE, ...messages],
      temperature: 0.7,
      max_tokens: 1000,
      tools: tools,
      tool_choice: "auto",
    });

    const message = completion.choices[0].message;
    
    // Handle tool calls if present
    if (message.tool_calls) {
      const toolResults = await Promise.all(
        message.tool_calls.map(async (toolCall) => {
          const args = JSON.parse(toolCall.function.arguments);
          
          switch (toolCall.function.name) {
            case 'get_patient_id':
              try {
                const patient = await searchPatient(
                  args.firstName,
                  args.lastName,
                  args.dateOfBirth,
                  args.medicareNo
                );
                return {
                  tool_call_id: toolCall.id,
                  output: JSON.stringify(patient ? { id: patient.id } : { error: 'Patient not found' })
                };
              } catch (error) {
                return {
                  tool_call_id: toolCall.id,
                  output: JSON.stringify({ error: 'Error searching for patient' })
                };
              }
            
            case 'get_patient_details':
              try {
                const patient = await getPatientById(args.patientId);
                return {
                  tool_call_id: toolCall.id,
                  output: JSON.stringify(patient || { error: 'Patient not found' })
                };
              } catch (error) {
                return {
                  tool_call_id: toolCall.id,
                  output: JSON.stringify({ error: 'Error retrieving patient details' })
                };
              }
            
            default:
              return {
                tool_call_id: toolCall.id,
                output: JSON.stringify({ error: 'Unknown tool' })
              };
          }
        })
      );

      // Get the final response with tool outputs
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          SYSTEM_MESSAGE,
          ...messages,
          {
            role: 'assistant',
            content: message.content,
            tool_calls: message.tool_calls,
          },
          ...toolResults.map(result => ({
            role: 'tool' as const,
            content: result.output,
            tool_call_id: result.tool_call_id,
          }))
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return finalResponse.choices[0].message.content;
    }

    return message.content;
  } catch (error) {
    console.error('Error getting chat completion:', error);
    throw error;
  }
};

export default function ChatPage() {
  const { getToolDefinitions } = useToolDefinitions();
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

      // Get response from OpenAI with tools from hook
      const response = await getChatCompletion(chatMessages, getToolDefinitions());

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
