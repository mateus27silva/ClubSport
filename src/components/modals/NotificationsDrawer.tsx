import React from 'react';
import { X, Bell, CheckCircle, Flame, Trophy, Radio } from 'lucide-react';
import { NotificationItem } from '../../types';

interface NotificationsDrawerProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onSendSimulatedPush: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  notifications,
  onClose,
  onMarkAllRead,
  onSendSimulatedPush
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end">
      <div className="bg-zinc-900 border-l border-zinc-800 w-full max-w-md h-full flex flex-col text-white shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-orange-500" />
            <h2 className="text-base font-bold">Painel de Notificações</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="p-3 bg-zinc-950/70 border-b border-zinc-800 flex items-center justify-between text-xs">
          <button
            onClick={onSendSimulatedPush}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/40 rounded-xl font-bold hover:bg-orange-500/30"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Testar Push Notification</span>
          </button>

          <button
            onClick={onMarkAllRead}
            className="text-zinc-400 hover:text-white underline font-medium"
          >
            Marcar todas como lidas
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              Nenhuma notificação recente.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  !n.read
                    ? 'bg-zinc-850 border-orange-500/40 shadow-md shadow-orange-500/5'
                    : 'bg-zinc-950 border-zinc-800 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {n.type === 'challenge' ? (
                      <Trophy className="w-4 h-4 text-orange-500" />
                    ) : n.type === 'like' ? (
                      <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                    ) : (
                      <Bell className="w-4 h-4 text-amber-400" />
                    )}
                    <h3 className="text-xs font-bold text-white">{n.title}</h3>
                  </div>

                  <span className="text-[9px] text-zinc-500 font-mono">{n.createdAt}</span>
                </div>

                <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
