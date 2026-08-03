import React, { useState, useEffect } from 'react';
import { ChevronLeft, MoreHorizontal, MessageSquare, Flame, Send, Mic, Plus, Play, Shield, Pin, UserPlus, Trash2, Crown, X, Search, Check, UserX, Star, AlertTriangle, Users } from 'lucide-react';
import { CommunityMessage, Community, CommunityMember } from '../../types';
import { initialCommunityMessages, initialCommunities } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { fetchCommunityMessages, subscribeCommunityMessages, createCommunityMessage } from '../../lib/supabase';
import { db, collection, getDocs } from '../../lib/firebase';

interface CommunityChatProps {
  communityId?: string;
  community?: Community;
  allCommunities?: Community[];
  onBack: () => void;
  onDeleteCommunity?: (communityId: string) => void;
  onUpdateCommunity?: (community: Community) => void;
  onOpenUserProfile?: (userObj: { userId: string; userName: string; userAvatar?: string }) => void;
}

export const CommunityChatView: React.FC<CommunityChatProps> = ({
  communityId = 'comm_1',
  community: propCommunity,
  allCommunities = [],
  onBack,
  onDeleteCommunity,
  onUpdateCommunity,
  onOpenUserProfile
}) => {
  const { user } = useAuth();
  const { isOnline, queueAction } = useOffline();

  // Find community object
  const currentCommunity: Community = propCommunity || allCommunities.find((c) => c.id === communityId || c.name === communityId) || {
    id: communityId,
    name: 'Corredores Paulistas',
    description: 'Comunidade oficial de corrida de rua em São Paulo. Treinos e encontros no Ibirapuera.',
    location: 'São Paulo, SP, Brasil',
    sportCategory: 'Running',
    privacy: 'public',
    membersCount: 12,
    coverUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80',
    createdBy: user?.fullName || 'Atleta ClubSport',
    creatorId: user?.uid,
    admins: user?.uid ? [user.uid] : [],
    members: [
      {
        id: user?.uid || 'usr_creator',
        name: user?.fullName || 'Atleta ClubSport',
        avatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        role: 'creator'
      },
      {
        id: 'usr_ana',
        name: 'Ana Oliveira',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        role: 'admin'
      },
      {
        id: 'usr_carlos',
        name: 'Carlos Santos',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        role: 'member'
      }
    ],
    createdAt: new Date().toISOString()
  };

  // Local community state to manage members, admins, and pinned message live
  const [activeComm, setActiveComm] = useState<Community>(currentCommunity);
  const [messages, setMessages] = useState<CommunityMessage[]>(initialCommunityMessages);
  const [inputText, setInputText] = useState<string>('');

  // Modals & Drawers
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [manageTab, setManageTab] = useState<'members' | 'add' | 'pin' | 'danger'>('members');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<{ id: string; name: string; avatar: string }[]>([]);
  const [pinInputText, setPinInputText] = useState(activeComm.pinnedMessageText || '');

  // Check user permissions
  const isCreator = Boolean(
    (user?.uid && activeComm.creatorId === user.uid) ||
    (user?.fullName && activeComm.createdBy.toLowerCase() === user.fullName.toLowerCase())
  );
  
  const isAdmin = Boolean(
    isCreator ||
    (user?.uid && activeComm.admins?.includes(user.uid)) ||
    (user?.uid && activeComm.members?.some((m) => m.id === user.uid && (m.role === 'admin' || m.role === 'creator')))
  );

  useEffect(() => {
    if (propCommunity) {
      setActiveComm(propCommunity);
      if (propCommunity.pinnedMessageText) {
        setPinInputText(propCommunity.pinnedMessageText);
      }
    }
  }, [propCommunity]);

  // Load chat messages
  useEffect(() => {
    fetchCommunityMessages(communityId).then((fetched) => {
      if (fetched.length > 0) {
        setMessages(fetched);
      }
    });

    const unsubscribe = subscribeCommunityMessages(communityId, (updated) => {
      if (updated.length > 0) {
        setMessages(updated);
      }
    });

    return () => unsubscribe();
  }, [communityId]);

  // Load registered users from Firestore for "Adicionar Membros"
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
        } else {
          // Fallback sample registered users
          setAvailableUsers([
            { id: 'usr_rodrigo', name: 'Rodrigo Lima', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
            { id: 'usr_juliana', name: 'Juliana Costa', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
            { id: 'usr_lucas', name: 'Lucas Mendes', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80' }
          ]);
        }
      } catch (err) {
        console.warn('Could not load registered users for group invite:', err);
      }
    }
    loadRegisteredUsers();
  }, []);

  const handleReactFlame = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              flameCount: m.hasReacted ? m.flameCount - 1 : m.flameCount + 1,
              hasReacted: !m.hasReacted
            }
          : m
      )
    );
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newMsg: CommunityMessage = {
      id: 'msg_' + Date.now(),
      communityId,
      userId: user?.uid || 'guest_' + Date.now(),
      userName: user?.fullName || 'Atleta ClubSport',
      userAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      text: inputText,
      repliesCount: 0,
      flameCount: 1,
      hasReacted: true,
      createdAt: 'Agora'
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    if (isOnline) {
      await createCommunityMessage(newMsg);
    } else {
      queueAction('ADD_COMMUNITY_MESSAGE', newMsg);
    }
  };

  // 1. PIN MESSAGE FEATURE
  const handlePinMessage = (msgText: string, msgId?: string) => {
    const updated = {
      ...activeComm,
      pinnedMessageId: msgId,
      pinnedMessageText: msgText
    };
    setActiveComm(updated);
    setPinInputText(msgText);
    if (onUpdateCommunity) onUpdateCommunity(updated);
    alert('📌 Mensagem fixada no topo do grupo!');
  };

  const handleUnpinMessage = () => {
    const updated = {
      ...activeComm,
      pinnedMessageId: undefined,
      pinnedMessageText: undefined
    };
    setActiveComm(updated);
    setPinInputText('');
    if (onUpdateCommunity) onUpdateCommunity(updated);
  };

  // 2. KICK MEMBER FEATURE
  const handleKickMember = (memberId: string, memberName: string) => {
    if (!confirm(`Tem certeza que deseja expulsar ${memberName} do grupo?`)) return;

    const currentMembers = activeComm.members || [];
    const updatedMembers = currentMembers.filter((m) => m.id !== memberId);
    const updatedAdmins = (activeComm.admins || []).filter((id) => id !== memberId);

    const updatedComm: Community = {
      ...activeComm,
      members: updatedMembers,
      admins: updatedAdmins,
      membersCount: Math.max(1, (activeComm.membersCount || 1) - 1)
    };

    setActiveComm(updatedComm);
    if (onUpdateCommunity) onUpdateCommunity(updatedComm);
    alert(`${memberName} foi removido(a) do grupo.`);
  };

  // 3. PROMOTE TO ADMIN FEATURE
  const handlePromoteAdmin = (memberId: string, memberName: string) => {
    if (!confirm(`Deseja tornar ${memberName} um Administrador do grupo?`)) return;

    const currentMembers = activeComm.members || [];
    const updatedMembers = currentMembers.map((m) =>
      m.id === memberId ? { ...m, role: 'admin' as const } : m
    );
    const updatedAdmins = Array.from(new Set([...(activeComm.admins || []), memberId]));

    const updatedComm: Community = {
      ...activeComm,
      members: updatedMembers,
      admins: updatedAdmins
    };

    setActiveComm(updatedComm);
    if (onUpdateCommunity) onUpdateCommunity(updatedComm);
    alert(`${memberName} agora é um Administrador do grupo! ⭐`);
  };

  // 4. ADD MEMBER FEATURE
  const handleAddMember = (u: { id: string; name: string; avatar: string }) => {
    const currentMembers = activeComm.members || [];
    if (currentMembers.some((m) => m.id === u.id || m.name === u.name)) {
      alert(`${u.name} já faz parte deste grupo.`);
      return;
    }

    const newMember: CommunityMember = {
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      role: 'member'
    };

    const updatedComm: Community = {
      ...activeComm,
      members: [...currentMembers, newMember],
      membersCount: (activeComm.membersCount || 0) + 1
    };

    setActiveComm(updatedComm);
    if (onUpdateCommunity) onUpdateCommunity(updatedComm);
    alert(`${u.name} foi adicionado(a) ao grupo com sucesso! 🎉`);
  };

  // 5. DELETE GROUP FEATURE
  const handleDeleteGroup = () => {
    if (
      !confirm(
        `⚠️ ATENÇÃO: Tem certeza que deseja EXCLUIR permanentemente a comunidade "${activeComm.name}"?\n\nEsta ação não poderá ser desfeita e todos os membros perderão o acesso ao chat.`
      )
    )
      return;

    if (onDeleteCommunity) {
      onDeleteCommunity(activeComm.id);
    } else {
      alert('Grupo excluído com sucesso.');
      onBack();
    }
  };

  const filteredAvailableUsers = availableUsers.filter((u) => {
    const query = userSearchQuery.toLowerCase();
    const isAlreadyMember = activeComm.members?.some((m) => m.id === u.id || m.name === u.name);
    return !isAlreadyMember && u.name.toLowerCase().includes(query);
  });

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-black text-white pb-20 relative">
      {/* Community Header with Admin / Creator controls */}
      <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/95 backdrop-blur-md sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-1.5 hover:bg-zinc-800 rounded-xl transition-colors">
            <ChevronLeft className="w-6 h-6 text-zinc-300" />
          </button>

          <div className="flex items-center space-x-2.5">
            <img
              src={activeComm.coverUrl}
              alt={activeComm.name}
              className="w-10 h-10 rounded-xl object-cover border border-zinc-800 shadow-sm"
            />
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-sm font-black text-white leading-tight truncate max-w-[170px] sm:max-w-[220px]">
                  {activeComm.name}
                </h1>
                {isCreator ? (
                  <span className="flex items-center gap-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                    <Crown className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    Criador
                  </span>
                ) : isAdmin ? (
                  <span className="flex items-center gap-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                    <Shield className="w-2.5 h-2.5 text-orange-400" />
                    Admin
                  </span>
                ) : null}
              </div>
              <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                <span className="font-bold text-orange-400">{activeComm.sportCategory}</span>
                <span>•</span>
                <span>{activeComm.membersCount || activeComm.members?.length || 1} membros</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Manage Group */}
        <button
          onClick={() => setIsManageModalOpen(true)}
          className="p-2 bg-zinc-900 hover:bg-zinc-800 text-orange-400 rounded-xl border border-zinc-800 transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
          title="Gerenciar Grupo"
        >
          <Shield className="w-4 h-4 text-orange-500" />
          <span className="hidden sm:inline">Gerenciar</span>
        </button>
      </div>

      {/* PINNED MESSAGE BANNER (📌 Mensagem Fixada) */}
      {activeComm.pinnedMessageText && (
        <div className="bg-gradient-to-r from-orange-500/20 via-zinc-900 to-amber-500/10 border-b border-orange-500/30 px-4 py-2.5 flex items-center justify-between text-xs backdrop-blur-md sticky top-[61px] z-20">
          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
            <div className="p-1.5 bg-orange-500/20 rounded-lg shrink-0 border border-orange-500/40">
              <Pin className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase text-orange-400 tracking-wider block">
                Mensagem Fixada
              </span>
              <p className="text-xs text-white font-medium truncate">{activeComm.pinnedMessageText}</p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={handleUnpinMessage}
              className="text-[10px] text-zinc-400 hover:text-white underline shrink-0 font-bold px-1.5 py-1"
            >
              Desafixar
            </button>
          )}
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
        {messages.map((msg) => {
          const isOwnMsg = Boolean(user && (msg.userId === user.uid || msg.userName === user.fullName));
          const isMsgPinned = activeComm.pinnedMessageText === msg.text;

          return (
            <div
              key={msg.id}
              className={`space-y-2 p-2.5 rounded-2xl transition-all ${
                isMsgPinned ? 'bg-orange-500/10 border border-orange-500/30' : ''
              }`}
            >
              {/* User Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <img
                    src={msg.userAvatar}
                    alt={msg.userName}
                    onClick={() => onOpenUserProfile?.({ userId: msg.userId, userName: msg.userName, userAvatar: msg.userAvatar })}
                    className="w-9 h-9 rounded-full object-cover border border-zinc-800 cursor-pointer hover:scale-105 transition-transform"
                  />
                  <div>
                    <h3
                      onClick={() => onOpenUserProfile?.({ userId: msg.userId, userName: msg.userName, userAvatar: msg.userAvatar })}
                      className="text-xs font-bold text-white cursor-pointer hover:text-orange-400 hover:underline flex items-center gap-1.5"
                    >
                      <span>{msg.userName}</span>
                      {isOwnMsg && (
                        <span className="text-[9px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.2 rounded-full font-bold">
                          Você
                        </span>
                      )}
                      {isMsgPinned && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-md font-bold flex items-center gap-0.5">
                          <Pin className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          Fixada
                        </span>
                      )}
                    </h3>
                    <span className="text-[10px] text-zinc-500">{msg.createdAt}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {/* Pin Option for Admins */}
                  {isAdmin && (
                    <button
                      onClick={() => handlePinMessage(msg.text, msg.id)}
                      className="text-zinc-500 hover:text-orange-400 p-1 rounded hover:bg-zinc-800 transition-colors"
                      title="Fixar Mensagem no Grupo"
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {(isOwnMsg || isAdmin) && (
                    <button
                      onClick={() => {
                        if (confirm('Deseja apagar esta mensagem?')) {
                          setMessages((prev) => prev.filter((m) => m.id !== msg.id));
                        }
                      }}
                      className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-zinc-800 transition-colors"
                      title="Excluir mensagem"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Message Body Text */}
              <p className="text-xs text-zinc-200 leading-relaxed pl-11 font-medium">{msg.text}</p>

              {/* Media Highlight Video / Photo */}
              {msg.mediaUrl && (
                <div className="ml-11 relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 max-h-56">
                  <img src={msg.mediaUrl} alt="Match highlight" className="w-full h-full object-cover" />
                  {msg.id === 'msg_1' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-12 h-12 rounded-full bg-white/90 text-zinc-950 flex items-center justify-center pl-1 shadow-xl">
                        <Play className="w-6 h-6 fill-zinc-950" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Bar: Reply & Flame Reactions */}
              <div className="ml-11 flex items-center space-x-4 pt-1">
                <button className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-900 text-zinc-300 text-xs font-semibold hover:bg-zinc-800 border border-zinc-800">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Reply</span>
                  {msg.repliesCount > 0 && (
                    <span className="text-zinc-400 ml-1">{msg.repliesCount} Replies</span>
                  )}
                </button>

                <button
                  onClick={() => handleReactFlame(msg.id)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                    msg.hasReacted
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  <Flame className={`w-3.5 h-3.5 ${msg.hasReacted ? 'fill-orange-500 text-orange-500' : ''}`} />
                  <span>{msg.flameCount}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Message Bar */}
      <div className="p-3 bg-zinc-950 border-t border-zinc-900 flex items-center space-x-2">
        <button className="p-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400">
          <Plus className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Mensagem para o grupo..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-4 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 placeholder:text-zinc-500"
          />
          <button className="absolute right-3 top-2.5 text-zinc-400 hover:text-white">
            <Mic className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleSendMessage}
          className="p-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold shadow-md shadow-orange-500/20 active:scale-95 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* GROUP MANAGEMENT MODAL ("Gerenciar Grupo & Comunidade") */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/90 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-orange-500/20 rounded-xl border border-orange-500/30 text-orange-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Gerenciar Grupo</h3>
                  <p className="text-[10px] text-zinc-400">{activeComm.name}</p>
                </div>
              </div>

              <button
                onClick={() => setIsManageModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-zinc-800 bg-zinc-900/50 p-1 text-xs font-bold overflow-x-auto no-scrollbar">
              <button
                onClick={() => setManageTab('members')}
                className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  manageTab === 'members'
                    ? 'bg-orange-500 text-zinc-950 shadow-md font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Membros ({activeComm.members?.length || activeComm.membersCount || 1})</span>
              </button>

              <button
                onClick={() => setManageTab('add')}
                className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  manageTab === 'add'
                    ? 'bg-orange-500 text-zinc-950 shadow-md font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>

              <button
                onClick={() => setManageTab('pin')}
                className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  manageTab === 'pin'
                    ? 'bg-orange-500 text-zinc-950 shadow-md font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Pin className="w-3.5 h-3.5" />
                <span>Fixado</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => setManageTab('danger')}
                  className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    manageTab === 'danger'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 font-black'
                      : 'text-zinc-500 hover:text-red-400'
                  }`}
                  title="Configurações Avançadas / Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* TAB CONTENT BODY */}
            <div className="p-4 overflow-y-auto no-scrollbar flex-1 space-y-4">
              {/* TAB 1: MEMBERS LIST & ADMIN PROMOTION / EXPULSION */}
              {manageTab === 'members' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Membros e Administradores</span>
                    <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md text-zinc-300">
                      Criador: {activeComm.createdBy}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(activeComm.members || [
                      {
                        id: user?.uid || 'usr_creator',
                        name: user?.fullName || activeComm.createdBy,
                        avatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                        role: 'creator' as const
                      }
                    ]).map((m) => {
                      const isMemberCreator = m.role === 'creator' || m.name === activeComm.createdBy;
                      const isMemberAdmin = m.role === 'admin' || activeComm.admins?.includes(m.id);

                      return (
                        <div
                          key={m.id}
                          className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <img src={m.avatar} alt={m.name} className="w-9 h-9 rounded-full object-cover border border-zinc-800" />
                            <div>
                              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>{m.name}</span>
                                {isMemberCreator ? (
                                  <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                                    <Crown className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                    Criador
                                  </span>
                                ) : isMemberAdmin ? (
                                  <span className="text-[9px] bg-orange-500/20 text-orange-400 border border-orange-500/40 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                                    <Shield className="w-2.5 h-2.5 text-orange-400" />
                                    Admin
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded">
                                    Membro
                                  </span>
                                )}
                              </h4>
                            </div>
                          </div>

                          {/* Admin / Creator Controls over Members */}
                          {isAdmin && !isMemberCreator && m.id !== user?.uid && (
                            <div className="flex items-center space-x-1.5">
                              {!isMemberAdmin && (
                                <button
                                  onClick={() => handlePromoteAdmin(m.id, m.name)}
                                  className="px-2.5 py-1 bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-zinc-950 font-bold text-[10px] rounded-lg border border-orange-500/30 transition-all flex items-center gap-1"
                                  title="Tornar Administrador"
                                >
                                  <Star className="w-3 h-3" />
                                  <span>Tornar Adm</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleKickMember(m.id, m.name)}
                                className="px-2 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white font-bold text-[10px] rounded-lg border border-red-500/30 transition-all flex items-center gap-1"
                                title="Expulsar do Grupo"
                              >
                                <UserX className="w-3 h-3" />
                                <span>Expulsar</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: ADD / INVITE MEMBERS */}
              {manageTab === 'add' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white block">Buscar Atletas Registrados</label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Nome do atleta..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                    {filteredAvailableUsers.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic text-center py-4">
                        Nenhum atleta encontrado para convidar.
                      </p>
                    ) : (
                      filteredAvailableUsers.map((u) => (
                        <div
                          key={u.id}
                          className="p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2.5">
                            <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-zinc-800" />
                            <span className="text-xs font-bold text-white">{u.name}</span>
                          </div>

                          <button
                            onClick={() => handleAddMember(u)}
                            className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1 shadow-sm"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Adicionar</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: PIN MESSAGE CONFIG */}
              {manageTab === 'pin' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white block">Mensagem Fixada no Topo do Chat</label>
                    <p className="text-[11px] text-zinc-400">
                      Esta mensagem aparecerá em destaque no topo do grupo para todos os participantes.
                    </p>
                    <textarea
                      rows={3}
                      placeholder="Escreva um aviso ou comunicado oficial..."
                      value={pinInputText}
                      onChange={(e) => setPinInputText(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePinMessage(pinInputText)}
                      disabled={!pinInputText.trim()}
                      className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <Pin className="w-4 h-4" />
                      <span>Salvar Mensagem Fixada</span>
                    </button>

                    {activeComm.pinnedMessageText && (
                      <button
                        onClick={handleUnpinMessage}
                        className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs rounded-xl border border-zinc-800 transition-all"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: DANGER ZONE (DELETE GROUP) */}
              {manageTab === 'danger' && isAdmin && (
                <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2 text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    <h4 className="text-xs font-black uppercase tracking-wider">Zona de Perigo</h4>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Excluir este grupo removerá permanentemente todos os dados, mensagens e históricos vinculados a ele. Apenas o criador ou administradores podem executar esta ação.
                  </p>

                  <button
                    onClick={handleDeleteGroup}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir Comunidade Permanentemente</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
