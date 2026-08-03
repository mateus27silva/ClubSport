import React from 'react';
import { X, ShieldCheck, Database, Lock, Server } from 'lucide-react';

interface FirebaseSetupGuideModalProps {
  onClose: () => void;
}

export const FirebaseSetupGuideModal: React.FC<FirebaseSetupGuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-white">
              Arquitetura Supabase Cloud & Banco de Dados Relacional PostgreSQL
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed">
          {/* Status Badge */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-5 h-5" />
              <span>Conexão Supabase Pronta para Produção & Vercel Deploy</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
              PostgreSQL Real-time
            </span>
          </div>

          {/* Step 1: Tabelas & Supabase Schema */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Tabelas Criadas & Mapeamento PostgreSQL
            </h3>
            <p className="text-zinc-300">
              O banco de dados PostgreSQL foi estruturado para suportar tempo real e autenticação RLS:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li><strong className="text-zinc-200">profiles:</strong> id (UUID, FK auth.users), full_name, username, email, bio, primary_sport, total_km, points, role.</li>
              <li><strong className="text-zinc-200">activities:</strong> id (UUID), user_id, user_name, user_avatar, title, sport, distance_km, time_minutes, pace, calories, image_url.</li>
              <li><strong className="text-zinc-200">challenges:</strong> id (UUID), title, description, category, target_value, current_value, participants_count.</li>
              <li><strong className="text-zinc-200">communities:</strong> id (UUID), name, description, location, sport_category, members_count.</li>
              <li><strong className="text-zinc-200">community_messages:</strong> id (UUID), community_id, user_id, user_name, text, flame_count.</li>
            </ul>
          </section>

          {/* Step 2: RLS Policies */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Políticas de Segurança Row Level Security (RLS)
            </h3>
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 font-mono text-[10px] text-zinc-300 space-y-1">
              <p className="text-emerald-400">// Políticas ativas no Supabase:</p>
              <p>- Leitura Pública permitida para feed de atividades e comunidades.</p>
              <p>- Inserção/Atualização restrita para usuários autenticados (auth.uid() = user_id).</p>
              <p>- Real-time habilitado na publicação de mensagens e atividades.</p>
            </div>
          </section>

          {/* Step 3: Vercel Deploy Ready */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Server className="w-4 h-4" />
              Variáveis para Deploy na Vercel
            </h3>
            <p className="text-zinc-300">
              Ao realizar a publicação na Vercel, configure as seguintes variáveis no painel:
            </p>
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 font-mono text-[10px] text-emerald-300 space-y-1">
              <p>VITE_SUPABASE_URL=https://[seu-projeto].supabase.co</p>
              <p>VITE_SUPABASE_ANON_KEY=[sua-chave-anon-publica]</p>
            </div>
          </section>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
