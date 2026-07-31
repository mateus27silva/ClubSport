import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Trophy, ArrowLeft, Check, Sparkles, Calendar, Clock, Upload, Link, Image as ImageIcon } from 'lucide-react';
import { Challenge } from '../../types';

interface CreateChallengeViewProps {
  onCancel: () => void;
  onCreate: (challenge: Challenge) => void;
}

// Helper to get ISO string for datetime-local input
const getDefaultExpirationDate = (daysToAdd = 7) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  date.setHours(23, 59, 0, 0);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

// Helper to calculate countdown string like "07D 00H 00M"
const calculateEndsInString = (isoString: string) => {
  if (!isoString) return '07D 00H 00M';
  const targetTime = new Date(isoString).getTime();
  const now = Date.now();
  const diffMs = targetTime - now;
  if (diffMs <= 0) return 'EXPIRADO';

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(days)}D ${pad(hours)}H ${pad(minutes)}M`;
};

export const CreateChallengeView: React.FC<CreateChallengeViewProps> = ({
  onCancel,
  onCreate
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'distance' | 'sprint' | 'calories'>('distance');
  const [scope, setScope] = useState<'global' | 'local'>('global');
  const [targetValue, setTargetValue] = useState<number>(21);
  const [unit, setUnit] = useState('KM');
  const [expirationDateTime, setExpirationDateTime] = useState(getDefaultExpirationDate(7));
  const [endsIn, setEndsIn] = useState('07D 00H 00M');
  const [bannerUrl, setBannerUrl] = useState(
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80'
  );
  const [isDragging, setIsDragging] = useState(false);
  const [locationName, setLocationName] = useState('Parque do Ibirapuera, SP');
  const [lat, setLat] = useState<number>(-23.5874);
  const [lng, setLng] = useState<number>(-46.6576);
  const [isLocating, setIsLocating] = useState(false);

  // Update calculated endsIn string whenever expirationDateTime changes
  useEffect(() => {
    setEndsIn(calculateEndsInString(expirationDateTime));
  }, [expirationDateTime]);

  // Complete list of sports options
  const presetBanners = [
    { label: 'Corrida 🏃', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80', defaultUnit: 'KM' },
    { label: 'Ciclismo 🚴', url: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=800&q=80', defaultUnit: 'KM' },
    { label: 'Natação 🏊', url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80', defaultUnit: 'KM SWIM' },
    { label: 'Trilha 🥾', url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=800&q=80', defaultUnit: 'KM' },
    { label: 'Caminhada 🚶', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80', defaultUnit: 'KM' },
    { label: 'CrossFit 🏋️', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80', defaultUnit: 'WOD' },
    { label: 'Funcional ⚡', url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80', defaultUnit: 'KCAL' },
    { label: 'Futebol ⚽', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80', defaultUnit: 'PARTIDAS' },
    { label: 'Basquete 🏀', url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80', defaultUnit: 'PONTOS' },
    { label: 'Vôlei 🏐', url: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=800&q=80', defaultUnit: 'SETS' },
    { label: 'Beach Tennis 🎾', url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80', defaultUnit: 'JOGOS' },
    { label: 'Tênis 🎾', url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80', defaultUnit: 'SETS' },
    { label: 'Skate 🛹', url: 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?auto=format&fit=crop&w=800&q=80', defaultUnit: 'SESSÕES' },
    { label: 'Surf 🏄', url: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80', defaultUnit: 'ONDAS' },
    { label: 'Patins 🛼', url: 'https://images.unsplash.com/photo-1565992441121-4367c2967103?auto=format&fit=crop&w=800&q=80', defaultUnit: 'KM' },
    { label: 'Remo 🚣', url: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&w=800&q=80', defaultUnit: 'METROS' },
    { label: 'Escalada 🧗', url: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=800&q=80', defaultUnit: 'VIAS' },
    { label: 'Lutas / Jiu-Jitsu 🥋', url: 'https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&w=800&q=80', defaultUnit: 'TREINOS' },
    { label: 'Yoga / Pilates 🧘', url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80', defaultUnit: 'AULAS' },
    { label: 'Triathlon 🏊🚴🏃', url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80', defaultUnit: 'KM TOTAL' }
  ];

  // File Upload Handler (reads selected file as Data URL)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBannerUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and drop handlers for image area
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBannerUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFetchLocation = () => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(parseFloat(pos.coords.latitude.toFixed(4)));
          setLng(parseFloat(pos.coords.longitude.toFixed(4)));
          setLocationName('Sua Localização GPS Atual');
          setIsLocating(false);
        },
        (err) => {
          alert('Não foi possível obter sua localização exata. Mantendo local padrão.');
          setIsLocating(false);
        }
      );
    } else {
      alert('Geolocalização não é suportada neste navegador.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor, informe o título do desafio.');
      return;
    }

    const newChallenge: Challenge = {
      id: `ch_${Date.now()}`,
      title: title.toUpperCase(),
      description,
      type,
      scope,
      targetValue: Number(targetValue) || 10,
      currentValue: 0,
      unit: unit.toUpperCase(),
      endsIn: endsIn || '07D 00H 00M',
      joinedUsersCount: 1,
      bannerUrl,
      status: 'active',
      isJoined: true, // Creator auto-joins
      ...(scope === 'local' ? { lat, lng, locationName } : {})
    };

    onCreate(newChallenge);
  };

  return (
    <div className="space-y-6 pb-28 max-w-lg mx-auto px-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancelar</span>
        </button>
        <h1 className="text-base font-black text-white tracking-tight uppercase flex items-center gap-2">
          <Trophy className="w-5 h-5 text-orange-500" />
          <span>Publicar Desafio</span>
        </h1>
        <button
          onClick={handleSubmit}
          className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 text-xs font-black rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
        >
          Publicar
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Banner Cover Box (Upload + Drag & Drop) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-zinc-300 block uppercase flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-orange-500" />
            <span>Imagem de Capa do Desafio</span>
          </label>
          <span className="text-[10px] text-zinc-400">Upload ou Escolha de Esporte</span>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full h-44 rounded-2xl border-2 border-dashed transition-all bg-zinc-900 flex flex-col items-center justify-center space-y-3 relative overflow-hidden group ${
            isDragging
              ? 'border-orange-500 bg-orange-500/10 scale-[1.01]'
              : 'border-orange-500/40 hover:border-orange-500'
          }`}
        >
          <img
            src={bannerUrl}
            alt="Banner preview"
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity"
          />

          <div className="relative z-10 flex flex-col items-center gap-2 px-4 py-3 bg-zinc-950/85 rounded-2xl border border-zinc-800 shadow-xl backdrop-blur-sm max-w-[90%] text-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-zinc-950 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Alterar Imagem de Capa</span>
            </button>

            <p className="text-[10px] text-zinc-400 font-medium">
              Arraste e solte uma foto aqui ou escolha uma modalidade abaixo
            </p>
          </div>
        </div>

        {/* Presets / All Sports Options */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-bold uppercase">
              OPÇÕES RÁPIDAS (TODOS OS ESPORTES):
            </span>
            <span className="text-[10px] text-orange-400 font-mono">
              {presetBanners.length} Esportes Disponíveis
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {presetBanners.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setBannerUrl(p.url);
                  if (p.defaultUnit && !unit) setUnit(p.defaultUnit);
                }}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 flex items-center gap-1 ${
                  bannerUrl === p.url
                    ? 'bg-orange-500 text-zinc-950 border-orange-500 shadow-md shadow-orange-500/20'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white hover:border-zinc-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Challenge Title */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-white block uppercase">Título do Desafio *</label>
          <input
            type="text"
            required
            placeholder="EX: DESAFIO 10K CORRIDA NO IBI"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white uppercase placeholder:normal-case placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Challenge Description */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-white block uppercase">Descritivo do Desafio</label>
          <textarea
            rows={3}
            placeholder="Descreva as regras, premiações ou detalhes do desafio..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 resize-none"
          />
        </div>

        {/* Scope Selection (Global vs Local) */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-white block uppercase">Alcance do Desafio</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setScope('global')}
              className={`py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                scope === 'global'
                  ? 'bg-orange-500 text-zinc-950 border-orange-500 shadow-md'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              🌐 Global (Mundo todo)
            </button>
            <button
              type="button"
              onClick={() => setScope('local')}
              className={`py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                scope === 'local'
                  ? 'bg-orange-500 text-zinc-950 border-orange-500 shadow-md'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              📍 Local (GPS / Presencial)
            </button>
          </div>
        </div>

        {/* Location options if local */}
        {scope === 'local' && (
          <div className="p-3.5 bg-zinc-900/80 border border-orange-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Localização do Desafio
              </span>
              <button
                type="button"
                onClick={handleFetchLocation}
                disabled={isLocating}
                className="text-[10px] font-bold text-zinc-300 hover:text-white bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-lg flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-orange-400" />
                {isLocating ? 'Obtendo GPS...' : 'Usar GPS Atual'}
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 block">Nome do Local / Ponto de Encontro</label>
              <input
                type="text"
                placeholder="Ex: Parque do Ibirapuera, São Paulo - SP"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <label className="text-[10px] text-zinc-500 block">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-300 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Challenge Type */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-white block uppercase">Modalidade do Desafio</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setType('distance');
                setUnit('KM');
              }}
              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                type === 'distance'
                  ? 'bg-orange-500 text-zinc-950 border-orange-500'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              Distância
            </button>
            <button
              type="button"
              onClick={() => {
                setType('sprint');
                setUnit('KM');
              }}
              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                type === 'sprint'
                  ? 'bg-orange-500 text-zinc-950 border-orange-500'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              Sprint / Velocidade
            </button>
            <button
              type="button"
              onClick={() => {
                setType('calories');
                setUnit('KCAL');
              }}
              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                type === 'calories'
                  ? 'bg-orange-500 text-zinc-950 border-orange-500'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              Calorias
            </button>
          </div>
        </div>

        {/* Target Value & Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-white block uppercase">Meta numéricas</label>
            <input
              type="number"
              required
              min={1}
              value={targetValue}
              onChange={(e) => setTargetValue(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono font-bold text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-white block uppercase">Unidade de Medida</label>
            <input
              type="text"
              required
              placeholder="KM, KCAL, SWIM..."
              value={unit}
              onChange={(e) => setUnit(e.target.value.toUpperCase())}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Date & Time Expiration Selector */}
        <div className="space-y-2 p-3.5 bg-zinc-900/90 border border-orange-500/30 rounded-2xl">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span>Data e Hora de Expiração do Desafio</span>
            </label>

            <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {endsIn}
            </span>
          </div>

          <div className="relative">
            <input
              type="datetime-local"
              required
              value={expirationDateTime}
              onChange={(e) => setExpirationDateTime(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-orange-500 transition-colors [color-scheme:dark]"
            />
          </div>

          {/* Quick Expiration Shortcuts */}
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase block">Atalhos de Expiração:</span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: '+24 Horas', days: 1 },
                { label: '+3 Dias', days: 3 },
                { label: '+7 Dias', days: 7 },
                { label: '+30 Dias', days: 30 }
              ].map((shortcut, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setExpirationDateTime(getDefaultExpirationDate(shortcut.days))}
                  className="py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-orange-500/50 text-zinc-300 hover:text-white rounded-lg text-[10px] font-bold transition-all"
                >
                  {shortcut.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-orange-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Publicar Desafio Agora</span>
          </button>
        </div>
      </form>
    </div>
  );
};
