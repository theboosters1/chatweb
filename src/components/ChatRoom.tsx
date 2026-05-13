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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    socketRef.current = io();

    const socket = socketRef.current;

    socket.on('connect', () => {
      socket.emit('join-room', { roomId, userName });
    });

    socket.on('receive-message', ({ senderId, senderName, encryptedData, timestamp }) => {
      const decryptedText = decryptMessage(encryptedData, passwordKey);
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        senderId,
        senderName,
        text: decryptedText,
        timestamp
      }]);
    });

    socket.on('user-joined', ({ userId, userName, timestamp }) => {
      setUsers(prev => [...prev, { userId, userName }]);
      setMessages(prev => [...prev, {
        id: 'system-' + timestamp,
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
        id: 'system-' + timestamp,
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
      socket.disconnect();
    };
  }, [roomId, userName, passwordKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;

    const encrypted = encryptMessage(input, passwordKey);
    socketRef.current.emit('send-message', { roomId, encryptedData: encrypted });
    setInput('');
    
    // Stop typing immediately
    socketRef.current.emit('typing', { roomId, isTyping: false });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current?.emit('typing', { roomId, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit('typing', { roomId, isTyping: false });
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-[#020408] text-slate-300 selection:bg-cyan-500/30 overflow-hidden font-sans relative">
      {/* Background blur spots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Sidebar */}
      <div className="w-72 border-r border-white/5 bg-white/5 backdrop-blur-xl flex flex-col z-20 hidden md:flex">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
            <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">Encrypted Node</span>
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Cryptoverse</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="mb-6">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-4 font-bold px-2">Active Peers ({users.length})</h3>
            <ul className="space-y-3">
              {users.map(u => (
                <li key={u.userId} className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${
                  u.userId === socketRef.current?.id 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-transparent border-transparent'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg ${
                    u.userId === socketRef.current?.id 
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600' 
                      : 'bg-slate-800'
                  }`}>
                    {u.userName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${u.userId === socketRef.current?.id ? 'text-white' : 'text-slate-400'}`}>
                      {u.userName} {u.userId === socketRef.current?.id && '(You)'}
                    </div>
                    {u.userId === socketRef.current?.id && (
                      <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-tighter">Verified Session</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-6 bg-black/20 mt-auto border-t border-white/5">
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 mb-4">
            <p className="text-[10px] text-red-400/80 leading-relaxed uppercase tracking-wide font-bold">
              Memory Only Mode
            </p>
            <p className="text-[9px] text-red-400/60 mt-1">
              Messages will self-destruct upon disconnect or server reset.
            </p>
          </div>
          <button 
            onClick={onExit}
            className="w-full py-3 px-4 bg-red-600/10 border border-red-500/20 text-red-500 text-[10px] font-bold rounded-lg hover:bg-red-600/20 transition-all uppercase tracking-widest active:scale-95"
          >
            TERMINATE SESSION
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col z-10 relative">
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
              NODE_ID: <span className="text-cyan-400">{roomId}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Latency</span>
              <span className="text-xs font-mono text-emerald-400">12ms</span>
            </div>
            <button onClick={onExit} className="md:hidden p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6 flex flex-col" ref={scrollRef}>
          {messages.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-10">
                <Shield className="w-16 h-16" />
                <p className="text-[10px] tracking-[0.5em] font-bold uppercase">Awaiting encrypted burst</p>
             </div>
          )}
          <div className="mt-auto" /> {/* Push messages to bottom if few */}
          <AnimatePresence>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${m.senderId === socketRef.current?.id ? 'justify-end' : 'justify-start'} w-full`}
              >
                {m.isSystem ? (
                  <div className="w-full text-center py-6">
                    <span className="px-4 py-1.5 rounded-full bg-slate-900/50 border border-white/5 text-[9px] text-slate-500 uppercase tracking-[0.3em] font-bold">
                       {m.text}
                    </span>
                  </div>
                ) : (
                  <div className={`max-w-[75%] space-y-1.5 ${m.senderId === socketRef.current?.id ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                    <div className={`flex items-center gap-2 mb-0.5 ${m.senderId === socketRef.current?.id ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-tighter ${m.senderId === socketRef.current?.id ? 'text-cyan-400' : 'text-slate-500'}`}>
                        {m.senderId === socketRef.current?.id ? 'You' : m.senderName}
                      </span>
                      <span className="text-[9px] text-slate-600 font-mono">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div 
                      className={`p-4 rounded-2xl text-sm leading-relaxed shadow-xl border ${
                        m.senderId === socketRef.current?.id
                          ? 'bg-indigo-600/20 border-indigo-500/30 text-slate-100 rounded-tr-none shadow-indigo-500/5'
                          : 'bg-slate-900 border-white/5 text-slate-300 rounded-tl-none shadow-black/40'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          <AnimatePresence>
            {typingUsers.size > 0 && Array.from(typingUsers).map(u => (
              <motion.div
                key={`typing-${u}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 px-2"
              >
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" />
                  <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse delay-75" />
                  <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse delay-150" />
                </div>
                <span className="text-[11px] text-slate-500 italic font-medium">{u} is typing...</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input */}
        <footer className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-xl">
          <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex items-center">
            <div className="absolute left-4 text-cyan-600">
               <Lock className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Type an encrypted message..."
              value={input}
              onChange={handleTyping}
              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-12 pr-24 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700 shadow-inner"
            />
            <div className="absolute right-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-4 h-8 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)] disabled:opacity-30 disabled:grayscale uppercase tracking-widest active:scale-95"
              >
                SEND
              </button>
            </div>
          </form>
          <div className="mt-4 flex items-center justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <span className="text-[9px] text-slate-400 font-mono uppercase tracking-[0.2em] font-bold">No Persistance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <span className="text-[9px] text-slate-400 font-mono uppercase tracking-[0.2em] font-bold">End-to-End</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <span className="text-[9px] text-slate-400 font-mono uppercase tracking-[0.2em] font-bold">Anonymous</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
