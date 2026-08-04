import React, { useState, useRef, useEffect } from 'react';
import { Bell, Sun, Moon, Settings, User, LogOut, UserCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onOpenSettings?: () => void;
  onOpenEditProfile?: () => void;
  unreadCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenAuth,
  onOpenSettings,
  onOpenEditProfile,
  unreadCount
}) => {
  const { theme, setTheme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('system');
    } else {
      setTheme('dark');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAvatarClick = () => {
    if (!user) {
      onOpenAuth();
    } else {
      setIsProfileMenuOpen((prev) => !prev);
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

        {/* User Auth Avatar / Profile Menu trigger */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={handleAvatarClick}
            className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-orange-500 overflow-hidden bg-zinc-100 dark:bg-zinc-800 transition-transform active:scale-95"
            title={user ? `${user.fullName} (${user.role})` : 'Entrar / Cadastrar'}
          >
            {user ? (
              <img src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              <UserCheck className="w-4 h-4 text-orange-400" />
            )}
          </button>

          {/* Dropdown Menu on Profile Click */}
          {isProfileMenuOpen && user && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 py-2 text-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User summary header */}
              <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/30">
                <p className="font-bold text-zinc-900 dark:text-white truncate">{user.fullName}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.username}</p>
              </div>

              {/* Options */}
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    if (onOpenEditProfile) onOpenEditProfile();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-medium text-xs text-left"
                >
                  <User className="w-4 h-4 text-orange-500" />
                  <span>Editar perfil</span>
                </button>

                {onOpenSettings && (
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-medium text-xs text-left"
                  >
                    <Settings className="w-4 h-4 text-zinc-400" />
                    <span>Configurações do App</span>
                  </button>
                )}

                <div className="my-1 border-t border-zinc-100 dark:border-zinc-800/80" />

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium text-xs text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

