import Link from 'next/link';
import { IoMic, IoChatbubble } from "react-icons/io5";
import { Container } from '@/components/ui/Container';

export default function Home() {
  return (
    <Container className="!max-w-4xl">
      <div className="p-8 md:p-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to MediPal
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Your AI-powered medical information assistant. Choose your preferred way to interact:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link
              href="/chat"
              className="group relative bg-white rounded-2xl shadow-lg p-8 transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 rounded-full p-4">
                <IoChatbubble className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mt-4 mb-3">
                Text Chat
              </h2>
              <p className="text-gray-600">
                Traditional text-based chat interface for detailed medical information and guidance.
              </p>
            </Link>

            <Link
              href="/voice"
              className="group relative bg-white rounded-2xl shadow-lg p-8 transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 rounded-full p-4">
                <IoMic className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mt-4 mb-3">
                Voice Chat
              </h2>
              <p className="text-gray-600">
                Natural voice interaction for hands-free medical information access.
              </p>
            </Link>
          </div>

          <div className="mt-16">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Features
            </h3>
            <ul className="text-gray-600 space-y-2">
              <li>• General medical information and guidance</li>
              <li>• Medication information and reminders</li>
              <li>• Symptom checking assistance</li>
              <li>• Health and wellness tips</li>
              <li>• Voice-powered medical queries</li>
            </ul>
          </div>
        </div>
      </div>
    </Container>
  );
}
