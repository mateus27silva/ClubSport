import React from 'react';
import { X, ShieldCheck, Database, Server, Cloud, Lock, Bell, Wifi, Key, FileCode } from 'lucide-react';

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
            <Database className="w-5 h-5 text-orange-500" />
            <h2 className="text-base font-bold text-white">
              Plano de Estruturação Firebase & Guia Passo a Passo
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Detailed Portuguese Instructions */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed">
          {/* Status Badge */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-5 h-5" />
              <span>Firebase Provisionado com Sucesso! (Project ID: cybernetic-evening-d5w43)</span>
            </div>
          </div>

          {/* Step 1: Coleções & Firestore Schema */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Passo 1: Definição de Coleções & Autenticação
            </h3>
            <p className="text-zinc-300">
              O modelo Firestore foi configurado com esquema tipado via <code className="text-orange-300">firebase-blueprint.json</code>:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li><strong className="text-zinc-200">users:</strong> uid, fullName, username, role ('user' | 'influencer' | 'admin'), points, totalKm, activeDays.</li>
              <li><strong className="text-zinc-200">activities:</strong> id, userId, sport, distanceKm, timeMinutes, pace, calories, mapRouteSvg, likesCount.</li>
              <li><strong className="text-zinc-200">challenges:</strong> id, title, type, scope ('global' | 'local'), targetValue, currentValue, endsIn.</li>
              <li><strong className="text-zinc-200">communities & messages:</strong> grupos esportivos, tópicos, reagentes com 🔥 e mídias.</li>
              <li><strong className="text-zinc-200">audit_logs:</strong> registros imutáveis de segurança e acessos de administradores.</li>
            </ul>
          </section>

          {/* Step 2: Regras de Segurança */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Passo 2: Regras de Segurança Robustas (firestore.rules)
            </h3>
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 font-mono text-[10px] text-zinc-300 space-y-1">
              <p className="text-orange-400">// Regras de Firestore implantadas no projeto:</p>
              <p>allow read: if true; // Feed e rankings públicos</p>
              <p>allow create: if isAuthenticated() && request.auth.uid == request.resource.data.userId;</p>
              <p>allow delete: if isAdmin(); // Apenas administradores auditados</p>
            </div>
          </section>

          {/* Step 3: Hosting & Cloud Functions */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              Passo 3: Cloud Functions & Hosting
            </h3>
            <p className="text-zinc-300">
              Para deploy de backend e notificações automáticas:
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-zinc-400">
              <li>Executar <code className="text-orange-300">firebase init functions</code> para triggers de ranking em tempo real.</li>
              <li>Executar <code className="text-orange-300">npm run build</code> e publicar com <code className="text-orange-300">firebase deploy --only hosting</code>.</li>
            </ol>
          </section>

          {/* Step 4: Redes Sociais & Biometria */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Passo 4: Autenticação por Redes Sociais, Tokens e Biometria
            </h3>
            <p className="text-zinc-300">
              Integrado com OAuth (Google, GitHub) e suporte a Passkeys biométricas (Fingerprint/FaceID) com geração de token seguro bearer.
            </p>
          </section>

          {/* Step 5: Modo Offline & Sincronização IndexedDB */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              Passo 5: Modo Offline de Sincronização Local
            </h3>
            <p className="text-zinc-300">
              O SDK do Firestore utiliza <code className="text-orange-300">enableIndexedDbPersistence</code> para cache local. Quando o usuário está sem internet, ações são adicionadas à fila de pendências e sincronizadas assim que a conexão restabelece.
            </p>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold rounded-xl text-xs uppercase"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
