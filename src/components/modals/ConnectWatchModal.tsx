import React, { useState } from 'react';
import { X, Watch, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ConnectWatchModalProps {
  onClose: () => void;
}

export const ConnectWatchModal: React.FC<ConnectWatchModalProps> = ({ onClose }) => {
  const [connectedApps, setConnectedApps] = useState<string[]>(['Garmin Connect']);

  const apps = [
    { name: 'Garmin Connect', icon: '⌚', color: 'text-blue-400' },
    { name: 'Strava Sync', icon: '🚴', color: 'text-orange-500' },
    { name: 'Apple Health / Watch', icon: '🍏', color: 'text-rose-400' },
    { name: 'Polar Flow', icon: '🏃', color: 'text-red-400' },
    { name: 'Suunto App', icon: '⛰️', color: 'text-cyan-400' },
  ];

  const toggleConnect = (name: string) => {
    setConnectedApps((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 text-zinc-900 dark:text-white space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Watch className="w-6 h-6 text-orange-500" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Conectar Dispositivos & Relógios</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Sincronize automaticamente seus treinos, GPS, ritmo cardíaco e calorias queimadas com a rede ClubSport.
        </p>

        <div className="space-y-3">
          {apps.map((appItem) => {
            const isConnected = connectedApps.includes(appItem.name);

            return (
              <div
                key={appItem.name}
                className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{appItem.icon}</span>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white">{appItem.name}</h3>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-500">
                      {isConnected ? 'Sincronizado via Firebase SDK' : 'Não conectado'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => toggleConnect(appItem.name)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                    isConnected
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-orange-500 hover:bg-orange-600 text-zinc-950 shadow-md'
                  }`}
                >
                  {isConnected ? 'Conectado ✓' : 'Conectar'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
