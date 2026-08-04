import React, { useState, useRef } from 'react';
import { ChevronLeft, Globe, Camera, Upload, MapPin, Navigation } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SportType } from '../../types';
import { REGION_PRESETS } from '../../lib/location';

interface EditProfileViewProps {
  onBack: () => void;
}

export const EditProfileView: React.FC<EditProfileViewProps> = ({ onBack }) => {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user?.fullName || 'Alex Johnson');
  const [username, setUsername] = useState(user?.username || '@alex_j_athlete');
  const [bio, setBio] = useState(
    user?.bio || 'Passionate long-distance runner and community builder. Sharing my journey and connecting with athletes. #RunLife'
  );
  const [primarySport, setPrimarySport] = useState<SportType>(user?.primarySport || 'Running');
  const [region, setRegion] = useState(user?.region || 'São Paulo, SP, Brasil');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80');

  const handleSave = async () => {
    await updateProfile({
      fullName,
      username,
      bio,
      primarySport,
      region,
      avatarUrl
    });
    alert('Perfil atualizado com sucesso!');
    onBack();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const img = new Image();
          img.onload = () => {
            const cvs = document.createElement('canvas');
            const maxDim = 400;
            const sc = Math.min(1, maxDim / Math.max(img.width, img.height));
            cvs.width = img.width * sc;
            cvs.height = img.height * sc;
            const ctx = cvs.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
              setAvatarUrl(cvs.toDataURL('image/jpeg', 0.8));
            } else {
              setAvatarUrl(event.target.result as string);
            }
          };
          img.src = event.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto px-4">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex items-center space-x-3 pt-2">
        <button onClick={onBack} className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Edit Profile</h1>
      </div>

      {/* Change Photo Section */}
      <div className="flex flex-col items-center space-y-2">
        <div className="relative cursor-pointer group" onClick={handleTriggerUpload}>
          <div className="w-24 h-24 rounded-full border-4 border-orange-500 overflow-hidden bg-white dark:bg-zinc-950 p-0.5 shadow-lg shadow-orange-500/10">
            <img src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} alt="Athlete Avatar" className="w-full h-full rounded-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Upload className="w-6 h-6 text-orange-400" />
            <span className="text-[9px] font-extrabold text-white uppercase mt-1">Upload</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleTriggerUpload}
          className="text-xs font-extrabold text-orange-500 hover:text-orange-400 flex items-center gap-1.5 transition-colors"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Change Photo</span>
        </button>
      </div>

      {/* Form Fields (Image 9) */}
      <div className="space-y-4">
        {/* Full Name */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl space-y-1 shadow-sm">
          <label className="text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-400 block">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-transparent text-xs text-zinc-900 dark:text-white font-semibold focus:outline-none"
          />
        </div>

        {/* Username */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl space-y-1 shadow-sm">
          <label className="text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-400 block">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-transparent text-xs text-zinc-900 dark:text-white font-semibold focus:outline-none"
          />
        </div>

        {/* Bio */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl space-y-1 shadow-sm">
          <label className="text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-400 block">Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-transparent text-xs text-zinc-900 dark:text-white focus:outline-none resize-none"
          />
        </div>

        {/* Primary Sport Dropdown */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl space-y-1 shadow-sm">
          <label className="text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-400 block">Primary Sport</label>
          <select
            value={primarySport}
            onChange={(e) => setPrimarySport(e.target.value as SportType)}
            className="w-full bg-zinc-100 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white font-semibold p-2 rounded-xl border border-zinc-300 dark:border-zinc-800 focus:outline-none"
          >
            <option value="Running">Running</option>
            <option value="Cycling">Cycling</option>
            <option value="Swimming">Swimming</option>
            <option value="Triathlon">Triathlon</option>
            <option value="HIIT">HIIT</option>
            <option value="Yoga">Yoga</option>
          </select>
        </div>

        {/* Region/City Dropdown (Lista Suspensa) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl space-y-2 shadow-sm">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-400 block">
              Região Padrão / Cidade
            </label>
            <span className="text-[9px] text-orange-500 font-semibold flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Buscas Próximas
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-2.5 rounded-xl text-xs text-zinc-900 dark:text-white">
            <Globe className="w-4 h-4 text-orange-500 shrink-0" />
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
            >
              {REGION_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.name} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white p-2">
                  {preset.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[10px] text-zinc-500 leading-tight">
            Esta região será usada como localização padrão para buscar desafios, comunidades e publicações próximas.
          </p>
        </div>
      </div>

      {/* Save Changes Button (Image 9) */}
      <button
        onClick={handleSave}
        className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black uppercase text-xs tracking-wider rounded-2xl shadow-xl shadow-orange-500/20 active:scale-98 transition-all"
      >
        Save Changes
      </button>
    </div>
  );
};
