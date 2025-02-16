'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { IoMic, IoMicOff, IoMedkit, IoSettings, IoChatbubble } from "react-icons/io5";

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link 
              href="/"
              className="flex items-center space-x-2 text-gray-900 hover:text-gray-600 transition-colors"
            >
              <IoMedkit className="w-6 h-6" />
              <span className="font-semibold hidden sm:inline">MediPal</span>
            </Link>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link
              href="/chat"
              className={clsx(
                "px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center space-x-2",
                pathname === '/chat'
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <IoChatbubble className="w-5 h-5" />
              <span className="hidden sm:inline">Text Chat</span>
            </Link>
            <Link
              href="/voice"
              className={clsx(
                "px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center space-x-2",
                pathname === '/voice'
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <IoMic className="w-5 h-5" />
              <span className="hidden sm:inline">Voice Chat</span>
            </Link>
            <Link
              href="/settings"
              className={clsx(
                "px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center space-x-2",
                pathname === '/settings'
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <IoSettings className="w-5 h-5" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 