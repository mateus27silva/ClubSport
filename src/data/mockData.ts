import { UserProfile, ActivityPost, Challenge, Community, CommunityMessage, LeaderboardAthlete, AuditLog, NotificationItem } from '../types';

export const initialCurrentUser: UserProfile = {
  uid: 'user_mateus_001',
  fullName: 'Mateus Silva',
  username: '@mateus_silva',
  email: 'eng.mateusgsilva@gmail.com',
  bio: 'Passionate long-distance runner, cyclist and community builder. Sharing my sports evolution with ClubSport!',
  primarySport: 'Running',
  region: 'São Paulo, SP, Brasil',
  role: 'admin',
  totalKm: 3400,
  activeDays: 150,
  points: 3250,
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  isPro: true,
  clubs: ['Running Club', 'Triathlon Team', 'Cycling Group'],
  createdAt: new Date().toISOString()
};

export const initialLiveChallengesUsers = [
  { id: 'c1', name: 'City Run', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', sport: 'Running' },
  { id: 'c2', name: 'Spin Class', avatar: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=200&q=80', sport: 'Spin Class' },
  { id: 'c3', name: 'Daily Hike', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', sport: 'Hiking' },
  { id: 'c4', name: 'Yoga Flow', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', sport: 'Yoga' },
  { id: 'c5', name: 'HIIT Burn', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80', sport: 'HIIT' },
];

export const initialActivities: ActivityPost[] = [
  {
    id: 'act_101',
    userId: 'user_mateus_001',
    userName: 'Mateus Silva',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    timeAgo: '2h ago',
    sport: 'Running',
    title: 'Treino de Corrida no Parque Ibirapuera',
    distanceKm: 10.2,
    timeMinutes: 52.5,
    pace: '5:08 /km',
    calories: 680,
    hasMap: true,
    likesCount: 2400,
    isLiked: true,
    commentsCount: 120,
    caption: "Corrida matinal fantástica no Ibirapuera! Ritmo constante. #ClubSport #Ibirapuera",
    lat: -23.5874,
    lng: -46.6576,
    locationName: 'Parque do Ibirapuera, SP',
    comments: [
      { id: 'cm_1', userId: 'u_sarah', userName: 'Sarah P.', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', text: 'Ritmo incrível Mateus! Continue assim! 🚀', createdAt: '1h ago' },
      { id: 'cm_2', userId: 'u_carlos', userName: 'Carlos R.', userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', text: 'A volta no lago estava plana hoje?', createdAt: '30m ago' }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'act_102',
    userId: 'user_ana_002',
    userName: 'Ana Costa',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    timeAgo: '2h ago',
    sport: 'HIIT',
    title: 'Treino Funcional & Musculação na Vila Madalena',
    distanceKm: 0,
    timeMinutes: 60,
    pace: 'N/A',
    calories: 450,
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    hasMap: false,
    likesCount: 890,
    isLiked: false,
    commentsCount: 34,
    caption: 'Série pesada de agachamento e terra! 🏋️‍♀️ #GymLife #ClubSport',
    lat: -23.5535,
    lng: -46.6896,
    locationName: 'Vila Madalena, SP',
    comments: [],
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'act_103',
    userId: 'user_liam_003',
    userName: 'Liam J.',
    userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    timeAgo: '4h ago',
    sport: 'Cycling',
    title: 'Pedal na Orla de Copacabana',
    distanceKm: 42.0,
    timeMinutes: 95,
    pace: '26.5 km/h',
    calories: 980,
    imageUrl: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=800&q=80',
    hasMap: true,
    likesCount: 1420,
    isLiked: false,
    commentsCount: 56,
    caption: 'Vento do mar e visual espetacular no Rio! 🚴‍♂️',
    lat: -22.9711,
    lng: -43.1825,
    locationName: 'Copacabana, Rio de Janeiro',
    comments: [],
    createdAt: new Date(Date.now() - 14400000).toISOString()
  }
];

export const initialChallenges: Challenge[] = [
  {
    id: 'ch_1',
    title: 'GLOBAL DISTANCE QUEST',
    type: 'distance',
    scope: 'global',
    targetValue: 75,
    currentValue: 60,
    unit: 'KM',
    endsIn: '05D 12H 30M',
    joinedUsersCount: 14250,
    bannerUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    isJoined: true
  },
  {
    id: 'ch_2',
    title: 'COMMUNITY CALORIE BURN',
    type: 'calories',
    scope: 'global',
    targetValue: 5000,
    currentValue: 2500,
    unit: 'KCAL',
    endsIn: '12D 04H 15M',
    joinedUsersCount: 8920,
    bannerUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    isJoined: true
  },
  {
    id: 'ch_3',
    title: 'WEEKLY CYCLING SPRINT',
    type: 'sprint',
    scope: 'local',
    targetValue: 200,
    currentValue: 120,
    unit: 'KM IN 7 DAYS',
    endsIn: '03D 08H 45M',
    joinedUsersCount: 3410,
    bannerUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    isJoined: false,
    lat: -23.5874,
    lng: -46.6576,
    locationName: 'Parque do Ibirapuera'
  },
  {
    id: 'ch_4',
    title: 'CIRCUITO URBANO VILA MADALENA',
    type: 'distance',
    scope: 'local',
    targetValue: 10,
    currentValue: 4,
    unit: 'KM RUN',
    endsIn: '02D 14H 10M',
    joinedUsersCount: 1850,
    bannerUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    isJoined: false,
    lat: -23.5535,
    lng: -46.6896,
    locationName: 'Vila Madalena Run Hub'
  },
  {
    id: 'ch_5',
    title: 'DESAFIO DA MONTANHA & TRL',
    type: 'distance',
    scope: 'local',
    targetValue: 15,
    currentValue: 2,
    unit: 'KM TRAIL',
    endsIn: '06D 18H 00M',
    joinedUsersCount: 920,
    bannerUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    isJoined: false,
    lat: -23.4500,
    lng: -46.6333,
    locationName: 'Pico do Jaraguá Trail'
  },
  {
    id: 'ch_c1',
    title: 'MEIA MARATONA DE RITMO 21K',
    type: 'distance',
    scope: 'global',
    targetValue: 21,
    currentValue: 21,
    unit: 'KM',
    endsIn: 'CONCLUÍDO',
    joinedUsersCount: 18400,
    bannerUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    status: 'completed',
    isJoined: true
  },
  {
    id: 'ch_c2',
    title: 'DESAFIO 100K PEDAL URBANO',
    type: 'sprint',
    scope: 'global',
    targetValue: 100,
    currentValue: 100,
    unit: 'KM',
    endsIn: 'CONCLUÍDO',
    joinedUsersCount: 9200,
    bannerUrl: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=800&q=80',
    status: 'completed',
    isJoined: true
  },
  {
    id: 'ch_c3',
    title: 'TRAVESSIA AQUÁTICA 5K',
    type: 'distance',
    scope: 'local',
    targetValue: 5,
    currentValue: 5,
    unit: 'KM SWIM',
    endsIn: 'CONCLUÍDO',
    joinedUsersCount: 1200,
    bannerUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80',
    status: 'completed',
    isJoined: true,
    lat: -23.5700,
    lng: -46.6500,
    locationName: 'Piscina Olímpica SP'
  }
];

export const initialLeaderboard: LeaderboardAthlete[] = [
  { rank: 1, uid: 'u_liam', name: 'Liam J.', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80', points: 7300, distanceKm: 55, fireBadges: 5, isInfluencer: true },
  { rank: 2, uid: 'u_sarah', name: 'Sarah P.', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', points: 3400, distanceKm: 23, fireBadges: 2, isInfluencer: true },
  { rank: 3, uid: 'u_carlos', name: 'Carlos R.', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', points: 2200, distanceKm: 36, fireBadges: 1, isInfluencer: true },
  { rank: 4, uid: 'u_emily', name: 'Emily W.', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', points: 4500, distanceKm: 55, fireBadges: 1, isInfluencer: true },
  { rank: 5, uid: 'u_michael', name: 'Michael K.', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', points: 5000, distanceKm: 55, fireBadges: 3, isInfluencer: true },
  { rank: 6, uid: 'u_jessica', name: 'Jessica T.', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', points: 4200, distanceKm: 6, fireBadges: 1, isInfluencer: true },
  { rank: 7, uid: 'u_david', name: 'David L.', avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80', points: 3000, distanceKm: 43, fireBadges: 1 },
  { rank: 8, uid: 'u_alex', name: 'Alex C.', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80', points: 1800, distanceKm: 45, fireBadges: 1 },
  { rank: 156, uid: 'user_mateus_001', name: 'Mateus Silva (You)', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', points: 3250, distanceKm: 52, fireBadges: 2, isCurrentUser: true }
];

export const initialCommunities: Community[] = [
  {
    id: 'comm_1',
    name: 'Weekend Warriors FC',
    description: 'Community for passionate weekend soccer & fitness enthusiasts.',
    location: 'São Paulo, SP, Brasil',
    lat: -23.55052,
    lng: -46.633308,
    sportCategory: 'Running',
    privacy: 'public',
    membersCount: 2400,
    coverUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    createdBy: 'Coach Mike',
    createdAt: new Date().toISOString()
  },
  {
    id: 'comm_2',
    name: 'SF Bay Area Cyclists',
    description: 'Group rides every Saturday morning from Embarcadero.',
    location: 'San Francisco, CA, EUA',
    lat: 37.7749,
    lng: -122.4194,
    sportCategory: 'Cycling',
    privacy: 'public',
    membersCount: 1180,
    coverUrl: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=800&q=80',
    createdBy: 'Liam J.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'comm_3',
    name: 'Corredores do Ibirapuera',
    description: 'Comunidade de corrida no Parque do Ibirapuera. Treinos terças e quintas.',
    location: 'Parque do Ibirapuera, SP',
    lat: -23.5874,
    lng: -46.6576,
    sportCategory: 'Running',
    privacy: 'public',
    membersCount: 3850,
    coverUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
    createdBy: 'Mateus Silva',
    createdAt: new Date().toISOString()
  },
  {
    id: 'comm_4',
    name: 'Triathlon Copacabana & Rio',
    description: 'Atletas de alta performance: Natação, Ciclismo e Corrida na Zona Sul.',
    location: 'Copacabana, Rio de Janeiro',
    lat: -22.9711,
    lng: -43.1825,
    sportCategory: 'Swimming',
    privacy: 'public',
    membersCount: 940,
    coverUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80',
    createdBy: 'Ana Costa',
    createdAt: new Date().toISOString()
  },
  {
    id: 'comm_5',
    name: 'Trilheiros da Serra do Japi',
    description: 'Exploradores de montanha, trekking e corrida de trilha aos finais de semana.',
    location: 'Serra do Japi / Jundiaí, SP',
    lat: -23.2300,
    lng: -46.9500,
    sportCategory: 'Hiking',
    privacy: 'public',
    membersCount: 1520,
    coverUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
    createdBy: 'Jessica T.',
    createdAt: new Date().toISOString()
  }
];

export const initialCommunityMessages: CommunityMessage[] = [
  {
    id: 'msg_1',
    communityId: 'comm_1',
    userId: 'u_alex_c',
    userName: 'Alex Chen',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    text: "Check out the highlight from yesterday's match! Great teamwork everyone. 🔥",
    mediaUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    repliesCount: 5,
    flameCount: 32,
    hasReacted: true,
    createdAt: '2m ago'
  },
  {
    id: 'msg_2',
    communityId: 'comm_1',
    userId: 'u_maria_r',
    userName: 'Maria Rodriguez',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    text: 'Celebratory pizza after the win! 🍕',
    mediaUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    repliesCount: 2,
    flameCount: 18,
    hasReacted: false,
    createdAt: '2m ago'
  },
  {
    id: 'msg_3',
    communityId: 'comm_1',
    userId: 'u_coach_mike',
    userName: 'Coach Mike',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    text: 'Next practice is Tuesday at 6 PM. Be there!',
    repliesCount: 0,
    flameCount: 45,
    hasReacted: true,
    createdAt: '3m ago'
  }
];

export const initialNotifications: NotificationItem[] = [
  { id: 'n1', userId: 'user_mateus_001', title: 'Global Challenge Update', message: 'You reached 80% of the Global Distance Quest! 15 KM remaining.', type: 'challenge', read: false, createdAt: '10 min ago' },
  { id: 'n2', userId: 'user_mateus_001', title: 'New Activity Like', message: 'Sarah P. and 120 others liked your 10.2 km City Run post.', type: 'like', read: false, createdAt: '1 hour ago' },
  { id: 'n3', userId: 'user_mateus_001', title: 'Community Message', message: 'Coach Mike posted a announcement in Weekend Warriors FC.', type: 'community', read: true, createdAt: '3 hours ago' },
  { id: 'n4', userId: 'user_mateus_001', title: 'Firebase Backup Sync', message: 'Local IndexedDB state successfully synced to Cloud Firestore.', type: 'system', read: true, createdAt: 'Yesterday' }
];

export const initialAuditLogs: AuditLog[] = [
  { id: 'log_1', userId: 'user_mateus_001', userName: 'Mateus Silva', action: 'ADMIN_PROMO_APPROVE', resource: 'Campaign: Summer Run Challenge', ipAddress: '192.168.1.45', timestamp: new Date().toISOString() },
  { id: 'log_2', userId: 'user_mateus_001', userName: 'Mateus Silva', action: 'FIREBASE_AUTH_LOGIN', resource: 'OAuth 2.0 / Biometric Passkey', ipAddress: '192.168.1.45', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'log_3', userId: 'u_sarah', userName: 'Sarah P.', action: 'USER_PROFILE_UPDATE', resource: 'Region: SF, CA', ipAddress: '10.0.0.12', timestamp: new Date(Date.now() - 7200000).toISOString() }
];
