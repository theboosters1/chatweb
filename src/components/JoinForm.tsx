import React, { useState } from 'react';
import { Shield, Users, Key, LogIn, Plus, Hash } from 'lucide-react';
import { motion } from 'motion/react';

interface JoinFormProps {
  onJoin: (roomId: string, password: string, userName: string) => void;
}

export default function JoinForm({ onJoin }: JoinFormProps) {
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId && password && userName) {
      onJoin(roomId, password, userName);
    }
  };

  const generateRandomRoom = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomId(result);
    setIsCreating(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#020408] text-slate-300 overflow-hidden relative select-none">
      {/* Background blur spots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-cyan-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 glass-panel rounded-[2rem] z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 shadow-inner">
            <Shield className="w-10 h-10 text-cyan-400/80" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter text-white">Cryptoverse</h1>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-[0.2em] mt-2">End-to-end Encrypted Node</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 ml-1">
              Participant Identity
            </label>
            <div className="relative group">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-cyan-500 transition-colors" />
              <input
                type="text"
                placeholder="Agent_Smith"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full pl-11 pr-4 py-4 glass-input rounded-xl text-slate-200 placeholder:text-slate-700 text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 ml-1">
              Secure Channel ID
            </label>
            <div className="relative group">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-cyan-500 transition-colors" />
              <input
                type="text"
                placeholder="NODE-X91A"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full pl-11 pr-4 py-4 glass-input rounded-xl text-cyan-400 placeholder:text-slate-700 uppercase font-mono text-sm tracking-widest"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 ml-1">
              Handshake Secret
            </label>
            <div className="relative group">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-cyan-500 transition-colors" />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-4 glass-input rounded-xl text-slate-200 placeholder:text-slate-700 text-sm"
                required
              />
            </div>
            <p className="text-[9px] text-slate-600 mt-3 px-1 leading-relaxed italic">
              Encrypted locally. Never transmitted. Use the same secret as your peers.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] active:scale-[0.98] uppercase tracking-widest text-xs"
            >
              <LogIn className="w-4 h-4" />
              Initiate Handshake
            </button>
            <button
              type="button"
              onClick={generateRandomRoom}
              className="w-full py-4 bg-white/5 text-slate-400 font-bold rounded-xl flex items-center justify-center gap-2 border border-white/5 hover:bg-white/10 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
            >
              <Plus className="w-4 h-4" />
              Generate New Node
            </button>
          </div>
        </form>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Memory Only Mode</span>
          </div>
          <p className="text-[9px] text-center text-slate-600 px-8 leading-relaxed">
            All data exists temporarily and vanishes upon disconnect.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
