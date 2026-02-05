import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Book, Atom, Rocket } from 'lucide-react';
import { spaceApi } from '../services/api';
import toast from 'react-hot-toast';

const MODES = [
  { value: 'quick', label: 'Quick', icon: Sparkles, description: '5-8 lines, practical' },
  { value: 'eli10', label: 'ELI10', icon: Book, description: 'Simple & fun' },
  { value: 'stem', label: 'STEM', icon: Atom, description: 'Technical details' },
  { value: 'scifi', label: 'Sci-Fi', icon: Rocket, description: 'Narrative style' },
];

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('quick');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await spaceApi.query(input, null, true, mode);
      const assistantMessage = { role: 'assistant', content: response.response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get response');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-display font-bold text-white mb-2">Chat with Space Agent</h1>
          <p className="text-slate-400">Ask about space weather, satellites, and celestial phenomena</p>
        </motion.div>

        {/* Mode Selector */}
        <div className="mb-6 flex flex-wrap gap-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  mode === m.value
                    ? 'bg-space-600/30 text-white border border-space-500/50'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-space-500/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Chat Messages */}
        <div className="mb-6 min-h-[400px] max-h-[600px] overflow-y-auto space-y-4 p-6 rounded-2xl bg-slate-800/30 border border-slate-700">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-space-400 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">Start a conversation!</p>
              <p className="text-sm text-slate-500">Try asking: "What's the Kp index?" or "When can I see the ISS?"</p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-space-600/30 text-white border border-space-500/30'
                        : 'bg-slate-700/50 text-white border border-slate-600'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-slate-700/50 text-white border border-slate-600 p-4 rounded-2xl">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-space-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-space-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-space-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about space weather, satellites, or anything celestial..."
            className="flex-1 px-6 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-space-500 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-6 py-4 bg-gradient-to-r from-space-600 to-aurora-600 text-white rounded-2xl font-medium hover:from-space-500 hover:to-aurora-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
