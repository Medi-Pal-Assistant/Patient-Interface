'use client'


import { useState, useEffect, useRef } from "react"
import { enqueueSnackbar } from 'notistack'
import { IoMic, IoMicOff, IoKey, IoSettings, IoInformationCircle } from "react-icons/io5"
import ReactMarkdown from 'react-markdown'
import { SettingsPanel } from '@/components/ui/settings-panel'
import { AnimatePresence } from 'framer-motion'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { Container } from '@/components/ui/Container'
import clsx from 'clsx'

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type Message = {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  sender: 'user' | 'bot'
  timestamp: Date
  tempId?: string
}

type ToolDefinitionType = {
  type?: "function"
  name: string
  description: string
  parameters: { [key: string]: any }
}

type AudioFormatType = "pcm16" | "g711_ulaw" | "g711_alaw"

type AudioTranscriptionType = {
  model: "whisper-1"
}

type TurnDetectionServerVadType = {
  type: "server_vad"
  threshold?: number
  prefix_padding_ms?: number
  silence_duration_ms?: number
}

type SessionResourceType = {
  model?: string
  modalities?: string[]
  instructions?: string
  voice?: "alloy" | "ash" | "ballad" | "coral" | "echo" | "sage" | "shimmer" | "verse"
  input_audio_format?: AudioFormatType
  output_audio_format?: AudioFormatType
  input_audio_transcription?: AudioTranscriptionType | null
  turn_detection?: TurnDetectionServerVadType | null
  tools?: ToolDefinitionType[]
  tool_choice?: "auto" | "none" | "required" | { type: "function"; name: string }
  temperature?: number
  max_response_output_tokens?: number | "inf"
}

type ItemStatusType = "in_progress" | "completed" | "incomplete"

type InputTextContentType = {
  type: "input_text"
  text: string
}

type InputAudioContentType = {
  type: "input_audio"
  audio?: string
  transcript?: string | null
}

type TextContentType = {
  type: "text"
  text: string
}

type AudioContentType = {
  type: "audio"
  audio?: string
  transcript?: string | null
}

type BaseItemType = {
  previous_item_id?: string | null
  type: "message" | "function_call" | "function_call_output"
  status?: ItemStatusType
  role?: "user" | "assistant" | "system"
  content?: Array<InputTextContentType | InputAudioContentType | TextContentType | AudioContentType>
  call_id?: string
  name?: string
  arguments?: string
  output?: string
}

type ItemType = BaseItemType & {
  id: string
  object: string
  formatted: {
    audio?: Int16Array
    text?: string
    transcript?: string
    tool?: {
      type: "function"
      name: string
      call_id: string
      arguments: string
    }
    output?: string
    file?: any
  }
}

const STORAGE_KEY = 'medipal_api_key'
const SETTINGS_STORAGE_KEY = 'medipal_voice_settings'

const SYSTEM_MESSAGE: Message = {
  id: 'system-0',
  role: 'system',
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
- Provide evidence-based information when possible`,
  sender: 'bot',
  timestamp: new Date()
}

const defaultSessionConfig: SessionResourceType = {
  modalities: ['text', 'audio'],
  instructions: SYSTEM_MESSAGE.content,
  voice: 'echo',  // Using a more neutral, professional voice
  input_audio_format: 'pcm16',
  output_audio_format: 'pcm16',
  input_audio_transcription: {
    model: "whisper-1"
  },
  turn_detection: {
    type: 'server_vad',
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 200,
  },
  temperature: 0.7,
  max_response_output_tokens: 4096,
}

const defaultServerVadConfig: TurnDetectionServerVadType = {
  type: 'server_vad',
  threshold: 0.5,
  prefix_padding_ms: 300,
  silence_duration_ms: 200,
}

export default function VoicePage() {
  const [apiKey, setApiKey] = useState("")
  const [isApiKeySet, setIsApiKeySet] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{
    ...SYSTEM_MESSAGE,
    id: '0',
    sender: 'bot',
    timestamp: new Date()
  }])
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [microphonePermission, setMicrophonePermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [retryCount, setRetryCount] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  
  const audioQueueRef = useRef<Array<Int16Array>>([])
  const isPlayingRef = useRef(false)
  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const playbackAudioContextRef = useRef<AudioContext | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Add new state for session initialization
  const [isSessionInitializing, setIsSessionInitializing] = useState(true)

  // Initialize playback audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      playbackAudioContextRef.current = new AudioContext()
    }
    return () => {
      playbackAudioContextRef.current?.close()
    }
  }, [])

  // Check microphone permissions on mount and retry if denied
  useEffect(() => {
    const checkMicrophonePermissions = async () => {
      try {
        // Check if permissions API is available
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          setMicrophonePermission(result.state)
          
          // Listen for permission changes
          result.addEventListener('change', () => {
            setMicrophonePermission(result.state)
            if (result.state === 'denied') {
              setRetryCount(prev => prev + 1)
            }
          })

          // If denied, try requesting directly through getUserMedia
          if (result.state === 'denied') {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
              stream.getTracks().forEach(track => track.stop())
              setMicrophonePermission('granted')
            } catch {
              setRetryCount(prev => prev + 1)
            }
          }
        } else {
          // Fallback to getUserMedia check
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            stream.getTracks().forEach(track => track.stop())
            setMicrophonePermission('granted')
          } catch {
            setRetryCount(prev => prev + 1)
          }
        }
      } catch (error) {
        console.error('Error checking microphone permissions:', error)
        setMicrophonePermission('prompt')
        setRetryCount(prev => prev + 1)
      }
    }

    if (typeof window !== 'undefined') {
      checkMicrophonePermissions()
    }
  }, [])

  // Retry getting microphone permissions periodically if denied
  useEffect(() => {
    if (microphonePermission === 'denied' && retryCount < 5) {
      const retryTimer = setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          stream.getTracks().forEach(track => track.stop())
          setMicrophonePermission('granted')
        } catch (error) {
          console.log('Retry attempt failed:', retryCount + 1)
          setRetryCount(prev => prev + 1)
        }
      }, 2000 * (retryCount + 1)) // Exponential backoff

      return () => clearTimeout(retryTimer)
    }
  }, [microphonePermission, retryCount])

  // Initialize from localStorage
  useEffect(() => {
    setMounted(true)
    const savedKey = localStorage.getItem(STORAGE_KEY)
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY)
    
    console.log('savedKey', savedKey)
    if (savedKey) {
      setApiKey(savedKey)
      setIsApiKeySet(true)
      initializeWebSocket(savedKey)
    }

    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setIsSessionInitializing(false)
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // Cleanup function
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const initializeWebSocket = (key: string) => {
    const ws = new WebSocket(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
        [
          "realtime",
          // Auth
          "openai-insecure-api-key." + key, 

          // Beta protocol, required
          "openai-beta.realtime-v1"
        ]
      );

      ws.onopen = () => {
        console.log('WebSocket connected');
        // Send initial session configuration
        try {
          ws.send(JSON.stringify({
            type: 'session.update',
            session: defaultSessionConfig
          }));
        } catch (error) {
          console.error('Error sending session config:', error);
          enqueueSnackbar("Failed to initialize session", { variant: "error" });
        }
      };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
        enqueueSnackbar("Failed to process response", { variant: "error" })
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      enqueueSnackbar("Failed to connect to OpenAI", { variant: "error" })
    }

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason)
      if (!event.wasClean) {
        enqueueSnackbar("Connection closed unexpectedly", { variant: "error" })
      }
    }

    wsRef.current = ws
  }

  const handleWebSocketMessage = async (data: any) => {
    try {
      switch (data.type) {
        case 'session.created':
          console.log('Session created:', data.session)
          setSessionId(data.session)
          break

        case 'session.updated':
          console.log('Session configuration updated:', data.session)
          setIsApiKeySet(true)
          setIsSessionInitializing(false)
          break

        case 'conversation.item.created':
          console.log('Conversation item created:', data.item)
          if (data.item.role === 'assistant') {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: data.item.content[0]?.text || '',
              sender: 'bot',
              timestamp: new Date()
            }])
          } else if (data.item.role === 'user') {
            const content = data.item.content[0]
            if (content?.type === 'input_text') {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'user',
                content: content.text,
                sender: 'user',
                timestamp: new Date()
              }])
            }
          }
          break

        case 'input_audio_buffer.committed':
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'user',
            content: '',
            sender: 'user',
            timestamp: new Date(),
            tempId: data.item_id
          }])
          break

        case 'conversation.item.input_audio_transcription.completed':
          if (data.item_id && data.transcript) {
            setMessages(prev => {
              const messageIndex = prev.findIndex(msg => 
                msg.role === 'user' && 
                msg.tempId === data.item_id
              )
              
              if (messageIndex !== -1) {
                const updatedMessages = [...prev]
                updatedMessages[messageIndex] = {
                  ...updatedMessages[messageIndex],
                  content: data.transcript
                }
                return updatedMessages
              }
              
              return [...prev, {
                id: Date.now().toString(),
                role: 'user',
                content: data.transcript,
                sender: 'user',
                timestamp: new Date()
              }]
            })
            
            setTranscript(data.transcript)
          }
          break

        case 'response.text.delta':
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1]
            if (lastMessage?.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                {
                  ...lastMessage,
                  content: lastMessage.content + data.delta.text
                }
              ]
            }
            return prev
          })
          break

        case 'response.audio_transcript.delta':
          if (data.delta) {
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1]
              if (lastMessage?.role === 'assistant') {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...lastMessage,
                    content: lastMessage.content + data.delta
                  }
                ]
              }
              return prev
            })
          }
          break

        case 'response.audio.delta':
          if (data.delta && playbackAudioContextRef.current) {
            try {
              const audioData = atob(data.delta)
              const bytes = new Uint8Array(audioData.length)
              for (let i = 0; i < audioData.length; i++) {
                bytes[i] = audioData.charCodeAt(i)
              }
              
              const pcmData = new Int16Array(bytes.buffer)
              const pcmArray = Array.from(pcmData)
              audioQueueRef.current.push(new Int16Array(pcmArray))
              
              if (!isPlayingRef.current) {
                playNextInQueue()
              }
            } catch (error: unknown) {
              if (error instanceof Error) {
                console.error('Error processing audio:', error.message)
              } else {
                console.error('Unknown error processing audio:', error)
              }
            }
          }
          break

        case 'error':
          console.error('Server error:', data.error)
          if (data.error?.type === 'invalid_request_error') {
            switch (data.error?.code) {
              case 'missing_required_parameter':
                enqueueSnackbar(`Configuration error: ${data.error.message}`, { 
                  variant: "error",
                  autoHideDuration: 5000
                })
                break
              default:
                enqueueSnackbar(data.error.message || "Server error occurred", { 
                  variant: "error",
                  autoHideDuration: 5000
                })
            }
          } else {
            enqueueSnackbar("An unexpected error occurred", { 
              variant: "error",
              autoHideDuration: 5000
            })
          }
          break

        default:
          console.log('Unhandled message type:', data.type, data)
      }
    } catch (error: unknown) {
      console.error('Error handling WebSocket message:', error)
      enqueueSnackbar("Failed to process server message", { 
        variant: "error",
        autoHideDuration: 5000
      })
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })

      streamRef.current = stream

      // Set up audio context and analyser
      const audioContext = new AudioContext({
        sampleRate: 24000,
      })
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()

      // Create and connect AudioWorkletNode
      await audioContext.audioWorklet.addModule('/audioProcessor.js')
      const workletNode = new AudioWorkletNode(audioContext, 'audio-processor')
      
      analyser.fftSize = 256
      source.connect(analyser)
      analyser.connect(workletNode)
      //workletNode.connect(audioContext.destination)

      // Handle audio data from worklet
      workletNode.port.onmessage = (event) => {
        if (event.data.type === 'audio') {
          const pcmData = event.data.pcmData
          // Convert to base64 and send
          const base64Data = btoa(
            String.fromCharCode.apply(null, new Uint8Array(pcmData.buffer))
          )

          wsRef.current?.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Data
          }))
        }
      }
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser

      // Start recording and visualization
      updateAudioLevel()
      setIsListening(true)

    } catch (error) {
      console.error('Error starting recording:', error)
      enqueueSnackbar(
        "Failed to start recording. Please check microphone permissions or switch to chrome/brave. (This doesn't work on arc for some reason)",
        { variant: "error" }
      )
    }
  }

  const stopRecording = () => {
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Commit the audio buffer
    wsRef.current?.send(JSON.stringify({
      type: 'input_audio_buffer.commit'
    }))

    setIsListening(false)
    setAudioLevel(0)
  }

  const updateAudioLevel = () => {
    if (!analyserRef.current || !isListening) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    // Calculate average volume level
    const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length
    const normalizedLevel = average / 255 // Normalize to 0-1 range
    setAudioLevel(normalizedLevel)

    animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
  }

  const toggleListening = async () => {
    if (!isListening) {
      await startRecording()
    } else {
      stopRecording()
    }
  }

  const handleVoiceInput = async (text: string) => {
    if (!text.trim() || !wsRef.current || !sessionId) return

    try {
      setIsProcessing(true)
      
      wsRef.current.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{
            type: 'input_text',
            text: text
          }]
        }
      }))

      wsRef.current.send(JSON.stringify({
        type: 'response.create'
      }))

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process voice input"
      enqueueSnackbar(errorMessage, {
        variant: "error",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSetApiKey = () => {
    if (apiKey.trim().startsWith('sk-')) {
      localStorage.setItem(STORAGE_KEY, apiKey)
      setIsApiKeySet(true)
      initializeWebSocket(apiKey)
      enqueueSnackbar("OpenAI API key has been set successfully", { 
        variant: "success" 
      })
    } else {
      enqueueSnackbar("Please enter a valid OpenAI API key starting with 'sk-'", { 
        variant: "error" 
      })
    }
  }

  const handleChangeKey = () => {
    localStorage.removeItem(STORAGE_KEY)
    setApiKey("")
    setIsApiKeySet(false)
    if (wsRef.current) {
      wsRef.current.close()
    }
  }

  // Add playNextInQueue function
  const playNextInQueue = async () => {
    if (!playbackAudioContextRef.current || !audioQueueRef.current.length || isPlayingRef.current) {
      return
    }

    isPlayingRef.current = true
    const pcmData = audioQueueRef.current.shift()!

    try {
      const buffer = playbackAudioContextRef.current.createBuffer(1, pcmData.length, 24000)
      const channelData = buffer.getChannelData(0)

      // Convert to float32 audio
      for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 0x8000
      }

      const source = playbackAudioContextRef.current.createBufferSource()
      source.buffer = buffer
      source.connect(playbackAudioContextRef.current.destination)
      
      if (playbackAudioContextRef.current.state === 'suspended') {
        await playbackAudioContextRef.current.resume()
      }

      source.onended = () => {
        isPlayingRef.current = false
        playNextInQueue()
      }

      source.start()
    } catch (error) {
      console.error('Error playing audio:', error)
      isPlayingRef.current = false
      playNextInQueue()
    }
  }

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop()
          track.enabled = false
        })
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <Container>
      <ChatHeader
        title="MediPal Voice"
        subtitle="Your Voice-Enabled Health Assistant"
        avatarText="MV"
      />

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <AnimatePresence initial={mounted}>
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-px" />
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex justify-center">
          <button
            onClick={toggleListening}

            className={clsx(
              "p-4 rounded-full transition-all transform hover:scale-110",
              isListening ? "bg-red-500 text-white animate-pulse" : "bg-blue-500 text-white",
              microphonePermission !== 'granted' && "bg-gray-300 cursor-not-allowed hover:scale-100"
            )}
          >
            {isListening ? (
              <IoMicOff className="w-6 h-6" />
            ) : (
              <IoMic className="w-6 h-6" />
            )}
          </button>
        </div>
        {isListening && (
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-100"
                style={{ width: `${Math.min(100, audioLevel * 100)}%` }}
              />
            </div>
          </div>
        )}
        {transcript && (
          <div className="mt-4 text-center text-gray-600">
            <p>{transcript}</p>
          </div>
        )}
      </div>

      {microphonePermission === 'prompt' && !isListening && (
        <p className="text-sm text-gray-500 text-center mt-2">
          Click the microphone button to start your health consultation
        </p>
      )}

      {permissionError && (
        <div className="p-4 text-center">
          <p className="text-red-500">{permissionError}</p>
        </div>
      )}
    </Container>
  )
} 