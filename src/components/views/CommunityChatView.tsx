import React, { useState, useEffect } from 'react';
import { ChevronLeft, MoreHorizontal, MessageSquare, Flame, Send, Mic, Plus, Play } from 'lucide-react';
import { CommunityMessage } from '../../types';
import { initialCommunityMessages } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { db, collection, onSnapshot, addDoc, handleFirestoreError, OperationType } from '../../lib/firebase';

interface CommunityChatProps {
  communityId?: string;
  onBack: () => void;
  onOpenUserProfile?: (userObj: { userId: string; userName: string; userAvatar?: string }) => void;
}

export const CommunityChatView: React.FC<CommunityChatProps> = ({ communityId = 'comm_1', onBack, onOpenUserProfile }) => {
  const { user } = useAuth();
  const { isOnline, queueAction } = useOffline();

  const [messages, setMessages] = useState<CommunityMessage[]>(initialCommunityMessages);
  const [inputText, setInputText] = useState<string>('');

  useEffect(() => {
    const messagesRef = collection(db, 'communities', communityId, 'messages');
    const unsubscribe = onSnapshot(
      messagesRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const fetchedMsgs: CommunityMessage[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<CommunityMessage, 'id'>)
          }));
          setMessages(fetchedMsgs);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `communities/${communityId}/messages`);
      }
    );
    return () => unsubscribe();
  }, [communityId]);

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
      try {
        await addDoc(collection(db, 'communities', communityId, 'messages'), newMsg);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `communities/${communityId}/messages`);
      }
    } else {
      queueAction('ADD_COMMUNITY_MESSAGE', newMsg);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-black text-white pb-20">
      {/* Community Header (Image 11) */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/90 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-1 hover:bg-zinc-800 rounded-lg">
            <ChevronLeft className="w-6 h-6 text-zinc-300" />
          </button>
          <div>
            <h1 className="text-base font-black text-white leading-tight">Chat da Comunidade</h1>
            <span className="text-xs text-zinc-400 font-medium">Comunidade ClubSport</span>
          </div>
        </div>

        <button className="p-1 text-zinc-400 hover:text-white">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Feed (Image 11) */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
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
                    className="text-xs font-bold text-white cursor-pointer hover:text-orange-400 hover:underline"
                  >
                    {msg.userName}
                  </h3>
                  <span className="text-[10px] text-zinc-500">{msg.createdAt}</span>
                </div>
              </div>

              <button className="text-zinc-600 hover:text-zinc-400">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Message Body Text */}
            <p className="text-xs text-zinc-200 leading-relaxed pl-11">{msg.text}</p>

            {/* Media Highlight Video / Photo (Image 11) */}
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

            {/* Action Bar: Reply & Flame Reactions (Image 11) */}
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
        ))}
      </div>

      {/* Input Message Bar (Image 11 bottom) */}
      <div className="p-3 bg-zinc-950 border-t border-zinc-900 flex items-center space-x-2">
        <button className="p-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400">
          <Plus className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-4 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
          />
          <button className="absolute right-3 top-2.5 text-zinc-400 hover:text-white">
            <Mic className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleSendMessage}
          className="p-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
