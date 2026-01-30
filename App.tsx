import React, { useState, useEffect, useRef } from 'react';
import { Message, ChatSession } from './types';
import { sendMessageToDominus } from './services/geminiService';
import MessageBubble from './components/MessageBubble';
import InputArea from './components/InputArea';
import { createNewSession, saveSession, getSessions } from './services/memoryService';
import { Plus, Menu, X, Trash2 } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<ChatSession>(createNewSession());
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    const savedSessions = getSessions();
    setSessions(savedSessions);
    
    // Start initial message if new session
    const initSession = createNewSession();
    // Simulate initial DominusAI greeting
    const greeting: Message = {
      id: 'init-greeting',
      role: 'model',
      text: "Sou a DominusAI. Envie a imagem base do site ou descreva o bot que deseja criar.",
      timestamp: Date.now()
    };
    initSession.messages.push(greeting);
    setSession(initSession);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages]);

  const handleSendMessage = async (text: string, imageInput?: { data: string; mimeType: string }) => {
    // 1. Add User Message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      image: imageInput?.data, // Store only data for display if image uploaded
      timestamp: Date.now()
    };

    const updatedMessages = [...session.messages, userMsg];
    const updatedSession = { ...session, messages: updatedMessages };
    setSession(updatedSession);
    setIsLoading(true);

    try {
      // 2. Call API
      const response = await sendMessageToDominus(
        text, 
        updatedMessages, 
        imageInput
      );

      // 3. Add AI Message
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: response.text,
        image: response.image, // Generated Image
        timestamp: Date.now()
      };

      const finalMessages = [...updatedMessages, aiMsg];
      const finalSession = { ...updatedSession, messages: finalMessages };
      
      setSession(finalSession);
      saveSession(finalSession);
      setSessions(getSessions()); // Refresh list

    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: "Erro crítico no sistema. Tente novamente.",
        timestamp: Date.now()
      };
      setSession(prev => ({ ...prev, messages: [...prev.messages, errorMsg] }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    const newSession = createNewSession();
    const greeting: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: "Sou a DominusAI. Envie a imagem base do site ou descreva o bot que deseja criar.",
        timestamp: Date.now()
      };
    newSession.messages.push(greeting);
    setSession(newSession);
    setIsSidebarOpen(false);
  };

  const loadSession = (s: ChatSession) => {
    setSession(s);
    setIsSidebarOpen(false);
  };

  const clearHistory = () => {
    localStorage.clear();
    setSessions([]);
    handleNewChat();
  };

  return (
    <div className="flex h-screen bg-dominus-bg text-dominus-text font-sans overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full z-20 bg-dominus-bg/80 backdrop-blur-md border-b border-dominus-border flex items-center justify-between p-4">
        <span className="font-mono font-bold text-lg tracking-tighter">DOMINUS_AI</span>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-72 bg-dominus-surface border-r border-dominus-border transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-4">
          <div className="mb-8 mt-12 md:mt-0">
             <h1 className="font-mono text-2xl font-bold tracking-tighter text-white mb-1">DOMINUS</h1>
             <p className="text-xs text-dominus-accent font-mono tracking-widest">ARTIFICIAL INTELLIGENCE</p>
          </div>

          <button 
            onClick={handleNewChat}
            className="flex items-center gap-2 w-full p-3 bg-white text-black hover:bg-gray-200 rounded-lg font-semibold transition-colors mb-6"
          >
            <Plus size={18} /> New Protocol
          </button>

          <div className="flex-1 overflow-y-auto pr-2">
            <h3 className="text-xs font-mono text-dominus-dim uppercase mb-3">Memory Logs</h3>
            <div className="space-y-2">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => loadSession(s)}
                  className={`w-full text-left p-3 rounded-lg text-sm truncate transition-colors ${s.id === session.id ? 'bg-[#222] text-white border border-dominus-border' : 'text-dominus-dim hover:bg-[#151515] hover:text-white'}`}
                >
                  {s.messages.length > 1 ? s.messages[1].text.substring(0, 30) + '...' : 'New Session'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-dominus-border">
            <button onClick={clearHistory} className="flex items-center gap-2 text-xs text-red-500 hover:text-red-400 transition-colors">
               <Trash2 size={14} /> Clear Memory Core
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        <div className="flex-1 overflow-y-auto pt-20 md:pt-4 px-4 scroll-smooth">
           <div className="max-w-4xl mx-auto min-h-full flex flex-col">
              {session.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-dominus-accent font-mono text-xs animate-pulse mb-6">
                  <div className="w-2 h-2 bg-dominus-accent rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-dominus-accent rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-dominus-accent rounded-full animate-bounce delay-150"></div>
                  PROCESSING_REQUEST...
                </div>
              )}
              <div ref={messagesEndRef} />
           </div>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 bg-gradient-to-t from-dominus-bg via-dominus-bg to-transparent pt-10">
          <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>

    </div>
  );
};

export default App;