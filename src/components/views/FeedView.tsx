import React, { useState, useEffect } from 'react';
import { Flame, MessageCircle, Share2, MoreHorizontal, MapPin, Plus, Send, Edit3, Trash2, X, Globe, Navigation, Compass, Radio, Heart, ChevronLeft, ChevronRight, Eye, Play, Download } from 'lucide-react';
import { ActivityPost } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { resolveLocationCoords, processNearbyItems, formatDistanceString } from '../../lib/location';
import { downloadGpxFile } from '../../lib/runUtils';

export interface StoryItem {
  id: string;
  userName: string;
  userAvatar: string;
  storyImage: string;
  isLive: boolean;
  isCurrentUser?: boolean;
  caption: string;
  sport: string;
  timeAgo: string;
  likesCount?: number;
}

interface FeedViewProps {
  activities: ActivityPost[];
  onToggleLike: (activityId: string) => void;
  onAddComment: (activityId: string, text: string) => void;
  onOpenCommunityChat: (communityId: string) => void;
  onOpenCapture: () => void;
  onOpenTracker?: () => void;
  onDeleteActivity?: (activityId: string) => void;
  onEditActivity?: (activityId: string, newCaption: string) => void;
  onOpenUserProfile?: (userObj: { userId: string; userName: string; userAvatar?: string }) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  activities,
  onToggleLike,
  onAddComment,
  onOpenCommunityChat,
  onOpenCapture,
  onOpenTracker,
  onDeleteActivity,
  onEditActivity,
  onOpenUserProfile
}) => {
  const { user } = useAuth();
  const { isOnline, queueAction } = useOffline();
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<string>('');
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<{ id: string; caption: string } | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  // Build Stories & Live Streams dynamically from real users / activities
  const userStory: StoryItem = {
    id: 'story_user',
    userName: user?.fullName ? user.fullName.split(' ')[0] : 'Seu Story',
    userAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    storyImage: user?.avatarUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    isLive: false,
    isCurrentUser: true,
    caption: 'Compartilhe sua corrida ou inicie uma live com a comunidade!',
    sport: user?.primarySport || 'Corrida',
    timeAgo: 'Agora',
    likesCount: 0
  };

  // Build stories from real activities posted by other users
  const realOtherStories: StoryItem[] = [];
  const seenUsers = new Set<string>();
  if (user?.uid) seenUsers.add(user.uid);
  if (user?.fullName) seenUsers.add(user.fullName.toLowerCase());

  activities.forEach((act) => {
    const key = act.userId || act.userName.toLowerCase();
    if (!seenUsers.has(key)) {
      seenUsers.add(key);
      realOtherStories.push({
        id: `story_act_${act.id}`,
        userName: act.userName.split(' ')[0] || act.userName,
        userAvatar: act.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        storyImage: act.imageUrl || act.userAvatar,
        isLive: false,
        caption: act.caption || `${act.sport} - ${act.distanceKm} KM`,
        sport: act.sport,
        timeAgo: act.createdAt || 'recente',
        likesCount: act.likesCount || 0
      });
    }
  });

  const stories: StoryItem[] = [userStory, ...realOtherStories];

  // Resolve user coords based on their region preset
  const userCoords = resolveLocationCoords(user?.region);

  // Process activities with calculated distances from user region and sort progressively by proximity (closest first)
  const processedActivities = processNearbyItems<ActivityPost>(activities, userCoords, 'All').sort((a, b) => {
    const distA = a.calculatedDistanceKm ?? 99999;
    const distB = b.calculatedDistanceKm ?? 99999;
    return distA - distB;
  });

  const handleSendComment = (activityId: string) => {
    if (!commentInput.trim()) return;
    onAddComment(activityId, commentInput);
    if (!isOnline) {
      queueAction('ADD_COMMENT', { activityId, text: commentInput });
    }
    setCommentInput('');
  };

  return (
    <div className="space-y-5 pb-24 max-w-lg mx-auto">
      {/* Live Challenges & Stories Bar */}
      <section className="px-4">
        <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <span>Live Challenges</span>
          </span>
          <span className="text-xs text-orange-500 dark:text-orange-400 cursor-pointer hover:underline" onClick={() => setSelectedChallenge('all')}>
            View All
          </span>
        </h2>
        <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-none">
          {stories.map((item, index) => (
            <div
              key={item.id}
              onClick={() => setActiveStoryIndex(index)}
              className="flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer group"
            >
              <div
                className={`relative p-[2px] rounded-full transition-transform group-hover:scale-105 ${
                  item.isLive
                    ? 'bg-gradient-to-tr from-red-600 via-orange-500 to-amber-400 shadow-lg shadow-red-500/20'
                    : 'bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400'
                }`}
              >
                <img
                  src={item.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={item.userName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-zinc-950"
                />

                {/* Small "LIVE" Badge (or Plus Icon for user) - No green dot */}
                {item.isLive ? (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 border border-zinc-950 px-1.5 py-0.5 rounded-full text-[8px] font-black tracking-wider text-white uppercase shadow-md flex items-center gap-0.5 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    LIVE
                  </span>
                ) : item.isCurrentUser ? (
                  <div className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-0.5 border-2 border-zinc-950 text-zinc-950">
                    <Plus className="w-3 h-3 stroke-[3]" />
                  </div>
                ) : null}
              </div>

              <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium group-hover:text-orange-500 max-w-[70px] truncate text-center">
                {item.userName}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Story Viewer Modal */}
      {activeStoryIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between max-w-lg mx-auto overflow-hidden animate-fade-in">
          {/* Top Bar with Segmented Progress Bar & User Header */}
          <div className="absolute top-0 left-0 right-0 z-30 p-4 space-y-3 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
            {/* Segmented Progress Bar */}
            <div className="flex gap-1.5 w-full">
              {stories.map((s, idx) => (
                <div
                  key={s.id}
                  className={`h-1 rounded-full flex-1 transition-all ${
                    idx === activeStoryIndex
                      ? 'bg-white'
                      : idx < activeStoryIndex
                      ? 'bg-white/60'
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* User Info Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={stories[activeStoryIndex].userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={stories[activeStoryIndex].userName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-orange-500"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">
                      {stories[activeStoryIndex].userName}
                    </span>
                    {stories[activeStoryIndex].isLive && (
                      <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <Radio className="w-2.5 h-2.5 animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 block">
                    {stories[activeStoryIndex].timeAgo} • {stories[activeStoryIndex].sport}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveStoryIndex(null)}
                className="p-2 text-zinc-300 hover:text-white bg-black/40 hover:bg-black/60 rounded-full border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Story Main Image Backdrop */}
          <div className="relative w-full h-full flex items-center justify-center bg-zinc-950">
            {stories[activeStoryIndex].storyImage && (
              <img
                src={stories[activeStoryIndex].storyImage}
                alt="Story Content"
                className="w-full h-full object-cover"
              />
            )}

            {/* Navigation Left / Right Touch Overlay */}
            <button
              onClick={() => setActiveStoryIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
              className="absolute left-0 top-0 bottom-0 w-1/3 z-20 focus:outline-none text-left p-4 group"
            >
              {activeStoryIndex > 0 && (
                <div className="hidden group-hover:flex w-10 h-10 bg-black/50 backdrop-blur-md rounded-full items-center justify-center text-white border border-white/20">
                  <ChevronLeft className="w-6 h-6" />
                </div>
              )}
            </button>

            <button
              onClick={() =>
                setActiveStoryIndex((prev) => (prev !== null && prev < stories.length - 1 ? prev + 1 : prev))
              }
              className="absolute right-0 top-0 bottom-0 w-1/3 z-20 focus:outline-none text-right p-4 group flex justify-end"
            >
              {activeStoryIndex < stories.length - 1 && (
                <div className="hidden group-hover:flex w-10 h-10 bg-black/50 backdrop-blur-md rounded-full items-center justify-center text-white border border-white/20">
                  <ChevronRight className="w-6 h-6" />
                </div>
              )}
            </button>

            {/* Bottom Story Footer Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black via-black/80 to-transparent z-30 space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded-md">
                  {stories[activeStoryIndex].sport}
                </span>
                <p className="text-xs font-medium text-white leading-relaxed">
                  {stories[activeStoryIndex].caption}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {stories[activeStoryIndex].isLive ? (
                  <button
                    onClick={() => {
                      setActiveStoryIndex(null);
                      onOpenCapture();
                    }}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all"
                  >
                    <Radio className="w-4 h-4 animate-pulse" />
                    Entrar na Transmissão Ao Vivo
                  </button>
                ) : stories[activeStoryIndex].isCurrentUser ? (
                  <button
                    onClick={() => {
                      setActiveStoryIndex(null);
                      onOpenCapture();
                    }}
                    className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Criar Novo Story / Transmissão Live
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setActiveStoryIndex(null);
                      onOpenCapture();
                    }}
                    className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <Radio className="w-4 h-4 text-orange-400" />
                    Iniciar Live Também
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Selected Live Challenge Banner Notice if clicked */}
      {selectedChallenge && (
        <div className="mx-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-xs text-orange-300 flex items-center justify-between">
          <span>🎯 Desafio Ativo: <strong>{selectedChallenge}</strong></span>
          <button
            onClick={() => setSelectedChallenge(null)}
            className="text-orange-400 font-bold hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Activity Posts Feed List */}
      <div className="space-y-6 px-4">
        {processedActivities.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-3 shadow-sm">
            <Compass className="w-10 h-10 text-orange-500 mx-auto opacity-80" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Nenhuma publicação encontrada</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xs mx-auto">
              Seja o primeiro a publicar um treino na sua região!
            </p>
          </div>
        ) : (
          processedActivities.map((act) => (
            <article
              key={act.id}
              id={`activity-${act.id}`}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl transition-colors"
            >
              {/* Header: User Info & Location */}
              <div className="p-4 flex items-center justify-between relative">
                <div className="flex items-center space-x-3">
                  <img
                    src={act.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                    alt={act.userName}
                    onClick={() => onOpenUserProfile?.({ userId: act.userId, userName: act.userName, userAvatar: act.userAvatar })}
                    className="w-10 h-10 rounded-full object-cover border border-orange-500/50 cursor-pointer hover:scale-105 transition-transform"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                      <span
                        onClick={() => onOpenUserProfile?.({ userId: act.userId, userName: act.userName, userAvatar: act.userAvatar })}
                        className="cursor-pointer hover:text-orange-500 dark:hover:text-orange-400 hover:underline"
                      >
                        {act.userName}
                      </span>
                      {Boolean(user && (act.userId === user.uid || act.userName === user.fullName)) && (
                        <span className="text-[9px] bg-orange-500/15 text-orange-500 dark:text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full font-bold">
                          Você
                        </span>
                      )}
                      <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-orange-600 dark:text-orange-400 px-1.5 py-0.2 rounded font-mono font-bold">
                        {act.sport}
                      </span>
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{act.timeAgo}</span>
                      {(act.locationName || act.calculatedDistanceKm !== undefined) && (
                        <span className="flex items-center gap-1.5 text-xs font-sport italic tracking-wide font-bold text-orange-500 dark:text-orange-400">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0 not-italic" />
                          <span>{act.locationName || 'Local'}</span>
                          {act.calculatedDistanceKm !== undefined && (
                            <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[10px] not-italic ml-0.5 font-normal">
                              ({formatDistanceString(act.calculatedDistanceKm)})
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              {/* Options Menu Button */}
              <div className="relative">
                <button
                  onClick={() => setOpenMenuPostId(openMenuPostId === act.id ? null : act.id)}
                  className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {/* Dropdown Options Popup */}
                {openMenuPostId === act.id && (() => {
                  const isOwnPost = Boolean(user && (act.userId === user.uid || act.userName === user.fullName));

                  return (
                    <div className="absolute right-0 top-8 z-30 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl py-1.5 w-48 overflow-hidden">
                      {isOwnPost ? (
                        <>
                          <button
                            onClick={() => {
                              setOpenMenuPostId(null);
                              setEditingPost({ id: act.id, caption: act.caption });
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white flex items-center space-x-2.5 transition-colors"
                          >
                            <Edit3 className="w-4 h-4 text-orange-500" />
                            <span>Editar publicação</span>
                          </button>
                          <div className="border-t border-zinc-800/80 my-1" />
                          <button
                            onClick={() => {
                              setOpenMenuPostId(null);
                              if (confirm('Tem certeza que deseja excluir esta publicação?')) {
                                onDeleteActivity?.(act.id);
                              }
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 flex items-center space-x-2.5 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                            <span>Excluir publicação</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setOpenMenuPostId(null);
                              navigator.clipboard?.writeText(window.location.href);
                              alert('Link da publicação copiado!');
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white flex items-center space-x-2.5 transition-colors"
                          >
                            <Share2 className="w-4 h-4 text-orange-500" />
                            <span>Copiar link</span>
                          </button>
                          <div className="border-t border-zinc-800/80 my-1" />
                          <button
                            onClick={() => {
                              setOpenMenuPostId(null);
                              alert('Publicação denunciada. Obrigado por ajudar a manter a comunidade segura!');
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white flex items-center space-x-2.5 transition-colors"
                          >
                            <X className="w-4 h-4 text-zinc-400" />
                            <span>Reportar publicação</span>
                          </button>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Map Preview or Image (Image 1 style) */}
            {act.hasMap ? (
              <div className="relative w-full h-56 bg-zinc-950 border-y border-zinc-800 flex flex-col justify-end overflow-hidden">
                {/* Simulated GPS Map Route SVG Background */}
                <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 400 200" fill="none">
                  {/* Grid Lines */}
                  <path d="M0 40 H400 M0 80 H400 M0 120 H400 M0 160 H400" stroke="#27272a" strokeWidth="1" />
                  <path d="M80 0 V200 M160 0 V200 M240 0 V200 M320 0 V200" stroke="#27272a" strokeWidth="1" />
                  {/* Map Route line */}
                  <path
                    d="M140 160 L180 140 L220 120 L240 70 L300 60 L320 90 L260 110 L280 130"
                    stroke="#f97316"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Start Dot */}
                  <circle cx="140" cy="160" r="5" fill="#22c55e" />
                  {/* End Dot */}
                  <circle cx="280" cy="130" r="5" fill="#f97316" />
                </svg>

                {/* Overlaid Running Stats Grid */}
                <div className="relative z-10 grid grid-cols-4 gap-2 p-3 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent border-t border-zinc-800/50">
                  <div>
                    <div className="text-xl font-black text-orange-500 font-sport tracking-tight">
                      {act.distanceKm} <span className="text-[10px] font-normal text-zinc-300">km</span>
                    </div>
                    <div className="text-[9px] uppercase font-bold text-zinc-400">Distância</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-orange-500 font-mono tracking-tight">
                      {Math.floor(act.timeMinutes)}:30 <span className="text-[10px] font-normal text-zinc-300">m</span>
                    </div>
                    <div className="text-[9px] uppercase font-bold text-zinc-400">Tempo</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-orange-500 font-sport tracking-tight">
                      {act.pace}
                    </div>
                    <div className="text-[9px] uppercase font-bold text-zinc-400">Ritmo</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-rose-400 font-mono tracking-tight flex items-center gap-0.5">
                      {act.avgHeartRate || 145} <span className="text-[9px] font-normal text-zinc-400">bpm</span>
                    </div>
                    <div className="text-[9px] uppercase font-bold text-zinc-400">Freq. Cardíaca</div>
                  </div>
                </div>

                {/* Quick GPX Export Button */}
                <div className="absolute top-2 right-2 z-20">
                  <button
                    onClick={() => {
                      const dummyPts = act.routePoints || [
                        { lat: -23.5874, lng: -46.6576, alt: 760, timestamp: Date.now() - 3600000, heartRate: act.avgHeartRate || 145 },
                        { lat: -23.5862, lng: -46.6558, alt: 762, timestamp: Date.now() - 1800000, heartRate: (act.avgHeartRate || 145) + 5 },
                        { lat: -23.5849, lng: -46.6542, alt: 765, timestamp: Date.now(), heartRate: (act.avgHeartRate || 145) - 3 }
                      ];
                      downloadGpxFile(act.title, dummyPts);
                    }}
                    className="px-2.5 py-1 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-700/80 rounded-lg text-[10px] font-bold text-orange-400 flex items-center gap-1 backdrop-blur-md shadow-md transition-all"
                    title="Baixar Arquivo .GPX"
                  >
                    <Download className="w-3 h-3 text-orange-500" />
                    <span>.GPX</span>
                  </button>
                </div>
              </div>
            ) : act.imageUrl ? (
              <div className="relative w-full h-64 bg-zinc-950 border-y border-zinc-800 overflow-hidden">
                <img src={act.imageUrl} alt={act.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-3 left-3 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-800 flex gap-4 text-xs">
                  <div>
                    <span className="font-bold text-orange-400">{act.timeMinutes} min</span>
                    <span className="text-zinc-400 text-[10px] block">Time</span>
                  </div>
                  <div>
                    <span className="font-bold text-orange-400">{act.calories} kcal</span>
                    <span className="text-zinc-400 text-[10px] block">Burned</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Actions: Like, Comment, Share */}
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-6 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <button
                  onClick={() => onToggleLike(act.id)}
                  className={`flex items-center space-x-1.5 transition-colors ${
                    act.isLiked ? 'text-orange-500' : 'hover:text-orange-500 dark:hover:text-orange-400'
                  }`}
                >
                  <Flame className={`w-5 h-5 ${act.isLiked ? 'fill-orange-500 text-orange-500' : ''}`} />
                  <span>Like</span>
                </button>

                <button
                  onClick={() => setActiveCommentPostId(activeCommentPostId === act.id ? null : act.id)}
                  className="flex items-center space-x-1.5 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Comment</span>
                </button>

                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: act.title, text: act.caption, url: window.location.href });
                    } else {
                      alert('Link da atividade copiado para a área de transferência!');
                    }
                  }}
                  className="flex items-center space-x-1.5 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>

              {/* Likes & Comments Summary */}
              <div className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                <span>{(act.likesCount + (act.isLiked ? 1 : 0)).toLocaleString()} Likes</span>
                <span className="mx-2 text-zinc-400 dark:text-zinc-600">•</span>
                <button
                  onClick={() => setActiveCommentPostId(activeCommentPostId === act.id ? null : act.id)}
                  className="hover:underline text-zinc-500 dark:text-zinc-400"
                >
                  View all {act.commentsCount + act.comments.length} comments
                </button>
              </div>

              {/* Caption */}
              <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
                <span
                  onClick={() => onOpenUserProfile?.({ userId: act.userId, userName: act.userName, userAvatar: act.userAvatar })}
                  className="font-bold text-zinc-900 dark:text-white mr-2 cursor-pointer hover:text-orange-500 dark:hover:text-orange-400 hover:underline"
                >
                  {act.userName}
                </span>
                {act.caption}
              </p>

              {/* Comment Thread Input Box */}
              {activeCommentPostId === act.id && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 space-y-2">
                  {/* Existing Comments */}
                  <div className="max-h-36 overflow-y-auto space-y-2 text-xs">
                    {act.comments.map((cm) => {
                      const isOwnComment = Boolean(user && (cm.userId === user.uid || cm.userName === user.fullName));
                      return (
                        <div key={cm.id} className="bg-zinc-100 dark:bg-zinc-800/40 p-2 rounded-lg flex items-center justify-between">
                          <div>
                            <span
                              onClick={() => onOpenUserProfile?.({ userId: cm.userId, userName: cm.userName, userAvatar: cm.userAvatar })}
                              className="font-bold text-orange-600 dark:text-orange-400 cursor-pointer hover:underline"
                            >
                              {cm.userName}
                              {isOwnComment && <span className="text-[10px] text-zinc-400 font-normal ml-1">(Você)</span>}:{" "}
                            </span>
                            <span className="text-zinc-800 dark:text-zinc-300">{cm.text}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Input form */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Adicionar um comentário..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendComment(act.id)}
                      className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500 placeholder:text-zinc-500 dark:placeholder:text-zinc-500"
                    />
                    <button
                      onClick={() => handleSendComment(act.id)}
                      className="bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold p-2 rounded-xl"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </article>
        )))}
      </div>

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-6 text-white space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-orange-500" />
                Editar Publicação
              </h3>
              <button
                onClick={() => setEditingPost(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Legenda da Atividade</label>
              <textarea
                rows={4}
                value={editingPost.caption}
                onChange={(e) => setEditingPost({ ...editingPost, caption: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500 resize-none"
                placeholder="Escreva a legenda..."
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setEditingPost(null)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (onEditActivity && editingPost) {
                    onEditActivity(editingPost.id, editingPost.caption);
                  }
                  setEditingPost(null);
                }}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black uppercase text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
