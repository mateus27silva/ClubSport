import React, { useState, useRef } from 'react';
import { ChevronLeft, Camera, Upload, MapPin, Globe } from 'lucide-react';
import { REGION_PRESETS } from '../../lib/location';
import { useAuth } from '../../context/AuthContext';

interface QuickUploadProps {
  initialPhotoUrl?: string;
  onPublish: (postData: {
    photoUrl: string;
    postToFeed: boolean;
    postToStory: boolean;
    addStatsOverlay: boolean;
    caption: string;
    locationName?: string;
    lat?: number;
    lng?: number;
  }) => void;
  onBack: () => void;
}

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80';

export const QuickUploadView: React.FC<QuickUploadProps> = ({
  initialPhotoUrl,
  onPublish,
  onBack
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedPhoto, setSelectedPhoto] = useState<string>(
    initialPhotoUrl || DEFAULT_PHOTO
  );
  const [addStatsOverlay, setAddStatsOverlay] = useState<boolean>(true);
  const [caption, setCaption] = useState<string>('Treino concluído com foco e energia! 🔥 #ClubSport');
  const [selectedRegionPreset, setSelectedRegionPreset] = useState<string>(
    user?.region || REGION_PRESETS[0].name
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = () => {
    const presetObj = REGION_PRESETS.find((p) => p.name === selectedRegionPreset) || REGION_PRESETS[0];
    onPublish({
      photoUrl: selectedPhoto,
      postToFeed: true,
      postToStory: false,
      addStatsOverlay,
      caption,
      locationName: presetObj.name,
      lat: presetObj.lat,
      lng: presetObj.lng
    });
  };

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto px-4">
      {/* Top Header */}
      <div className="flex items-center space-x-3 pt-2">
        <button onClick={onBack} className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Quick Upload</h1>
      </div>

      {/* Hidden File Input for uploading custom photo */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Primary Photo Preview - User Captured Photo */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-orange-600 dark:text-orange-400 font-mono uppercase tracking-wide flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-orange-500" />
            <span>Fotografia Registrada</span>
          </span>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/40 rounded-full text-xs font-bold text-orange-600 dark:text-orange-400 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Trocar Foto</span>
          </button>
        </div>

        {/* Big Preview of User's Photo */}
        <div className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 shadow-inner group">
          <img
            src={selectedPhoto}
            alt="Foto do usuário"
            className="w-full h-full object-cover"
          />

          {addStatsOverlay && (
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white text-[11px] font-mono shadow-lg">
              ⚡ 182 bpm | 🏃 5.2 km
            </div>
          )}
        </div>
      </div>

      {/* Caption Input */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl shadow-sm">
        <textarea
          rows={2}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Escreva uma legenda para a publicação..."
          className="w-full bg-transparent text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none resize-none"
        />
      </div>

      {/* Location Selector (Localização da Foto) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl space-y-2 shadow-sm">
        <div className="flex justify-between items-center">
          <label className="text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-400 block flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-orange-500" />
            <span>Localização da Publicação</span>
          </label>
          <span className="text-[9px] text-zinc-500 font-semibold">Codelab Nearby Tag</span>
        </div>

        <div className="flex items-center space-x-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-2.5 rounded-xl text-xs text-zinc-900 dark:text-white">
          <Globe className="w-4 h-4 text-orange-500 shrink-0" />
          <select
            value={selectedRegionPreset}
            onChange={(e) => setSelectedRegionPreset(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
          >
            {REGION_PRESETS.map((p) => (
              <option key={p.id} value={p.name} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white p-2">
                📍 {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Stats Overlay Switch (Image 8) */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
        <span className="text-xs font-bold text-zinc-900 dark:text-white">Add Stats Overlay</span>
        <button
          onClick={() => setAddStatsOverlay(!addStatsOverlay)}
          className={`w-12 h-6 rounded-full p-1 transition-colors ${
            addStatsOverlay ? 'bg-orange-500' : 'bg-zinc-300 dark:bg-zinc-700'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform ${
              addStatsOverlay ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Publish Button (Image 8) */}
      <button
        onClick={handlePublish}
        className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black uppercase text-xs tracking-wider rounded-2xl shadow-xl shadow-orange-500/20 active:scale-98 transition-all"
      >
        Publish
      </button>
    </div>
  );
};
