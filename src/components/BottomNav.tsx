import React from 'react';
import { Home, Crown, Plus, Search, User } from 'lucide-react';

export type ActiveTab = 'home' | 'search' | 'plus' | 'challenges' | 'profile';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onQuickPlusClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onQuickPlusClick
}) => {
  return (
    <nav id="bottom-navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-800/80 px-6 py-2.5 backdrop-blur-lg flex items-center justify-between text-zinc-400 max-w-lg mx-auto sm:max-w-xl md:max-w-2xl">
      <button
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center space-y-1 transition-colors ${
          activeTab === 'home' ? 'text-orange-500 font-bold scale-105' : 'hover:text-zinc-200'
        }`}
      >
        <Home className="w-6 h-6" />
        <span className="text-[10px]">Home</span>
      </button>

      <button
        onClick={() => setActiveTab('search')}
        className={`flex flex-col items-center space-y-1 transition-colors ${
          activeTab === 'search' ? 'text-orange-500 font-bold scale-105' : 'hover:text-zinc-200'
        }`}
      >
        <Crown className="w-6 h-6" />
        <span className="text-[10px]">Leaderboard</span>
      </button>

      {/* Center + Action Button */}
      <button
        onClick={onQuickPlusClick}
        className="w-12 h-12 bg-orange-500 hover:bg-orange-600 text-zinc-950 rounded-2xl flex items-center justify-center font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition-transform -mt-5 border-4 border-zinc-950"
        title="Publicar Atividade ou Criar Comunidade"
      >
        <Plus className="w-7 h-7 stroke-[3]" />
      </button>

      <button
        onClick={() => setActiveTab('challenges')}
        className={`flex flex-col items-center space-y-1 transition-colors ${
          activeTab === 'challenges' ? 'text-orange-500 font-bold scale-105' : 'hover:text-zinc-200'
        }`}
      >
        <Search className="w-6 h-6" />
        <span className="text-[10px]">Search</span>
      </button>

      <button
        onClick={() => setActiveTab('profile')}
        className={`flex flex-col items-center space-y-1 transition-colors ${
          activeTab === 'profile' ? 'text-orange-500 font-bold scale-105' : 'hover:text-zinc-200'
        }`}
      >
        <User className="w-6 h-6" />
        <span className="text-[10px]">Profile</span>
      </button>
    </nav>
  );
};
