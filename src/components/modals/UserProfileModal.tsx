import React, { useState } from 'react';
import {
  X,
  MapPin,
  Flame,
  Trophy,
  Activity,
  UserPlus,
  UserCheck,
  MessageCircle,
  Share2,
  Award,
  Zap,
  CheckCircle,
  Users,
  Send,
  Heart,
  Shield,
  Clock
} from 'lucide-react';
import { ActivityPost, Community, Challenge } from '../../types';
import { useAuth } from '../../context/AuthContext';

export interface TargetUserProfileInfo {
  userId: string;
  userName: string;
  userAvatar?: string;
  bio?: string;
  sport?: string;
  clubs?: string[];
  totalKm?: number;
  points?: number;
  primarySport?: string;
  region?: string;
}

interface UserProfileModalProps {
  targetUser: TargetUserProfileInfo | null;
  onClose: () => void;
  activities?: ActivityPost[];
  communities?: Community[];
  challenges?: Challenge[];
  onOpenCommunityChat?: (communityId?: string) => void;
}

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

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  targetUser,
  onClose,
  activities = [],
  communities = [],
  challenges = [],
  onOpenCommunityChat
}) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isClubsModalOpen, setIsClubsModalOpen] = useState(false);
  const [isCompletedChallengesModalOpen, setIsCompletedChallengesModalOpen] = useState(false);
  const [challengeModalTab, setChallengeModalTab] = useState<'completed' | 'joined'>('completed');
  const [selectedHighlight, setSelectedHighlight] = useState<HighlightItem | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  if (!targetUser) return null;

  const handleToggleFollow = () => {
    setIsFollowing((prev) => {
      const nextState = !prev;
      setFollowersCount((count) => (nextState ? count + 1 : count - 1));
      return nextState;
    });
  };

  // Find posts by this specific user in global activities state
  const userPosts = activities.filter(
    (act) => act && (act.userId === targetUser?.userId || act.userName?.toLowerCase() === targetUser?.userName?.toLowerCase())
  );

  // Calculate target user communities
  const targetUserCommunitiesMap = new Map<string, Community>();

  (communities || []).forEach((c) => {
    const isCreator = Boolean(
      (targetUser?.userId && c.creatorId === targetUser.userId) ||
      (targetUser?.userName && c.createdBy?.toLowerCase() === targetUser.userName.toLowerCase())
    );
    const isMember = Boolean(
      c.members?.some(
        (m) =>
          (targetUser?.userId && m.id === targetUser.userId) ||
          (targetUser?.userName && m.name?.toLowerCase() === targetUser.userName.toLowerCase())
      )
    );
    const isAdmin = Boolean(targetUser?.userId && c.admins?.includes(targetUser.userId));
    const isInClubsArray = Boolean(
      targetUser?.clubs?.some(
        (clubNameOrId) => clubNameOrId === c.name || clubNameOrId === c.id
      )
    );

    if (isCreator || isMember || isAdmin || isInClubsArray) {
      targetUserCommunitiesMap.set(c.id, c);
    }
  });

  const userClubsList = Array.from(targetUserCommunitiesMap.values());
  const matchedNames = new Set(userClubsList.map((c) => c.name));

  (targetUser?.clubs || []).forEach((clubNameOrId) => {
    if (!matchedNames.has(clubNameOrId) && !targetUserCommunitiesMap.has(clubNameOrId)) {
      userClubsList.push({
        id: clubNameOrId,
        name: clubNameOrId,
        description: 'Grupo Ativo no ClubSport',
        sportCategory: 'Running',
        privacy: 'public',
        membersCount: 1,
        coverUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=400&q=80',
        createdBy: targetUser?.userName || 'Atleta',
        createdAt: new Date().toISOString()
      });
    }
  });

  const targetUserChallengeIds = new Set(
    userPosts.map((act) => act.challengeId).filter(Boolean)
  );

  const joinedChallenges = (challenges || []).filter(
    (c) => c.isJoined || targetUserChallengeIds.has(c.id)
  );

  const completedChallenges = joinedChallenges.filter(
    (c) => c.status === 'completed' || (c.currentValue || 0) >= (c.targetValue || 0)
  );

  const calculatedTotalKm = userPosts.reduce((sum, act) => sum + (act.distanceKm || 0), 0) + (targetUser?.totalKm || 0);
  const userXp = Math.round(calculatedTotalKm * 10) + (targetUser?.points || 0);
  const userLevel = Math.max(1, Math.floor(userXp / 1000) + 1);
  const xpInCurrentLevel = userXp % 1000;

  // Map userPosts to HighlightItem
  const displayHighlights: HighlightItem[] = userPosts.map((act) => ({
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

  const handleToggleLikeHighlight = (hlId: string) => {
    if (selectedHighlight && selectedHighlight.id === hlId) {
      const nextIsLiked = !selectedHighlight.isLiked;
      const nextLikes = nextIsLiked ? selectedHighlight.likes + 1 : selectedHighlight.likes - 1;
      setSelectedHighlight({ ...selectedHighlight, isLiked: nextIsLiked, likes: nextLikes });
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedHighlight) return;

    const newComment = {
      id: `c_${Date.now()}`,
      author: user?.fullName ? `Você (${user.fullName})` : 'Você',
      avatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
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
    <div className="fixed inset-0 z-50 bg-black/70 dark:bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden text-zinc-900 dark:text-white shadow-2xl relative">
        
        {/* Top Header Controls (Same style header bar as ProfileView) */}
        <div className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-md px-4 py-3 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Profile</h1>
            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
              {targetUser.userName}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700/50 transition-colors"
            title="Fechar Perfil"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Main Profile Body (Identical layout to ProfileView) */}
        <div className="overflow-y-auto space-y-6 p-4 pb-8 scrollbar-thin">

          {/* Profile Card Info */}
          <div className="flex flex-col items-center text-center space-y-3 pt-2">
            <div className="relative">
              <div className="w-28 h-28 rounded-full border-4 border-orange-500 p-1 bg-white dark:bg-zinc-950 shadow-xl shadow-orange-500/10">
                <img
                  src={
                    targetUser.userAvatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={targetUser.userName}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="absolute bottom-0 right-1 bg-white text-zinc-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-md border border-zinc-300">
                Pro
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white">{targetUser.userName}</h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                {targetUser.primarySport || 'Atleta'} • {targetUser.region || 'Comunidade ClubSport'}
              </p>

              <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-2 max-w-xs leading-relaxed">
                {targetUser.bio || 'Atleta participante da comunidade ClubSport.'}
              </p>
            </div>

            {/* Action buttons (Follow / Message / Share) */}
            <div className="flex items-center space-x-2 pt-2 w-full max-w-xs justify-center">
              <button
                onClick={handleToggleFollow}
                className={`flex-1 py-2.5 px-4 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all ${
                  isFollowing
                    ? 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700'
                    : 'bg-orange-500 hover:bg-orange-600 text-zinc-950 shadow-orange-500/10'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    <span>Seguindo</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Seguir Atleta</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onOpenCommunityChat) onOpenCommunityChat();
                }}
                className="py-2.5 px-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                title="Enviar Mensagem"
              >
                <MessageCircle className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                <span>Mensagem</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  alert(`Link do perfil de ${targetUser.userName} copiado!`);
                }}
                className="py-2.5 px-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                title="Compartilhar Perfil"
              >
                <Share2 className="w-4 h-4 text-orange-500" />
                <span>Compartilhar</span>
              </button>
            </div>
          </div>

          {/* Clubs & Stats Row (Identical layout to ProfileView) */}
          <div className="grid grid-cols-3 gap-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
            {/* Clubs Column */}
            <div
              onClick={() => setIsClubsModalOpen(true)}
              className="cursor-pointer group/clubs p-1 -m-1 rounded-xl hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-all border border-transparent hover:border-orange-500/30"
              title="Clique para ver os grupos deste atleta"
            >
              <span className="text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-400 block mb-1 group-hover/clubs:text-orange-500 dark:group-hover/clubs:text-orange-400 transition-colors">
                CLUBS ({userClubsList.length})
              </span>
              <div className="flex items-center space-x-2">
                <div className="text-xl font-black text-orange-500 font-mono">
                  {userClubsList.length}
                </div>
                <div className="flex -space-x-1.5 overflow-hidden">
                  {userClubsList.slice(0, 4).map((club, idx) => (
                    <img
                      key={club.id || idx}
                      src={club.coverUrl || 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=100&q=80'}
                      alt={club.name}
                      title={club.name}
                      className="w-6 h-6 rounded-full object-cover border border-zinc-300 dark:border-zinc-900 shadow"
                    />
                  ))}
                </div>
              </div>
              <span className="text-[9px] text-zinc-500 dark:text-zinc-400 block mt-1 underline decoration-zinc-400 dark:decoration-zinc-600 group-hover/clubs:text-orange-500 dark:group-hover/clubs:text-orange-300">
                Ver grupos →
              </span>
            </div>

            {/* Total KM */}
            <div className="border-l border-zinc-200 dark:border-zinc-800 pl-3">
              <span className="text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-400 block">Total KM</span>
              <div className="text-xl font-black text-orange-500 font-mono tracking-tight">
                {calculatedTotalKm.toFixed(1)}
              </div>
              <span className="text-[9px] text-zinc-500 dark:text-zinc-400 block truncate" title="Soma acumulada de atividades">
                KM CONCLUÍDOS
              </span>
            </div>

            {/* Desafios Concluídos vs Inscritos */}
            <div
              onClick={() => setIsCompletedChallengesModalOpen(true)}
              className="border-l border-zinc-200 dark:border-zinc-800 pl-3 cursor-pointer group/challenges hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40 p-1 -m-1 rounded-xl transition-all"
              title="Clique para ver lista de desafios concluídos e em andamento"
            >
              <span className="text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-400 block group-hover/challenges:text-orange-500 dark:group-hover/challenges:text-orange-400">
                DESAFIOS
              </span>
              <div className="text-xl font-black text-orange-500 font-mono tracking-tight flex items-baseline gap-1">
                <span>{completedChallenges.length}/{joinedChallenges.length}</span>
              </div>
              <span className="text-[9px] text-zinc-500 dark:text-zinc-400 block truncate group-hover/challenges:text-orange-500 dark:group-hover/challenges:text-orange-300 underline decoration-zinc-400 dark:decoration-zinc-600">
                CONCLUÍDOS / ENTROU →
              </span>
            </div>
          </div>

          {/* Activity Highlights / Publicações Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-orange-500" />
                <span>Publicações do Atleta ({displayHighlights.length})</span>
              </h3>
            </div>

            {displayHighlights.length === 0 ? (
              <div className="p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl text-center space-y-2">
                <Activity className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs font-bold text-zinc-300">Nenhuma publicação</p>
                <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                  Este atleta ainda não compartilhou treinos ou fotos na comunidade.
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

          {/* Nível & Progresso do Atleta Section */}
          <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Nível {userLevel} • Atleta</span>
              </span>
              <span className="font-mono text-[10px] text-orange-400 font-bold">{xpInCurrentLevel} / 1.000 XP</span>
            </div>

            <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800">
              <div
                className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, (xpInCurrentLevel / 1000) * 100))}%` }}
              />
            </div>
          </div>

          {/* Conquistas & Selos Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-orange-500" />
              <span>Conquistas & Selos</span>
            </h3>

            {calculatedTotalKm > 0 || displayHighlights.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-900/70 border border-orange-500/20 p-2.5 rounded-xl flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Primeiro Treino</span>
                    <span className="text-[9px] text-zinc-400 block">Comunidade ClubSport</span>
                  </div>
                </div>

                {calculatedTotalKm >= 10 && (
                  <div className="bg-zinc-900/70 border border-amber-500/20 p-2.5 rounded-xl flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">10+ KM</span>
                      <span className="text-[9px] text-zinc-400 block">Marca Alcançada</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic p-3 text-center bg-zinc-900/40 rounded-xl border border-zinc-800/60">
                Nenhuma conquista registrada ainda.
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Modal: Detalhes da Publicação do Atleta */}
      {selectedHighlight && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80">
              <div className="flex items-center space-x-3">
                <img
                  src={targetUser.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                  alt={targetUser.userName}
                  className="w-10 h-10 rounded-full border-2 border-orange-500 object-cover"
                />
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <span>{targetUser.userName}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">PRO</span>
                  </h3>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{selectedHighlight.sport} • ClubSport Elite</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedHighlight(null)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="overflow-y-auto space-y-4 p-4 flex-1 no-scrollbar">
              {/* Publication Image Banner */}
              <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 max-h-64 bg-zinc-100 dark:bg-zinc-900">
                <img
                  src={selectedHighlight.imageUrl}
                  alt={selectedHighlight.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                
                {/* Metrics Overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/80 dark:bg-zinc-950/90 backdrop-blur-md p-2.5 rounded-xl border border-white/10 dark:border-zinc-800/80 text-white">
                  <div className="text-center">
                    <span className="text-[9px] uppercase font-bold text-zinc-300 dark:text-zinc-400 block">Distância</span>
                    <span className="text-xs font-black text-orange-400 font-mono">{selectedHighlight.distance}</span>
                  </div>
                  <div className="text-center border-l border-white/10 dark:border-zinc-800 pl-2">
                    <span className="text-[9px] uppercase font-bold text-zinc-300 dark:text-zinc-400 block">Ritmo</span>
                    <span className="text-xs font-black text-orange-400 font-mono">{selectedHighlight.pace}</span>
                  </div>
                  <div className="text-center border-l border-white/10 dark:border-zinc-800 pl-2">
                    <span className="text-[9px] uppercase font-bold text-zinc-300 dark:text-zinc-400 block">Duração</span>
                    <span className="text-xs font-black text-orange-400 font-mono">{selectedHighlight.duration}</span>
                  </div>
                  <div className="text-center border-l border-white/10 dark:border-zinc-800 pl-2">
                    <span className="text-[9px] uppercase font-bold text-zinc-300 dark:text-zinc-400 block">Calorias</span>
                    <span className="text-xs font-black text-orange-400 font-mono">{selectedHighlight.calories}</span>
                  </div>
                </div>
              </div>

              {/* Publication Description / Caption */}
              <div className="bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800/80 p-3.5 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-500 uppercase tracking-wider block">
                  Descrição da Publicação
                </span>
                <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed font-medium">
                  {selectedHighlight.caption}
                </p>
              </div>

              {/* Action Buttons: Like & Share */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-200 dark:border-zinc-800/80">
                <button
                  onClick={() => handleToggleLikeHighlight(selectedHighlight.id)}
                  className={`flex items-center space-x-2 text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                    selectedHighlight.isLiked
                      ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
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
                  className="flex items-center space-x-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-xl transition-all"
                >
                  <Share2 className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                  <span>Compartilhar</span>
                </button>
              </div>

              {/* Comments Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-orange-500" />
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                    Comentários ({selectedHighlight.commentsList.length})
                  </h4>
                </div>

                {/* Comments List */}
                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1 no-scrollbar">
                  {selectedHighlight.commentsList.length === 0 ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 py-2 italic text-center">
                      Nenhum comentário ainda. Seja o primeiro a comentar!
                    </p>
                  ) : (
                    selectedHighlight.commentsList.map((comm) => (
                      <div
                        key={comm.id}
                        className="p-3 bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl flex items-start space-x-3"
                      >
                        <img
                          src={comm.avatar}
                          alt={comm.author}
                          className="w-8 h-8 rounded-full object-cover border border-zinc-300 dark:border-zinc-700 flex-shrink-0"
                        />
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-900 dark:text-white">{comm.author}</span>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{comm.timeAgo}</span>
                          </div>
                          <p className="text-xs text-zinc-700 dark:text-zinc-300 font-normal leading-relaxed">
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
            <form onSubmit={handleAddComment} className="p-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Escreva um comentário..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-orange-500 text-white dark:text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Lista de Grupos do Atleta */}
      {isClubsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 text-zinc-900 dark:text-white space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Grupos & Comunidades ({userClubsList.length})
                </h3>
              </div>
              <button
                onClick={() => setIsClubsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Grupos dos quais {targetUser.userName} faz parte na comunidade ClubSport.
            </p>

            <div className="space-y-2.5 max-h-72 overflow-y-auto no-scrollbar">
              {userClubsList.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500 italic border border-zinc-200 dark:border-zinc-800/80 rounded-2xl bg-zinc-50 dark:bg-zinc-950">
                  Este atleta ainda não participa de nenhuma comunidade.
                </div>
              ) : (
                userClubsList.map((club) => (
                  <div
                    key={club.id}
                    onClick={() => {
                      setIsClubsModalOpen(false);
                      onClose();
                      if (onOpenCommunityChat) {
                        onOpenCommunityChat(club.id);
                      }
                    }}
                    className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 hover:border-orange-500/50 rounded-2xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all group"
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <img
                        src={club.coverUrl || 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=100&q=80'}
                        alt={club.name}
                        className="w-10 h-10 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800 group-hover:scale-105 transition-transform shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors truncate">
                          {club.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          <span className="text-orange-600 dark:text-orange-400 font-semibold">{club.sportCategory || 'Comunidade'}</span>
                          <span>•</span>
                          <span>{club.membersCount || club.members?.length || 1} membros</span>
                        </div>
                      </div>
                    </div>

                    <button className="px-3.5 py-1.5 bg-orange-500/10 group-hover:bg-orange-500 text-orange-600 dark:text-orange-400 group-hover:text-white dark:group-hover:text-zinc-950 font-bold text-xs rounded-xl transition-all border border-orange-500/30 shrink-0">
                      Ver Chat →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Lista de Desafios do Atleta (Concluídos & Em Andamento) */}
      {isCompletedChallengesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                    Desafios do Atleta
                  </h3>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {completedChallenges.length} concluídos de {joinedChallenges.length} desafios inscritos
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCompletedChallengesModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-100/80 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setChallengeModalTab('completed')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  challengeModalTab === 'completed'
                    ? 'bg-orange-500 text-white dark:text-zinc-950 shadow-md shadow-orange-500/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Concluídos ({completedChallenges.length})</span>
              </button>

              <button
                onClick={() => setChallengeModalTab('joined')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  challengeModalTab === 'joined'
                    ? 'bg-orange-500 text-white dark:text-zinc-950 shadow-md shadow-orange-500/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Em Andamento ({joinedChallenges.length})</span>
              </button>
            </div>

            {/* Modal Body / Challenges List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 no-scrollbar">
              {challengeModalTab === 'completed' && (
                completedChallenges.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <Trophy className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto" />
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                      Nenhum desafio concluído ainda. Complete seu primeiro desafio para desbloquear troféus!
                    </p>
                  </div>
                ) : (
                  completedChallenges.map((item) => (
                    <div
                      key={item.id}
                      className="bg-emerald-50/60 dark:bg-zinc-900/90 border border-emerald-500/30 rounded-2xl p-3.5 space-y-3 relative overflow-hidden shadow-sm"
                    >
                      <div className="flex items-start justify-between relative z-10">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            🏆 CONCLUÍDO • 100%
                          </span>
                          <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                            {item.title}
                          </h4>
                          <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            Meta: {item.targetValue} {item.unit}
                          </p>
                        </div>

                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="space-y-1 relative z-10">
                        <div className="w-full bg-zinc-200 dark:bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-300 dark:border-zinc-800">
                          <div className="bg-emerald-500 h-full rounded-full w-full" />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                          <span>{item.targetValue} / {item.targetValue} {item.unit}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">+500 PTS GANHOS</span>
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}

              {challengeModalTab === 'joined' && (
                joinedChallenges.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <Zap className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto" />
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                      Este atleta não possui desafios em andamento no momento.
                    </p>
                  </div>
                ) : (
                  joinedChallenges.map((item) => {
                    const percent = Math.min(100, Math.round((item.currentValue / item.targetValue) * 100));
                    return (
                      <div
                        key={item.id}
                        className="bg-orange-50/60 dark:bg-zinc-900/90 border border-orange-500/30 rounded-2xl p-3.5 space-y-3 relative overflow-hidden shadow-sm"
                      >
                        <div className="flex items-start justify-between relative z-10">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold">
                              ⚡ INSCRITO • EM ANDAMENTO
                            </span>
                            <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                              {item.title}
                            </h4>
                            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                              Meta: {item.targetValue} {item.unit}
                            </p>
                          </div>

                          <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-600 dark:text-orange-400 font-mono text-xs font-bold flex-shrink-0">
                            {percent}%
                          </div>
                        </div>

                        <div className="space-y-1 relative z-10">
                          <div className="w-full bg-zinc-200 dark:bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-300 dark:border-zinc-800">
                            <div
                              className="bg-orange-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                            <span>{item.currentValue} / {item.targetValue} {item.unit}</span>
                            <span className="text-orange-600 dark:text-orange-400 font-bold">Inscrição Ativa</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
