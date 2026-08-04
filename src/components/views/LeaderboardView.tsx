import React, { useState, useEffect } from 'react';
import { Crown, Search, Filter, MapPin, Flame, Info, Users, MessageSquare, ChevronRight, Lock, Globe } from 'lucide-react';
import { LeaderboardAthlete, Community } from '../../types';
import { initialCommunities } from '../../data/mockData';
import { db, collection, onSnapshot } from '../../lib/firebase';

interface LeaderboardViewProps {
  athletes: LeaderboardAthlete[];
  communities?: Community[];
  onOpenCommunityChat?: (communityId: string) => void;
  onOpenUserProfile?: (userObj: { userId: string; userName: string; userAvatar?: string }) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  athletes: initialPropAthletes,
  communities = [],
  onOpenCommunityChat,
  onOpenUserProfile
}) => {
  const [sportFilter, setSportFilter] = useState<string>('All');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [liveAthletes, setLiveAthletes] = useState<LeaderboardAthlete[]>(initialPropAthletes);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (!snapshot.empty) {
          const userDocs = snapshot.docs.map((docSnap) => ({
            uid: docSnap.id,
            ...docSnap.data()
          }));

          // Sort by points or totalKm descending
          userDocs.sort((a: any, b: any) => (b.points || 0) - (a.points || 0));

          const rankedAthletes: LeaderboardAthlete[] = userDocs.map((u: any, idx) => ({
            rank: idx + 1,
            uid: u.uid,
            name: u.fullName || u.displayName || 'Atleta Anônimo',
            avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            points: u.points || 0,
            distanceKm: u.totalKm || 0,
            fireBadges: Math.max(1, Math.floor((u.points || 0) / 100)),
            isCurrentUser: false
          }));

          setLiveAthletes(rankedAthletes);
        }
      },
      (err) => {
        console.warn('Could not fetch leaderboard users:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  const athletes = liveAthletes.length > 0 ? liveAthletes : initialPropAthletes;

  const filteredAthletes = athletes.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredCommunities = communities.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.sportCategory.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSport =
      sportFilter === 'All' ||
      c.sportCategory.toLowerCase().includes(sportFilter.toLowerCase());

    return matchesSearch && matchesSport;
  });

  const top1 = filteredAthletes.find((a) => a.rank === 1) || athletes[0];
  const top2 = filteredAthletes.find((a) => a.rank === 2) || athletes[1];
  const top3 = filteredAthletes.find((a) => a.rank === 3) || athletes[2];
  const remaining = filteredAthletes.filter((a) => a.rank > 3);

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto px-4">
      {/* Top Search & Filter Bar */}
      <div className="pt-2 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            Filter & Search
          </h1>
          <div className="flex space-x-2 text-xs">
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-orange-600 dark:text-orange-400 font-medium rounded-lg px-2.5 py-1 focus:outline-none"
            >
              <option value="All">Sport: All</option>
              <option value="Running">Running</option>
              <option value="Cycling">Cycling</option>
              <option value="Swimming">Swimming</option>
              <option value="Hiking">Hiking</option>
            </select>

            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-orange-600 dark:text-orange-400 font-medium rounded-lg px-2.5 py-1 focus:outline-none"
            >
              <option value="All">Region: Global</option>
              <option value="San Francisco">San Francisco</option>
              <option value="São Paulo">São Paulo</option>
              <option value="London">London</option>
            </select>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Person by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Podium Stage */}
      <div className="relative pt-6 pb-2 px-2 flex items-end justify-center space-x-3">
        {/* 2nd Place */}
        {top2 && (
          <div
            onClick={() => onOpenUserProfile?.({ userId: top2.uid, userName: top2.name, userAvatar: top2.avatarUrl })}
            className="flex flex-col items-center flex-1 cursor-pointer group"
          >
            <img
              src={top2.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt={top2.name}
              className="w-14 h-14 rounded-full border-2 border-orange-500 object-cover shadow-lg mb-1 group-hover:scale-105 transition-transform"
            />
            <span className="text-xs font-bold text-zinc-900 dark:text-white text-center truncate w-full group-hover:text-orange-500 dark:group-hover:text-orange-400">{top2.name}</span>
            <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono">{top2.points} Points</span>
            <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono mb-2">{top2.distanceKm} KM</span>
            {/* 2nd Step Cylinder */}
            <div className="w-full h-24 bg-gradient-to-t from-orange-600 to-orange-500 rounded-t-xl flex items-center justify-center font-black text-2xl text-zinc-950 shadow-inner">
              2
            </div>
          </div>
        )}

        {/* 1st Place (Center & Tallest) */}
        {top1 && (
          <div
            onClick={() => onOpenUserProfile?.({ userId: top1.uid, userName: top1.name, userAvatar: top1.avatarUrl })}
            className="flex flex-col items-center flex-1 -mt-4 z-10 cursor-pointer group"
          >
            <Crown className="w-6 h-6 text-amber-400 animate-bounce mb-1" />
            <img
              src={top1.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt={top1.name}
              className="w-16 h-16 rounded-full border-4 border-amber-400 object-cover shadow-xl mb-1 group-hover:scale-105 transition-transform"
            />
            <span className="text-xs font-black text-zinc-900 dark:text-white text-center truncate w-full group-hover:text-orange-500 dark:group-hover:text-orange-400">{top1.name}</span>
            <span className="text-[10px] text-orange-600 dark:text-orange-400 font-mono font-bold">{top1.points} Points</span>
            <span className="text-[10px] text-zinc-600 dark:text-zinc-300 font-mono mb-2">{top1.distanceKm} KM</span>
            {/* 1st Step Cylinder */}
            <div className="w-full h-32 bg-gradient-to-t from-orange-600 to-amber-500 rounded-t-xl flex items-center justify-center font-black text-3xl text-zinc-950 shadow-lg">
              1
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {top3 && (
          <div
            onClick={() => onOpenUserProfile?.({ userId: top3.uid, userName: top3.name, userAvatar: top3.avatarUrl })}
            className="flex flex-col items-center flex-1 cursor-pointer group"
          >
            <img
              src={top3.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt={top3.name}
              className="w-14 h-14 rounded-full border-2 border-orange-500 object-cover shadow-lg mb-1 group-hover:scale-105 transition-transform"
            />
            <span className="text-xs font-bold text-zinc-900 dark:text-white text-center truncate w-full group-hover:text-orange-500 dark:group-hover:text-orange-400">{top3.name}</span>
            <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono">{top3.points} Points</span>
            <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono mb-2">{top3.distanceKm} KM</span>
            {/* 3rd Step Cylinder */}
            <div className="w-full h-20 bg-gradient-to-t from-orange-600 to-orange-500 rounded-t-xl flex items-center justify-center font-black text-2xl text-zinc-950 shadow-inner">
              3
            </div>
          </div>
        )}
      </div>

      {/* Info Banner Box (Image 4) */}
      <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-xl flex items-start space-x-2.5 text-xs text-orange-700 dark:text-orange-300">
        <Info className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
        <p className="leading-snug">
          Only Top 10 regional influencers can propose challenges, pending Admin approval.
        </p>
      </div>

      {/* Top 10 Influencers List (Image 4) */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-400 tracking-wider">
          Top 10 Influencers
        </h2>

        <div className="space-y-2">
          {remaining.map((item) => {
            const isCurrentUser = item.isCurrentUser;

            return (
              <div
                key={item.uid}
                onClick={() => onOpenUserProfile?.({ userId: item.uid, userName: item.name, userAvatar: item.avatarUrl })}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer hover:border-orange-500/60 ${
                  isCurrentUser
                    ? 'bg-orange-500 text-zinc-950 font-bold border-orange-400 shadow-lg shadow-orange-500/20'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-6 font-mono font-black text-center ${isCurrentUser ? 'text-zinc-950' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {item.rank}
                  </span>
                  <img
                    src={item.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                    alt={item.name}
                    className="w-10 h-10 rounded-full object-cover border border-zinc-300 dark:border-zinc-700"
                  />
                  <div>
                    <span className="text-xs font-bold block">{item.name}</span>
                    <span className={`text-[10px] ${isCurrentUser ? 'text-zinc-900' : 'text-zinc-600 dark:text-zinc-400'}`}>
                      {item.points} Points | {item.distanceKm} KM | {item.fireBadges}x 🔥
                    </span>
                  </div>
                </div>

                {isCurrentUser && (
                  <span className="text-[10px] bg-zinc-950 text-orange-400 px-2 py-0.5 rounded-full uppercase font-bold">
                    You
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
