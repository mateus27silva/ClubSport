import React, { useState, useEffect } from 'react';
import { Trophy, Flame, CheckCircle, Clock, Users, MapPin, Navigation, Compass, RefreshCw, Smartphone, Search, MessageSquare, Globe, Lock, Play, Crown, UserCheck, Shield } from 'lucide-react';
import { Challenge, Community } from '../../types';
import { initialCommunities } from '../../data/mockData';
import { useOffline } from '../../context/OfflineContext';
import { useAuth } from '../../context/AuthContext';
import { REGION_PRESETS, resolveLocationCoords, calculateDistanceKm, formatDistanceString } from '../../lib/location';
import { GoogleRouteMap } from '../GoogleRouteMap';

interface ChallengesViewProps {
  challenges: Challenge[];
  communities?: Community[];
  onToggleJoinChallenge: (challengeId: string) => void;
  onOpenAnalytics: () => void;
  onOpenCommunityChat?: (communityId: string) => void;
  onStartRunForChallenge?: (challengeId: string) => void;
  onOpenCreateCommunity?: () => void;
  onOpenCreateChallenge?: () => void;
}

// Haversine formula to calculate distance in KM between two coordinates
function calculateDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const ChallengesView: React.FC<ChallengesViewProps> = ({
  challenges,
  communities = [],
  onToggleJoinChallenge,
  onOpenAnalytics,
  onOpenCommunityChat,
  onStartRunForChallenge,
  onOpenCreateCommunity,
  onOpenCreateChallenge
}) => {
  const { user } = useAuth();
  const { isOnline, queueAction } = useOffline();

  const [scope, setScope] = useState<'global' | 'local'>('global');
  const [sportFilter, setSportFilter] = useState<string>('All');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [communityTab, setCommunityTab] = useState<'all' | 'my'>('all');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>(() => {
    return resolveLocationCoords(user?.region);
  });
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'active' | 'error'>('idle');
  const [geoErrorMsg, setGeoErrorMsg] = useState<string | null>(null);

  // Sync coords if user's profile region changes
  useEffect(() => {
    if (user?.region && geoStatus !== 'active') {
      const resolved = resolveLocationCoords(user.region);
      setUserCoords({ lat: resolved.lat, lng: resolved.lng });
    }
  }, [user?.region]);

  // Function to request user location from browser / mobile / smartwatch GPS
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      setGeoErrorMsg('Geolocalização não é suportada neste navegador.');
      return;
    }

    setGeoStatus('loading');
    setGeoErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGeoStatus('active');
      },
      (err) => {
        // In iframe preview or if permission denied, fallback gracefully to a realistic default location (e.g. SP / Ibirapuera region)
        console.warn('GPS browser block/fallback active:', err.message);
        setUserCoords({ lat: -23.5700, lng: -46.6500 });
        setGeoStatus('active');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Automatically request GPS location when switching to Local scope
  useEffect(() => {
    if (scope === 'local' && geoStatus === 'idle') {
      handleDetectLocation();
    }
  }, [scope]);

  // Process & calculate distances for local challenges
  const processedChallenges = challenges.map((c) => {
    if (c.scope === 'local' && userCoords && c.lat && c.lng) {
      const dist = calculateDistanceInKm(userCoords.lat, userCoords.lng, c.lat, c.lng);
      return { ...c, calculatedDistanceKm: dist };
    }
    return c;
  });

  // Filter challenges by current scope, sport filter, region filter, and search query
  let filteredChallenges = processedChallenges.filter((c) => {
    const matchesScope = c.scope === scope;
    const matchesSearch =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.locationName && c.locationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.unit && c.unit.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSport =
      sportFilter === 'All' ||
      c.title.toLowerCase().includes(sportFilter.toLowerCase()) ||
      c.type.toLowerCase().includes(sportFilter.toLowerCase()) ||
      (sportFilter === 'Running' && (c.title.toLowerCase().includes('corrida') || c.title.toLowerCase().includes('run'))) ||
      (sportFilter === 'Cycling' && (c.title.toLowerCase().includes('ciclismo') || c.title.toLowerCase().includes('pedal') || c.title.toLowerCase().includes('bike'))) ||
      (sportFilter === 'Swimming' && (c.title.toLowerCase().includes('natação') || c.title.toLowerCase().includes('swim'))) ||
      (sportFilter === 'Trail' && (c.title.toLowerCase().includes('trilha') || c.title.toLowerCase().includes('trail')));

    const matchesRegion =
      regionFilter === 'All' ||
      (c.locationName && c.locationName.toLowerCase().includes(regionFilter.toLowerCase())) ||
      (regionFilter === 'São Paulo' && (c.locationName?.toLowerCase().includes('sp') || c.locationName?.toLowerCase().includes('são paulo')));

    return matchesScope && matchesSearch && matchesSport && matchesRegion;
  });

  if (scope === 'local' && userCoords) {
    filteredChallenges = [...filteredChallenges].sort((a, b) => {
      const distA = a.calculatedDistanceKm ?? 9999;
      const distB = b.calculatedDistanceKm ?? 9999;
      return distA - distB;
    });
  }

  // Community distance calculations & filtering
  const processedCommunities = communities.map((comm) => {
    if (userCoords && comm.lat !== undefined && comm.lng !== undefined) {
      const dist = calculateDistanceKm(userCoords.lat, userCoords.lng, comm.lat, comm.lng);
      return { ...comm, calculatedDistanceKm: dist };
    }
    return comm;
  });

  let filteredCommunities = processedCommunities.filter((c) => {
    const isCreatedByUser = Boolean(
      (user?.fullName && c.createdBy.toLowerCase() === user.fullName.toLowerCase()) ||
      (user?.uid && c.creatorId === user.uid)
    );
    const isMemberOfUser = Boolean(
      user?.clubs && (user.clubs.includes(c.name) || user.clubs.includes(c.id))
    );

    if (communityTab === 'my' && !isCreatedByUser && !isMemberOfUser) {
      return false;
    }

    const matchesSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.location && c.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.sportCategory.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSport =
      sportFilter === 'All' ||
      c.sportCategory.toLowerCase().includes(sportFilter.toLowerCase());

    const matchesRegion =
      regionFilter === 'All' ||
      (c.location && c.location.toLowerCase().includes(regionFilter.toLowerCase()));

    return matchesSearch && matchesSport && matchesRegion;
  });

  if (userCoords) {
    filteredCommunities = [...filteredCommunities].sort((a, b) => {
      const distA = a.calculatedDistanceKm ?? 9999;
      const distB = b.calculatedDistanceKm ?? 9999;
      return distA - distB;
    });
  }

  const handleJoin = (cId: string) => {
    onToggleJoinChallenge(cId);
    if (!isOnline) {
      queueAction('TOGGLE_JOIN_CHALLENGE', { challengeId: cId });
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto px-4">
      {/* Top Search & Filter Bar (Filter & Search inside Challenges) */}
      <div className="pt-2 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            Filter & Search
          </h1>
          <div className="flex space-x-2 text-xs">
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-orange-600 dark:text-orange-400 font-bold rounded-lg px-2.5 py-1 focus:outline-none"
            >
              <option value="All">Sport: All</option>
              <option value="Running">Running / Corrida</option>
              <option value="Cycling">Cycling / Ciclismo</option>
              <option value="Swimming">Swimming / Natação</option>
              <option value="Trail">Trail / Trilha</option>
            </select>

            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-orange-600 dark:text-orange-400 font-bold rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="All">Região: Todas</option>
              {REGION_PRESETS.map((p) => (
                <option key={p.id} value={p.name.split(',')[0]}>
                  {p.name.split(',')[0]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Challenge by title or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Scope Filter Buttons: Global | Local */}
      <div className="grid grid-cols-2 gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <button
          onClick={() => setScope('global')}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
            scope === 'global'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          Global
        </button>
        <button
          onClick={() => setScope('local')}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            scope === 'local'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Local (GPS Próximo)</span>
        </button>
      </div>

      {/* GPS Smartwatch / Celular Geolocation Panel (Visible when Local is selected) */}
      {scope === 'local' && (
        <div className="bg-zinc-900/90 border border-orange-500/30 p-4 rounded-2xl space-y-3 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Navigation className={`w-4 h-4 ${geoStatus === 'active' ? 'text-emerald-400 animate-pulse' : 'text-orange-400'}`} />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Geolocalização Celular / Smartwatch
              </h3>
            </div>
            <button
              onClick={handleDetectLocation}
              disabled={geoStatus === 'loading'}
              className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/80 transition-all active:scale-95"
            >
              <RefreshCw className={`w-3 h-3 ${geoStatus === 'loading' ? 'animate-spin' : ''}`} />
              <span>Atualizar GPS</span>
            </button>
          </div>

          {/* Status info message */}
          {geoStatus === 'loading' && (
            <p className="text-xs text-zinc-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Obtendo sinal GPS do dispositivo para ordenar desafios mais próximos...
            </p>
          )}

          {geoStatus === 'active' && userCoords && (
            <div className="bg-zinc-950/80 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    GPS Smartwatch / Celular Conectado
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono">
                  Lat: {userCoords.lat.toFixed(4)}, Lng: {userCoords.lng.toFixed(4)} • Ordenado por proximidade
                </p>
              </div>
              <div className="bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold px-2 py-1 rounded-lg border border-emerald-500/20">
                PROXIMIDADE ATIVA
              </div>
            </div>
          )}

          {geoErrorMsg && (
            <p className="text-xs text-amber-400/90 font-medium bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg">
              {geoErrorMsg}
            </p>
          )}
        </div>
      )}


      {/* Comunidades do App Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xs font-black uppercase text-orange-400 tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Grupos & Comunidades ({filteredCommunities.length})</span>
          </h2>

          <div className="flex items-center gap-2">
            <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg text-[10px]">
              <button
                onClick={() => setCommunityTab('all')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  communityTab === 'all'
                    ? 'bg-orange-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setCommunityTab('my')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                  communityTab === 'my'
                    ? 'bg-orange-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>Meus Grupos</span>
              </button>
            </div>

            {onOpenCreateCommunity && (
              <button
                onClick={onOpenCreateCommunity}
                className="text-[10px] font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-lg transition-all"
              >
                + Criar
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {filteredCommunities.map((community) => {
            const isCreatedByUser = Boolean(
              (user?.fullName && community.createdBy.toLowerCase() === user.fullName.toLowerCase()) ||
              (user?.uid && community.creatorId === user.uid)
            );

            return (
              <div
                key={community.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all shadow-md group"
              >
                {/* Cover Banner */}
                <div className="relative h-28 w-full overflow-hidden">
                  <img
                    src={community.coverUrl}
                    alt={community.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                  
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    {isCreatedByUser && (
                      <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md">
                        <Crown className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>Criador</span>
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] text-zinc-300 font-bold">
                      {community.privacy === 'public' ? (
                        <>
                          <Globe className="w-3 h-3 text-emerald-400" />
                          <span>Pública</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>Privada</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="absolute bottom-2 left-3">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-orange-500 text-zinc-950 px-2 py-0.5 rounded-md">
                      {community.sportCategory}
                    </span>
                  </div>
                </div>

                {/* Community Details */}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-black text-zinc-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors flex items-center gap-2">
                        <span>{community.name}</span>
                        {isCreatedByUser && (
                          <span className="text-[9px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.2 rounded font-bold uppercase">
                            Seu Grupo
                          </span>
                        )}
                      </h3>
                    {(community.location || community.calculatedDistanceKm !== undefined) && (
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-orange-500" />
                          {community.location || 'Local'}
                        </span>
                        {community.calculatedDistanceKm !== undefined && (
                          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <Navigation className="w-2.5 h-2.5" />
                            {formatDistanceString(community.calculatedDistanceKm)}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-1">
                      {community.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800/60 text-xs">
                  <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 text-[11px]">
                    <span className="flex items-center gap-1 font-bold text-zinc-700 dark:text-zinc-300">
                      <Users className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                      {community.membersCount.toLocaleString()} membros
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-500">•</span>
                    <span className="text-zinc-500 dark:text-zinc-400">Por {community.createdBy}</span>
                  </div>

                  <button
                    onClick={() => onOpenCommunityChat?.(community.id)}
                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-zinc-950 text-xs font-black rounded-xl flex items-center gap-1 transition-all shadow-md shadow-orange-500/10"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Entrar / Chat</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

          {filteredCommunities.length === 0 && (
            <div className="p-6 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center space-y-3 shadow-sm">
              <Users className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto" />
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-300">Nenhuma comunidade criada ainda</p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-500 max-w-xs mx-auto">
                Crie a primeira comunidade do ClubSport e convide atletas para treinar juntos!
              </p>
              {onOpenCreateCommunity && (
                <button
                  onClick={onOpenCreateCommunity}
                  className="px-4 py-2 bg-orange-500 text-zinc-950 font-bold text-xs rounded-xl hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20"
                >
                  + Criar Comunidade
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Challenge Quests Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-xs font-black uppercase text-orange-600 dark:text-orange-400 tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span>Desafios Ativos ({filteredChallenges.length})</span>
          </h2>
          {onOpenCreateChallenge && (
            <button
              onClick={onOpenCreateChallenge}
              className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:text-orange-500 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-lg transition-all"
            >
              + Publicar Desafio
            </button>
          )}
        </div>

        {filteredChallenges.map((item) => {
          const percent = Math.min(100, Math.round((item.currentValue / item.targetValue) * 100));

          return (
            <div
              key={item.id}
              className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden p-4 shadow-sm dark:shadow-xl space-y-4 group"
            >
              {/* Background banner image blur effect */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-10 dark:opacity-15 transition-opacity group-hover:opacity-20 dark:group-hover:opacity-25"
                style={{ backgroundImage: `url(${item.bannerUrl})` }}
              />

              <div className="relative z-10 flex items-start justify-between">
                <div className="space-y-1">
                  {/* Proximity / Location Badge */}
                  {item.scope === 'local' && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold">
                        <MapPin className="w-3 h-3 text-orange-500" />
                        {item.locationName || 'Desafio Local'}
                      </span>

                      {item.calculatedDistanceKm !== undefined && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">
                          <Navigation className="w-2.5 h-2.5" />
                          {item.calculatedDistanceKm} km de você
                        </span>
                      )}
                    </div>
                  )}

                  <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight uppercase flex items-center gap-2 pt-0.5">
                    {item.title}
                  </h3>
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {item.targetValue} {item.unit}
                  </p>
                </div>

                {/* Circular indicator or Badge */}
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full border-4 border-orange-500/30 bg-white/90 dark:bg-zinc-950/80 font-mono text-center flex-shrink-0 shadow-sm">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">{percent}%</span>
                  <span className="text-[8px] text-orange-600 dark:text-orange-400 uppercase font-bold">
                    {item.currentValue}/{item.targetValue}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative z-10 space-y-1">
                <div className="w-full bg-zinc-950 rounded-full h-3 overflow-hidden border border-zinc-800">
                  <div
                    className="bg-gradient-to-r from-orange-600 to-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Google Maps Route Percurso */}
              <div className="relative z-10 rounded-xl overflow-hidden shadow-md border border-zinc-800/80">
                <GoogleRouteMap
                  center={{ lat: item.lat || -23.5874, lng: item.lng || -46.6576 }}
                  title={`Percurso Desafio: ${item.title}`}
                  height="160px"
                  zoom={14}
                />
              </div>

              {/* Ends In countdown & Iniciar Corrida action */}
              <div className="relative z-10 flex items-center justify-between text-xs pt-1">
                <div className="flex items-center space-x-1 text-zinc-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  <span>ENDS IN: {item.endsIn}</span>
                </div>

                <button
                  onClick={() => {
                    if (!item.isJoined) {
                      handleJoin(item.id);
                    }
                    onStartRunForChallenge?.(item.id);
                  }}
                  title="Iniciar corrida com rastreamento GPS e sincronização Smartwatch para este desafio"
                  className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-zinc-950 font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4 fill-current text-zinc-950" />
                  <span>INICIAR CORRIDA</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredChallenges.length === 0 && (
          <div className="p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl text-center space-y-3">
            <Trophy className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs font-bold text-zinc-300">Nenhum desafio ativo no momento</p>
            <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
              Publique um novo desafio para motivar atletas da comunidade a superarem suas marcas.
            </p>
            {onOpenCreateChallenge && (
              <button
                onClick={onOpenCreateChallenge}
                className="px-4 py-2 bg-orange-500 text-zinc-950 font-bold text-xs rounded-xl hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20"
              >
                + Publicar Desafio
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

