import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Send, Loader2, BookOpen, Sparkles } from 'lucide-react';
import BottomNav from '../components/BottomNav';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function Research() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Use RAG backend endpoint (configurable via env var, defaults to localhost for dev)
      const apiUrl = import.meta.env.VITE_RAG_BACKEND_URL || 'http://localhost:3001/api/chat';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          role: (profile?.role as 'sale' | 'admin') || 'sale',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 flex flex-col">
      <header className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-lg mx-auto px-4">
          <div className="h-16 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Research Library</h1>
              <p className="text-xs text-emerald-50">AI-powered product knowledge</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Welcome to Research Library
            </h2>
            <p className="text-slate-600 mb-6 max-w-sm">
              Ask me anything about our products, features, specifications, or pricing.
              I'm here to help you find the information you need.
            </p>
            <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
              <button
                onClick={() => setInput('What products do we offer?')}
                className="bg-white border border-slate-200 rounded-lg p-4 text-left hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <div className="text-sm font-medium text-slate-900 mb-1">
                  Product Overview
                </div>
                <div className="text-xs text-slate-500">
                  What products do we offer?
                </div>
              </button>
              <button
                onClick={() => setInput('Tell me about pricing and discounts')}
                className="bg-white border border-slate-200 rounded-lg p-4 text-left hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <div className="text-sm font-medium text-slate-900 mb-1">
                  Pricing Information
                </div>
                <div className="text-xs text-slate-500">
                  Tell me about pricing and discounts
                </div>
              </button>
              <button
                onClick={() => setInput('What are the key features?')}
                className="bg-white border border-slate-200 rounded-lg p-4 text-left hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <div className="text-sm font-medium text-slate-900 mb-1">
                  Key Features
                </div>
                <div className="text-xs text-slate-500">
                  What are the key features?
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white border border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-emerald-100' : 'text-slate-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-3 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about products, features, pricing..."
            className="flex-1 resize-none outline-none text-sm max-h-32 min-h-[40px] px-2 py-2"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
