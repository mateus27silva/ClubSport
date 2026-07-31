import React, { useState } from 'react';
import { ChevronLeft, Check, MapPin, Globe } from 'lucide-react';
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

const galleryPhotos = [
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
];

export const QuickUploadView: React.FC<QuickUploadProps> = ({
  initialPhotoUrl,
  onPublish,
  onBack
}) => {
  const { user } = useAuth();
  const [selectedPhoto, setSelectedPhoto] = useState<string>(
    initialPhotoUrl || galleryPhotos[4]
  );
  const [postToFeed, setPostToFeed] = useState<boolean>(true);
  const [postToStory, setPostToStory] = useState<boolean>(false);
  const [addStatsOverlay, setAddStatsOverlay] = useState<boolean>(true);
  const [caption, setCaption] = useState<string>('Treino concluído com foco e energia! 🔥 #ClubSport');
  const [selectedRegionPreset, setSelectedRegionPreset] = useState<string>(
    user?.region || REGION_PRESETS[0].name
  );

  const handlePublish = () => {
    const presetObj = REGION_PRESETS.find((p) => p.name === selectedRegionPreset) || REGION_PRESETS[0];
    onPublish({
      photoUrl: selectedPhoto,
      postToFeed,
      postToStory,
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
        <button onClick={onBack} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black text-white tracking-tight">Quick Upload</h1>
      </div>

      {/* Post to... Checkboxes (Image 8) */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3">
        <span className="text-xs font-bold text-zinc-300 block">Post to...</span>

        <div className="flex space-x-6">
          <label className="flex items-center space-x-2 text-xs text-white font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={postToFeed}
              onChange={(e) => setPostToFeed(e.target.checked)}
              className="w-4 h-4 accent-orange-500 rounded"
            />
            <span>Feed</span>
          </label>

          <label className="flex items-center space-x-2 text-xs text-white font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={postToStory}
              onChange={(e) => setPostToStory(e.target.checked)}
              className="w-4 h-4 accent-orange-500 rounded"
            />
            <span>Story</span>
          </label>
        </div>
      </div>

      {/* Gallery Grid Selection (Image 8) */}
      <div className="grid grid-cols-3 gap-2">
        {galleryPhotos.map((photo, index) => {
          const isSelected = selectedPhoto === photo;

          return (
            <div
              key={index}
              onClick={() => setSelectedPhoto(photo)}
              className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                isSelected ? 'border-orange-500 ring-2 ring-orange-500/50 scale-98' : 'border-transparent opacity-80 hover:opacity-100'
              }`}
            >
              <img src={photo} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
              {isSelected && (
                <div className="absolute top-1 right-1 bg-orange-500 text-zinc-950 p-1 rounded-full">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Caption Input */}
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
        <textarea
          rows={2}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Escreva uma legenda para a publicação..."
          className="w-full bg-transparent text-xs text-white focus:outline-none resize-none"
        />
      </div>

      {/* Location Selector (Localização da Foto) */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] uppercase font-bold text-zinc-400 block flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-orange-500" />
            <span>Localização da Publicação</span>
          </label>
          <span className="text-[9px] text-zinc-500 font-semibold">Codelab Nearby Tag</span>
        </div>

        <div className="flex items-center space-x-2 bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-xs text-white">
          <Globe className="w-4 h-4 text-orange-400 shrink-0" />
          <select
            value={selectedRegionPreset}
            onChange={(e) => setSelectedRegionPreset(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
          >
            {REGION_PRESETS.map((p) => (
              <option key={p.id} value={p.name} className="bg-zinc-900 text-white p-2">
                📍 {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Stats Overlay Switch (Image 8) */}
      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <span className="text-xs font-bold text-white">Add Stats Overlay</span>
        <button
          onClick={() => setAddStatsOverlay(!addStatsOverlay)}
          className={`w-12 h-6 rounded-full p-1 transition-colors ${
            addStatsOverlay ? 'bg-orange-500' : 'bg-zinc-700'
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
