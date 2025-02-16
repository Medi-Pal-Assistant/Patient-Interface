'use client';

import { useState } from 'react';
import { IoSettings } from "react-icons/io5";
import clsx from 'clsx';

interface SettingsPanelProps {
  apiKey: string;
  isApiKeySet: boolean;
  sendWithoutConfirm: boolean;
  onApiKeyChange: (key: string) => void;
  onSetApiKey: () => void;
  onChangeKey: () => void;
  onToggleSendWithoutConfirm: () => void;
}

export function SettingsPanel({
  apiKey,
  isApiKeySet,
  sendWithoutConfirm,
  onApiKeyChange,
  onSetApiKey,
  onChangeKey,
  onToggleSendWithoutConfirm,
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200">
      <div className="px-4 py-2 flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "p-2 rounded-lg transition-colors",
            isOpen ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
          )}
          aria-label="Settings"
        >
          <IoSettings className="w-5 h-5" />
        </button>
      </div>

      <div
        className={clsx(
          "transition-all duration-200 ease-in-out overflow-hidden bg-gray-50",
          isOpen ? "max-h-96" : "max-h-0"
        )}
      >
        <div className="p-4 space-y-4">
          {!isApiKeySet ? (
            <div className="space-y-2">
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                OpenAI API Key
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={onSetApiKey}
                disabled={!apiKey.startsWith('sk-')}
                className={clsx(
                  "mt-2 px-4 py-2 rounded-md text-white transition-colors",
                  apiKey.startsWith('sk-')
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-gray-400 cursor-not-allowed"
                )}
              >
                Set API Key
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                API Key Status
              </label>
              <button
                type="button"
                onClick={onChangeKey}
                className="px-4 py-2 text-sm border border-red-500 text-red-500 rounded-md hover:bg-red-50 transition-colors"
              >
                Change API Key
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <label htmlFor="autoExecute" className="text-sm font-medium text-gray-700">
              Auto-execute transactions
            </label>
            <button
              type="button"
              role="switch"
              id="autoExecute"
              onClick={onToggleSendWithoutConfirm}
              className={clsx(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                sendWithoutConfirm ? "bg-blue-500" : "bg-gray-200"
              )}
            >
              <span
                className={clsx(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  sendWithoutConfirm ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 