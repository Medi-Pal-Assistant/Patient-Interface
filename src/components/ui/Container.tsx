import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function Container({ children, className = '' }: ContainerProps) {
  return (
    <main className="min-h-[calc(100vh-4rem)] mt-16 overflow-hidden bg-gradient-to-b from-primary-50 to-white">
      <div className="h-full container mx-auto px-4 py-2">
        <div className={`min-h-[calc(100vh-4rem-1rem)] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-w-chat mx-auto w-full ${className}`}>
          {children}
        </div>
      </div>
    </main>
  );
} 