interface ChatHeaderProps {
  title: string;
  subtitle: string;
  avatarText: string;
  settings?: React.ReactNode;
}

export function ChatHeader({ title, subtitle, avatarText, settings }: ChatHeaderProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-600 font-semibold">{avatarText}</span>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
      </div>
      {settings}
    </div>
  );
} 