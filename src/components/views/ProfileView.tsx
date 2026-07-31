import React, { useState } from 'react';
import { Settings, Watch, Shield, Award, Edit3, Flame, MessageCircle, Activity, Users, X, Send, Heart, Share2, Clock, Zap, Trophy, CheckCircle, MapPin, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Challenge, ActivityPost } from '../../types';
import { REGION_PRESETS } from '../../lib/location';

interface HighlightItem {
  id: string;
  title: string;
  sport: string;
  distance: string;
  pace: string;
  duration: string;
  calories: string;
  imageUrl: string;
  likes: number;
  isLiked?: boolean;
  commentsCount: number;
  caption: string;
  commentsList: { id: string; author: string; avatar: string; text: string; timeAgo: string }[];
}

interface ProfileViewProps {
  challenges?: Challenge[];
  activities?: ActivityPost[];
  onOpenEditProfile: () => void;
  onOpenConnectWatch: () => void;
  onOpenAdminDashboard: () => void;
  onOpenAnalytics: () => void;
  onOpenCommunityChat?: (communityId?: string) => void;
  onOpenUserProfile?: (userObj: { userId: string; userName: string; userAvatar?: string }) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  challenges = [],
  activities = [],
  onOpenEditProfile,
  onOpenConnectWatch,
  onOpenAdminDashboard,
  onOpenAnalytics,
  onOpenCommunityChat,
  onOpenUserProfile
}) => {
  const { user, updateProfile } = useAuth();
  const [isClubsModalOpen, setIsClubsModalOpen] = useState(false);
  const [isCompletedChallengesModalOpen, setIsCompletedChallengesModalOpen] = useState(false);
  const [challengeModalTab, setChallengeModalTab] = useState<'completed' | 'joined'>('completed');
  const [selectedHighlight, setSelectedHighlight] = useState<HighlightItem | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // Convert ActivityPost items from logged-in user into HighlightItem format
  const userActivities = activities.filter(
    (act) =>
      (user?.uid && act.userId === user.uid) ||
      (user?.fullName && act.userName.toLowerCase() === user.fullName.toLowerCase())
  );

  const displayHighlights: HighlightItem[] = userActivities.map((act) => ({
    id: act.id,
    title: act.title || `${act.sport.toUpperCase()} • ${act.distanceKm} KM`,
    sport: act.sport,
    distance: `${act.distanceKm} KM`,
    pace: act.pace,
    duration: `${act.timeMinutes} MIN`,
    calories: `${act.calories} KCAL`,
    imageUrl: act.imageUrl,
    likes: act.likesCount,
    isLiked: act.isLiked,
    commentsCount: act.commentsCount,
    caption: act.caption,
    commentsList: (act.comments || []).map((c) => ({
      id: c.id,
      author: c.userName,
      avatar: c.userAvatar,
      text: c.text,
      timeAgo: c.createdAt
    }))
  }));

  if (!user) return null;

  // Calculate accumulated Total KM from joined / completed challenges + user baseline
  const accumulatedChallengesKm = challenges.reduce((acc, c) => {
    if (c.isJoined || c.status === 'completed') {
      if (c.unit?.toUpperCase().includes('KM')) {
        return acc + (c.currentValue || c.targetValue || 0);
      }
    }
    return acc;
  }, 0);

  // Total accumulated distance in KM
  const totalCalculatedKm = user.totalKm + accumulatedChallengesKm;

  // Joined & Completed Challenges calculations
  const joinedChallengesList = challenges.filter((c) => c.isJoined);
  const completedChallengesList = challenges.filter(
    (c) => c.status === 'completed' || (c.isJoined && c.currentValue >= c.targetValue)
  );
  const inProgressChallengesList = joinedChallengesList.filter(
    (c) => c.status !== 'completed' && c.currentValue < c.targetValue
  );

  const joinedCount = joinedChallengesList.length;
  const completedCount = completedChallengesList.length;

  // Toggle Like on selected highlight
  const handleToggleLikeHighlight = (hlId: string) => {
    if (selectedHighlight && selectedHighlight.id === hlId) {
      const nextIsLiked = !selectedHighlight.isLiked;
      const nextLikes = nextIsLiked ? selectedHighlight.likes + 1 : selectedHighlight.likes - 1;
      setSelectedHighlight({ ...selectedHighlight, isLiked: nextIsLiked, likes: nextLikes });
    }
  };

  // Add Comment to selected highlight
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedHighlight) return;

    const newComment = {
      id: `c_${Date.now()}`,
      author: user.fullName || 'Você',
      avatar: user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      text: newCommentText.trim(),
      timeAgo: 'Agora'
    };

    const updatedList = [...selectedHighlight.commentsList, newComment];
    setSelectedHighlight({
      ...selectedHighlight,
      commentsCount: updatedList.length,
      commentsList: updatedList
    });

    setNewCommentText('');
  };

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto px-4">
      {/* Top action header: Settings / Admin */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-white tracking-tight">Profile</h1>
        <div className="flex items-center space-x-2">
          {user.role === 'admin' && (
            <button
              onClick={onOpenAdminDashboard}
              className="bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 hover:bg-orange-500/30"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Card Info */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="relative">
          <div className="w-28 h-28 rounded-full border-4 border-orange-500 p-1 bg-zinc-950 shadow-xl shadow-orange-500/10">
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          {user.isPro && (
            <span className="absolute bottom-0 right-1 bg-white text-zinc-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-md border border-zinc-300">
              Pro
            </span>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-black text-white">{user.fullName}</h2>
          <p className="text-xs text-zinc-400 font-medium">
            {user.primarySport || 'Corrida'} • {user.region || 'Brasil'}
          </p>

          <p className="text-xs text-zinc-300 mt-2 max-w-xs">{user.bio}</p>
        </div>

        {/* Action buttons next to Editar Perfil */}
        <div className="flex items-center space-x-2 pt-2 w-full max-w-xs justify-center">
          <button
            onClick={onOpenEditProfile}
            className="flex-1 py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 transition-all active:scale-98"
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar Perfil</span>
          </button>

          <button
            onClick={onOpenAnalytics}
            className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
            title="Estatísticas & Analytics"
          >
            <Activity className="w-4 h-4 text-orange-400" />
            <span>Analytics</span>
          </button>

          <button
            onClick={onOpenConnectWatch}
            className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
            title="Conectar Relógio"
          >
            <Watch className="w-4 h-4 text-orange-500" />
            <span>Watch</span>
          </button>
        </div>
      </div>

      {/* Clubs & Stats Row (Image 3) */}
      <div className="grid grid-cols-3 gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        {/* Clubs Column - Clickable with quantity badge */}
        <div
          onClick={() => setIsClubsModalOpen(true)}
          className="cursor-pointer group/clubs p-1 -m-1 rounded-xl hover:bg-zinc-800/60 transition-all border border-transparent hover:border-orange-500/30"
          title="Clique para ver os grupos que você participa"
        >
          <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1 group-hover/clubs:text-orange-400 transition-colors">
            CLUBS ({user.clubs.length})
          </span>
          <div className="flex items-center space-x-2">
            <div className="text-xl font-black text-orange-500 font-mono">
              {user.clubs.length}
            </div>
            <div className="flex -space-x-1.5 overflow-hidden">
              {user.clubs.map((club, idx) => (
                <div
                  key={idx}
                  title={club}
                  className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-900 flex items-center justify-center text-orange-400 text-[9px] font-bold shadow"
                >
                  {club.charAt(0)}
                </div>
              ))}
            </div>
          </div>
          <span className="text-[9px] text-zinc-400 block mt-1 underline decoration-zinc-600 group-hover/clubs:text-orange-300">
            Ver grupos →
          </span>
        </div>

        {/* Total KM */}
        <div className="border-l border-zinc-800 pl-3">
          <span className="text-[10px] font-bold uppercase text-zinc-400 block">Total KM</span>
          <div className="text-xl font-black text-orange-500 font-mono tracking-tight">
            {totalCalculatedKm >= 1000
              ? `${(totalCalculatedKm / 1000).toFixed(1)}k`
              : `${totalCalculatedKm.toFixed(1)}`}
          </div>
          <span className="text-[9px] text-zinc-400 block truncate" title="Soma acumulada de desafios e atividades">
            KM CONCLUÍDOS
          </span>
        </div>

        {/* Desafios Concluídos vs Inscritos */}
        <div
          onClick={() => setIsCompletedChallengesModalOpen(true)}
          className="border-l border-zinc-800 pl-3 cursor-pointer group/challenges hover:bg-zinc-800/40 p-1 -m-1 rounded-xl transition-all"
          title="Clique para ver lista de desafios concluídos e em andamento"
        >
          <span className="text-[10px] font-bold uppercase text-zinc-400 block group-hover/challenges:text-orange-400">
            DESAFIOS
          </span>
          <div className="text-xl font-black text-orange-500 font-mono tracking-tight flex items-baseline gap-1">
            <span>{completedCount}/{joinedCount}</span>
          </div>
          <span className="text-[9px] text-zinc-400 block truncate group-hover/challenges:text-orange-300 underline decoration-zinc-600">
            CONCLUÍDOS / ENTROU →
          </span>
        </div>
      </div>

      {/* Activity Highlights Section (Clickable Cards to open post & comments) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-orange-500" />
            <span>Minhas Publicações ({displayHighlights.length})</span>
          </h3>
        </div>

        {displayHighlights.length === 0 ? (
          <div className="p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl text-center space-y-2">
            <Activity className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs font-bold text-zinc-300">Nenhuma publicação ainda</p>
            <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
              Realize e salve um treino no Rastreamento GPS para ver suas publicações e conquistas registradas aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {displayHighlights.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedHighlight(item)}
                className="bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 rounded-xl overflow-hidden relative group cursor-pointer transition-all hover:scale-[1.02] shadow-md hover:shadow-orange-500/10"
              >
                <div className="relative h-32 overflow-hidden bg-zinc-950">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-zinc-950/80 backdrop-blur-md text-[9px] font-bold text-orange-400 border border-zinc-800 uppercase">
                    {item.sport}
                  </span>
                </div>

                <div className="p-2.5 bg-zinc-950/90 text-[10px] space-y-1 border-t border-zinc-800/60">
                  <span className="font-bold text-orange-400 block uppercase truncate">
                    {item.title}
                  </span>
                  <div className="flex items-center justify-between text-zinc-400 pt-0.5">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center gap-1 font-mono font-bold text-zinc-300">
                        <Flame className="w-3 h-3 text-orange-500" />
                        {item.likes >= 1000 ? `${(item.likes / 1000).toFixed(1)}k` : item.likes}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-zinc-400">
                        <MessageCircle className="w-3 h-3 text-zinc-400" />
                        {item.commentsCount}
                      </span>
                    </div>
                    <span className="text-[9px] text-orange-400/90 font-bold group-hover:underline">
                      Ver →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Detalhes da Publicação & Comentários do Activity Highlight */}
      {selectedHighlight && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/80">
              <div className="flex items-center space-x-3">
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-10 h-10 rounded-full border-2 border-orange-500 object-cover"
                />
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{user.fullName}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">PRO</span>
                  </h3>
                  <p className="text-[10px] text-zinc-400">{selectedHighlight.sport} • {user.fullName}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedHighlight(null)}
                className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="overflow-y-auto no-scrollbar space-y-4 p-4 flex-1">
              {/* Publication Image Banner */}
              <div className="relative rounded-2xl overflow-hidden border border-zinc-800 max-h-64 bg-zinc-900">
                <img
                  src={selectedHighlight.imageUrl}
                  alt={selectedHighlight.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                
                {/* Metrics Overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-zinc-950/90 backdrop-blur-md p-2.5 rounded-xl border border-zinc-800/80">
                  <div className="text-center">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block">Distância</span>
                    <span className="text-xs font-black text-orange-400 font-mono">{selectedHighlight.distance}</span>
                  </div>
                  <div className="text-center border-l border-zinc-800 pl-2">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block">Ritmo</span>
                    <span className="text-xs font-black text-orange-400 font-mono">{selectedHighlight.pace}</span>
                  </div>
                  <div className="text-center border-l border-zinc-800 pl-2">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block">Duração</span>
                    <span className="text-xs font-black text-orange-400 font-mono">{selectedHighlight.duration}</span>
                  </div>
                  <div className="text-center border-l border-zinc-800 pl-2">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block">Calorias</span>
                    <span className="text-xs font-black text-orange-400 font-mono">{selectedHighlight.calories}</span>
                  </div>
                </div>
              </div>

              {/* Publication Description / Caption */}
              <div className="bg-zinc-900/70 border border-zinc-800/80 p-3.5 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider block">
                  Descrição da Publicação
                </span>
                <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                  {selectedHighlight.caption}
                </p>
              </div>

              {/* Action Buttons: Like & Share */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                <button
                  onClick={() => handleToggleLikeHighlight(selectedHighlight.id)}
                  className={`flex items-center space-x-2 text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                    selectedHighlight.isLiked
                      ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                      : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${selectedHighlight.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>
                    {selectedHighlight.isLiked ? 'Curtido' : 'Curtir'} ({selectedHighlight.likes})
                  </span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert('Link da publicação copiado com sucesso!');
                  }}
                  className="flex items-center space-x-1.5 text-xs font-bold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-2 rounded-xl transition-all"
                >
                  <Share2 className="w-4 h-4 text-orange-400" />
                  <span>Compartilhar</span>
                </button>
              </div>

              {/* Comments Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-orange-500" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Comentários ({selectedHighlight.commentsList.length})
                  </h4>
                </div>

                {/* Comments List */}
                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1 no-scrollbar">
                  {selectedHighlight.commentsList.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-2 italic text-center">
                      Nenhum comentário ainda. Seja o primeiro a comentar!
                    </p>
                  ) : (
                    selectedHighlight.commentsList.map((comm) => (
                      <div
                        key={comm.id}
                        className="p-3 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl flex items-start space-x-3"
                      >
                        <img
                          src={comm.avatar}
                          alt={comm.author}
                          onClick={() => {
                            setSelectedHighlight(null);
                            onOpenUserProfile?.({ userId: comm.id, userName: comm.author, userAvatar: comm.avatar });
                          }}
                          className="w-8 h-8 rounded-full object-cover border border-zinc-700 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                        />
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span
                              onClick={() => {
                                setSelectedHighlight(null);
                                onOpenUserProfile?.({ userId: comm.id, userName: comm.author, userAvatar: comm.avatar });
                              }}
                              className="text-xs font-bold text-white cursor-pointer hover:text-orange-400 hover:underline"
                            >
                              {comm.author}
                            </span>
                            <span className="text-[10px] text-zinc-400">{comm.timeAgo}</span>
                          </div>
                          <p className="text-xs text-zinc-300 font-normal leading-relaxed">
                            {comm.text}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer: Comment Input Form */}
            <form onSubmit={handleAddComment} className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Escreva um comentário..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-zinc-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-orange-500 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Lista de Grupos do Usuário */}
      {isClubsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-6 text-white space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-bold text-white">
                  Meus Grupos & Comunidades ({user.clubs.length})
                </h3>
              </div>
              <button
                onClick={() => setIsClubsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Clique sobre o nome do grupo para abrir a tela da comunidade e interagir com os membros.
            </p>

            <div className="space-y-2.5 max-h-72 overflow-y-auto no-scrollbar">
              {user.clubs.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500 italic border border-zinc-800/80 rounded-2xl bg-zinc-950">
                  Você ainda não participa de nenhuma comunidade. Entre na aba Desafios & Comunidades para participar!
                </div>
              ) : (
                user.clubs.map((clubName, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setIsClubsModalOpen(false);
                      if (onOpenCommunityChat) {
                        onOpenCommunityChat(clubName);
                      }
                    }}
                    className="flex items-center justify-between p-3.5 bg-zinc-950 border border-zinc-800/80 hover:border-orange-500/50 rounded-2xl cursor-pointer hover:bg-zinc-800/60 transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                        🏆
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                          {clubName}
                        </h4>
                        <div className="flex items-center space-x-2 text-[10px] text-zinc-400 mt-0.5">
                          <span className="text-orange-400/90 font-semibold">Comunidade Ativa</span>
                        </div>
                      </div>
                    </div>

                    <button className="px-3.5 py-1.5 bg-orange-500/10 group-hover:bg-orange-500 text-orange-400 group-hover:text-zinc-950 font-bold text-xs rounded-xl transition-all border border-orange-500/30">
                      Abrir
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Lista de Desafios Concluídos & Em Andamento */}
      {isCompletedChallengesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/80">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Desafios do Atleta
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    {completedCount} concluídos de {joinedCount} desafios inscritos
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCompletedChallengesModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-900/60 border-b border-zinc-800">
              <button
                onClick={() => setChallengeModalTab('completed')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  challengeModalTab === 'completed'
                    ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
                    : 'text-zinc-400 hover:text-white bg-zinc-900/80'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Concluídos ({completedCount})</span>
              </button>

              <button
                onClick={() => setChallengeModalTab('joined')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  challengeModalTab === 'joined'
                    ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
                    : 'text-zinc-400 hover:text-white bg-zinc-900/80'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Em Andamento ({inProgressChallengesList.length})</span>
              </button>
            </div>

            {/* Modal Body / Challenges List */}
            <div className="p-4 overflow-y-auto no-scrollbar space-y-3 flex-1">
              {challengeModalTab === 'completed' && (
                <>
                  {completedChallengesList.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <Trophy className="w-8 h-8 text-zinc-600 mx-auto" />
                      <p className="text-xs text-zinc-400 font-medium">
                        Nenhum desafio concluído ainda. Complete seu primeiro desafio para desbloquear troféus!
                      </p>
                    </div>
                  ) : (
                    completedChallengesList.map((item) => (
                      <div
                        key={item.id}
                        className="bg-zinc-900/90 border border-emerald-500/30 rounded-2xl p-3.5 space-y-3 relative overflow-hidden shadow-lg"
                      >
                        <div className="flex items-start justify-between relative z-10">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                              🏆 CONCLUÍDO • 100%
                            </span>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">
                              {item.title}
                            </h4>
                            <p className="text-xs font-bold text-zinc-300">
                              Meta: {item.targetValue} {item.unit}
                            </p>
                          </div>

                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1 relative z-10">
                          <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800">
                            <div className="bg-emerald-500 h-full rounded-full w-full" />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                            <span>{item.targetValue} / {item.targetValue} {item.unit}</span>
                            <span className="text-emerald-400 font-bold">+500 PTS GANHOS</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {challengeModalTab === 'joined' && (
                <>
                  {inProgressChallengesList.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <Zap className="w-8 h-8 text-zinc-600 mx-auto" />
                      <p className="text-xs text-zinc-400 font-medium">
                        Você não possui desafios em andamento no momento. Entre em novos desafios na aba Desafios!
                      </p>
                    </div>
                  ) : (
                    inProgressChallengesList.map((item) => {
                      const percent = Math.min(100, Math.round((item.currentValue / item.targetValue) * 100));

                      return (
                        <div
                          key={item.id}
                          className="bg-zinc-900/90 border border-orange-500/30 rounded-2xl p-3.5 space-y-3 relative overflow-hidden shadow-lg"
                        >
                          <div className="flex items-start justify-between relative z-10">
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-bold">
                                ⚡ INSCRITO • EM ANDAMENTO
                              </span>
                              <h4 className="text-sm font-black text-white uppercase tracking-tight">
                                {item.title}
                              </h4>
                              <p className="text-xs font-bold text-zinc-300">
                                Meta: {item.targetValue} {item.unit}
                              </p>
                            </div>

                            <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-mono text-xs font-bold flex-shrink-0">
                              {percent}%
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1 relative z-10">
                            <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800">
                              <div
                                className="bg-orange-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                              <span>{item.currentValue} / {item.targetValue} {item.unit}</span>
                              <span className="text-orange-400 font-bold">Inscrição Ativa (Irreversível)</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
