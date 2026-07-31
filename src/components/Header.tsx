import React from 'react';
import { Bell, Sun, Moon, FileText, UserCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenFirebasePlan: () => void;
  onOpenAuth: () => void;
  unreadCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenFirebasePlan,
  onOpenAuth,
  unreadCount
}) => {
  const { theme, setTheme, isDark } = useTheme();
  const { user } = useAuth();

  return (
    <header id="header-root" className="sticky top-0 z-40 bg-zinc-950/90 dark:bg-zinc-950/90 light:bg-white/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 text-white flex items-center justify-between transition-colors">
      <div className="flex items-center space-x-3">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-1 font-sans">
          <span className="text-orange-500">Club</span>
          <span className="text-white">Sport</span>
        </h1>
      </div>

      <div className="flex items-center space-x-2">
        {/* Firebase Architecture & Step-by-Step Plan Button */}
        <button
          onClick={onOpenFirebasePlan}
          className="flex items-center space-x-1 bg-zinc-800 hover:bg-zinc-700 text-xs text-orange-400 px-2.5 py-1.5 rounded-lg border border-orange-500/30 transition-colors"
          title="Plano de Execução Firebase & Infraestrutura"
        >
          <FileText className="w-3.5 h-3.5 text-orange-400" />
          <span className="hidden sm:inline font-semibold">Firebase Plan</span>
        </button>

        {/* Theme Toggle Button (Dark / Light / System) */}
        <button
          onClick={() => {
            if (theme === 'dark') setTheme('light');
            else if (theme === 'light') setTheme('system');
            else setTheme('dark');
          }}
          className="p-2 rounded-lg bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300 transition-colors"
          title={`Tema Atual: ${theme}`}
        >
          {isDark ? <Moon className="w-4 h-4 text-orange-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
        </button>

        {/* Notifications Bell Button */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg bg-zinc-800/70 hover:bg-zinc-800 text-zinc-200 transition-colors"
          title="Notificações em tempo real"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-zinc-950 font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Auth Avatar / Login trigger */}
        <button
          onClick={onOpenAuth}
          className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-orange-500 overflow-hidden bg-zinc-800"
          title={user ? `${user.fullName} (${user.role})` : 'Entrar / Cadastrar'}
        >
          {user ? (
            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
          ) : (
            <UserCheck className="w-4 h-4 text-orange-400" />
          )}
        </button>
      </div>
    </header>
  );
};
