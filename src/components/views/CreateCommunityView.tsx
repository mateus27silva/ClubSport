import React, { useState, useRef, useEffect } from 'react';
import { Camera, Search, UserPlus, Check, MapPin, Upload } from 'lucide-react';
import { SportType } from '../../types';
import { db, collection, getDocs } from '../../lib/firebase';

interface CreateCommunityProps {
  onCancel: () => void;
  onCreate: (community: {
    name: string;
    description: string;
    location?: string;
    sportCategory: SportType;
    privacy: 'public' | 'private';
    coverUrl: string;
  }) => void;
}

export const CreateCommunityView: React.FC<CreateCommunityProps> = ({ onCancel, onCreate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('São Paulo, SP, Brasil');
  const [sportCategory, setSportCategory] = useState<SportType>('Running');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [coverUrl, setCoverUrl] = useState(
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80'
  );
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; name: string; avatar: string }[]>([]);

  useEffect(() => {
    async function loadRegisteredUsers() {
      try {
        const snap = await getDocs(collection(db, 'users'));
        if (!snap.empty) {
          const list = snap.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: data.fullName || data.displayName || 'Atleta ClubSport',
              avatar: data.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
            };
          });
          setAvailableUsers(list);
        }
      } catch (err) {
        console.warn('Could not load registered users for invite:', err);
      }
    }
    loadRegisteredUsers();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCoverUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleInvite = (id: string) => {
    setInvitedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Por favor, informe o nome da comunidade.');
      return;
    }
    onCreate({
      name,
      description,
      location,
      sportCategory,
      privacy,
      coverUrl
    });
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

      {/* Header bar */}
      <div className="flex items-center justify-between pt-2">
        <button onClick={onCancel} className="text-xs font-bold text-orange-400 hover:text-white">
          Cancel
        </button>
        <h1 className="text-lg font-black text-white tracking-tight">Create New Community</h1>
        <button onClick={handleSave} className="text-xs font-bold text-zinc-400 hover:text-white">
          Next
        </button>
      </div>

      {/* Upload Cover Image Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="w-full h-36 rounded-2xl border-2 border-dashed border-orange-500/50 hover:border-orange-500 bg-zinc-900 flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all relative overflow-hidden group shadow-lg"
      >
        <img src={coverUrl} alt="Cover preview" className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-300" />
        <div className="relative z-10 flex flex-col items-center gap-1.5 bg-black/60 px-4 py-2 rounded-xl backdrop-blur-sm border border-zinc-800">
          <Upload className="w-6 h-6 text-orange-400" />
          <span className="text-xs font-black text-white uppercase tracking-wider">Upload Cover Image</span>
          <span className="text-[10px] text-zinc-400 font-medium">Clique para selecionar imagem</span>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-white block">Community Name *</label>
          <input
            type="text"
            placeholder="Enter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-white block">Description</label>
          <textarea
            rows={3}
            placeholder="Tell us about your community"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 resize-none"
          />
        </div>

        {/* Community Location / Localidade */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-white block uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-orange-400" />
            <span>Community Location / Localidade</span>
          </label>
          <input
            type="text"
            placeholder="Ex: São Paulo, SP, Brasil (ou Global)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Sport Category */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-white block">Sport Category</label>
          <select
            value={sportCategory}
            onChange={(e) => setSportCategory(e.target.value as SportType)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="Running">Running</option>
            <option value="Cycling">Cycling</option>
            <option value="Swimming">Swimming</option>
            <option value="Triathlon">Triathlon</option>
            <option value="HIIT">HIIT</option>
          </select>
        </div>

        {/* Privacy Switch (Image 10) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white block">Privacy</label>
          <div className="flex items-center space-x-6 bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs text-white">
            <span className="font-medium">Public</span>
            <button
              onClick={() => setPrivacy(privacy === 'public' ? 'private' : 'public')}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                privacy === 'public' ? 'bg-orange-500' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  privacy === 'public' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="font-medium">Private</span>
          </div>
        </div>

        {/* Initial Members Invite List (Image 10) */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-white block">Initial Members</label>
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search friends to invite"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            {availableUsers.map((userItem) => {
              const isInvited = invitedUsers.includes(userItem.id);

              return (
                <div
                  key={userItem.id}
                  className="flex items-center justify-between p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={userItem.avatar}
                      alt={userItem.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-white">{userItem.name}</span>
                  </div>

                  <button
                    onClick={() => toggleInvite(userItem.id)}
                    className={`px-4 py-1.5 rounded-xl font-bold text-xs uppercase transition-all ${
                      isInvited
                        ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        : 'bg-orange-500 hover:bg-orange-600 text-zinc-950 shadow-md shadow-orange-500/20'
                    }`}
                  >
                    {isInvited ? 'Convidado' : 'Convidar'}
                  </button>
                </div>
              );
            })}

            {availableUsers.length === 0 && (
              <p className="text-xs text-zinc-500 italic p-2 text-center">
                Nenhum outro atleta cadastrado no momento para convidar.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Create Community Button (Image 10) */}
      <button
        onClick={handleSave}
        className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black uppercase text-xs tracking-wider rounded-2xl shadow-xl shadow-orange-500/20 active:scale-98 transition-all"
      >
        Create Community
      </button>
    </div>
  );
};
