'use client';

import { useState, useEffect } from 'react';
import { SettingsPanel } from '@/components/ui/settings-panel';

const STORAGE_KEY = 'voca_openai_key';
const SETTINGS_STORAGE_KEY = 'voca_voice_settings';

interface VoiceSettingsProps {
  onWebSocketInit: (key: string) => void;
  onWebSocketClose: () => void;
}   

export function VoiceSettings({ onWebSocketInit, onWebSocketClose }: VoiceSettingsProps) {
  const [apiKey, setApiKey] = useState("");
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [sendWithoutConfirm, setSendWithoutConfirm] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem(STORAGE_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    
    if (savedKey) {
      setApiKey(savedKey);
      setIsApiKeySet(true);
      onWebSocketInit(savedKey);
    }

    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setSendWithoutConfirm(settings.sendWithoutConfirm || false);
    }
  }, [onWebSocketInit]);

  const handleSetApiKey = () => {
    if (apiKey.trim().startsWith('sk-')) {
      localStorage.setItem(STORAGE_KEY, apiKey);
      setIsApiKeySet(true);
      onWebSocketInit(apiKey);
    }
  };

  const handleChangeKey = () => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey("");
    setIsApiKeySet(false);
    onWebSocketClose();
  };

  const handleToggleSendWithoutConfirm = () => {
    const newValue = !sendWithoutConfirm;
    setSendWithoutConfirm(newValue);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
      sendWithoutConfirm: newValue
    }));
  };

  return (
    <SettingsPanel
      apiKey={apiKey}
      isApiKeySet={isApiKeySet}
      sendWithoutConfirm={sendWithoutConfirm}
      onApiKeyChange={setApiKey}
      onSetApiKey={handleSetApiKey}
      onChangeKey={handleChangeKey}
      onToggleSendWithoutConfirm={handleToggleSendWithoutConfirm}
    />
  );
} 