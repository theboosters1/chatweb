import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Hash, MessageSquare, Shield, Users, LogOut, Circle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { encryptMessage, decryptMessage } from '../lib/crypto';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

interface User {
  userId: string;
  userName: string;
}

interface ChatRoomProps {
  roomId: string;
  passwordKey: string;
  userName: string;
  onExit: () => void;
}

export default function ChatRoom({ roomId, passwordKey, userName, onExit }: ChatRoomProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Connect to the server - passing no arguments allows it to automatically detect the origin
    socketRef.current = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to server with ID:', socket.id);
      setIsConnected(true);
      socket.emit('join-room', { roomId, userName });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('receive-message', ({ senderId, senderName, encryptedData, timestamp }) => {
      try {
        const decryptedText = decryptMessage(encryptedData, passwordKey);
        setMessages(prev => [...prev, {
          id: `${senderId}-${timestamp}-${Math.random().toString(36).substr(2, 5)}`,
          senderId,
          senderName,
          text: decryptedText,
          timestamp
        }]);
      } catch (err) {
        console.error('Failed to process message:', err);
      }
    });

    socket.on('user-joined', ({ userId, userName, timestamp }) => {
      setUsers(prev => {
        if (prev.find(u => u.userId === userId)) return prev;
        return [...prev, { userId, userName }];
      });
      setMessages(prev => [...prev, {
        id: `system-${timestamp}`,
        senderId: 'system',
        senderName: 'System',
        text: `${userName} joined the shadows`,
        timestamp,
        isSystem: true
      }]);
    });

    socket.on('user-left', ({ userId, userName, timestamp }) => {
      setUsers(prev => prev.filter(u => u.userId !== userId));
      setMessages(prev => [...prev, {
        id: `system-${timestamp}`,
        senderId: 'system',
        senderName: 'System',
        text: `${userName} vanished`,
        timestamp,
        isSystem: true
      }]);
    });

    socket.on('room-data', ({ users }) => {
      setUsers(users);
    });

    socket.on('user-typing', ({ userId, userName, isTyping }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        if (isTyping) next.add(userName);
        else next.delete(userName);
        return next;
      });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('receive-message');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('room-data');
      socket.off('user-typing');
      socket.disconnect();
    };
  }, [roomId, userName, passwordKey]);

  // Reliable scrolling
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !socketRef.current || !isConnected) {
      console.warn('Cannot send:', { hasInput: !!input.trim(), hasSocket: !!socketRef.current, isConnected });
      return;
    }

    try {
      const text = input.trim();
      const encrypted = encryptMessage(text, passwordKey);
      
      console.log('Emitting message to server...');
      socketRef.current.emit('send-message', { roomId, encryptedData: encrypted });
      
      setInput('');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setIsTyping(false);
      socketRef.current.emit('typing', { roomId, isTyping: false });
    } catch (err) {
      console.error('Error in handleSend:', err);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    
    if (!isConnected || !socketRef.current) return;

    if (!isTyping && val.trim().length > 0) {
      setIsTyping(true);
      socketRef.current.emit('typing', { roomId, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit('typing', { roomId, isTyping: false });
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-[#0a0c10] text-slate-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 bg-[#0f1218] border-r border-white/5 flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Shield className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider text-white uppercase">Cryptoverse</h1>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Secure Node</p>
            </div>
          </div>
          
          <div className="space-y-3">
             <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[9px] uppercase tracking-widest text-slate-500 block mb-1 font-bold">Room ID</span>
                <span className="text-xs font-mono text-indigo-400 flex items-center gap-2">
                   <Hash className="w-3 h-3" /> {roomId}
                </span>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          <div>
            <div className="px-2 mb-4 flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                <Users className="w-3 h-3" /> Online ({users.length})
              </span>
            </div>
            <div className="space-y-1">
              {users.map((u) => (
                <div key={u.userId} className="flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:bg-white/5 transition-colors group">
                  <div className="relative">
                    <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:text-indigo-400 transition-colors">
                      {u.userName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0f1218] rounded-full" />
                  </div>
                  <span className="text-xs font-medium text-slate-300 truncate">{u.userName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5">
           <button 
             onClick={onExit}
             className="w-full flex items-center justify-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 hover:bg-red-500/10 transition-all text-[11px] font-bold uppercase tracking-widest"
           >
             <LogOut className="w-4 h-4" /> Terminate Session
           </button>
        </div>
      </aside>

      {/* Main Chat */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0a0c10]">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0c10]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <div className="lg:hidden w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-tight">Encrypted Channel</span>
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
              </div>
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                {isConnected ? 'Signal Synchronized' : 'Acquiring Signal...'}
              </span>
            </div>
          </div>
          <button onClick={onExit} className="lg:hidden p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Chat Body */}
        <div 
          className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar flex flex-col" 
          ref={scrollRef}
        >
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-slate-800 pointer-events-none">
              <Lock className="w-12 h-12 opacity-20" />
              <p className="text-[10px] tracking-[0.4em] font-bold uppercase opacity-20">Awaiting secure handshake</p>
            </div>
          ) : (
            <div className="space-y-6 mt-auto">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.senderId === socketRef.current?.id ? 'justify-end' : 'justify-start'} w-full items-end gap-2 group`}
                >
                  {m.senderId === 'system' ? (
                    <div className="w-full flex justify-center py-4">
                      <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[9px] text-slate-600 uppercase tracking-widest font-black">
                        {m.text}
                      </span>
                    </div>
                  ) : (
                    <div className={`flex flex-col ${m.senderId === socketRef.current?.id ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%]`}>
                      <div className="flex items-center gap-2 px-1 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-tight ${m.senderId === socketRef.current?.id ? 'text-indigo-400' : 'text-slate-500'}`}>
                          {m.senderId === socketRef.current?.id ? 'You' : m.senderName}
                        </span>
                        <span className="text-[9px] text-slate-700 font-mono">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div 
                        className={`p-3.5 rounded-2xl text-[14px] leading-relaxed shadow-lg border break-words min-w-[40px] ${
                          m.senderId === socketRef.current?.id
                            ? 'bg-indigo-600/20 border-indigo-500/20 text-white rounded-br-none'
                            : 'bg-slate-900 border-white/5 text-slate-200 rounded-bl-none'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {typingUsers.size > 0 && Array.from(typingUsers).map(u => (
                <div key={`typing-${u}`} className="flex items-center gap-2 px-2 py-1 opacity-50">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{u} is typing</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 sm:p-6 bg-[#0f1218]/80 backdrop-blur-xl border-t border-white/5">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={isConnected ? "Message channel..." : "Connecting to network..."}
                value={input}
                onChange={handleTyping}
                disabled={!isConnected}
                autoComplete="off"
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-20"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || !isConnected}
              className="px-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 disabled:grayscale transition-all text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline text-xs uppercase tracking-widest">Transmit</span>
            </button>
          </form>
          <div className="mt-3 flex justify-center items-center gap-4 text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em] pointer-events-none">
            <span>AES-256 E2EE Enabled</span>
            <div className="w-1 h-1 bg-slate-700 rounded-full" />
            <span>Server Decryption Disabled</span>
          </div>
        </div>
      </main>
    </div>
  );
}
