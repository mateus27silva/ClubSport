import React from 'react';
import { Bell, Sun, Moon, FileText, UserCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  unreadCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenAuth,
  unreadCount
}) => {
  const { theme, setTheme, isDark } = useTheme();
  const { user } = useAuth();

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('system');
    } else {
      setTheme('dark');
    }
  };

  return (
    <header id="header-root" className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 px-4 py-3 text-zinc-900 dark:text-white flex items-center justify-between transition-colors duration-200">
      <div className="flex items-center space-x-3">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-1 font-sans">
          <span className="text-orange-500">Club</span>
          <span className="text-zinc-900 dark:text-white">Sport</span>
        </h1>
      </div>

      <div className="flex items-center space-x-2">
        {/* Theme Toggle Button (Dark / Light / System) */}
        <button
          onClick={toggleTheme}
          className="flex items-center space-x-1.5 p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-all border border-zinc-300/60 dark:border-zinc-700/50"
          title={`Modo de Exibição: ${theme === 'dark' ? 'Escuro (Dark)' : theme === 'light' ? 'Claro (Light)' : 'Sistema (Auto)'}`}
        >
          {isDark ? (
            <Moon className="w-4 h-4 text-orange-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
          <span className="text-xs font-semibold capitalize hidden xs:inline text-zinc-700 dark:text-zinc-200">
            {theme === 'dark' ? 'Escuro' : theme === 'light' ? 'Claro' : 'Auto'}
          </span>
        </button>

        {/* Notifications Bell Button */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-all border border-zinc-300/60 dark:border-zinc-700/50"
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
          className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-orange-500 overflow-hidden bg-zinc-100 dark:bg-zinc-800"
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
