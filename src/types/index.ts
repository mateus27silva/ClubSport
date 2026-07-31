export type UserRole = 'user' | 'influencer' | 'admin';

export type SportType = 'Running' | 'Cycling' | 'Swimming' | 'Triathlon' | 'Spin Class' | 'Yoga' | 'HIIT' | 'Hiking';

export interface UserProfile {
  uid: string;
  fullName: string;
  username: string;
  email: string;
  bio: string;
  primarySport: SportType;
  region: string;
  role: UserRole;
  totalKm: number;
  activeDays: number;
  points: number;
  avatarUrl: string;
  isPro: boolean;
  clubs: string[];
  createdAt: string;
}

export interface ActivityComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface GpsPoint {
  lat: number;
  lng: number;
  alt?: number;
  timestamp: number;
  heartRate?: number;
  speedKmH?: number;
}

export interface LiveRunMetrics {
  runId: string;
  userId: string;
  status: 'idle' | 'running' | 'paused' | 'finished';
  distanceKm: number;
  durationSeconds: number;
  paceMinKm: string;
  speedKmH: number;
  calories: number;
  avgHeartRate: number;
  currentHeartRate: number;
  elevationGain: number;
  points: GpsPoint[];
  challengeId?: string;
  watchConnected: boolean;
  watchBattery?: number;
}

export interface ActivityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  timeAgo: string;
  sport: SportType;
  title: string;
  distanceKm: number;
  timeMinutes: number;
  pace: string;
  calories: number;
  imageUrl?: string;
  hasMap: boolean;
  mapRouteSvg?: string;
  routePoints?: GpsPoint[];
  avgHeartRate?: number;
  maxHeartRate?: number;
  elevationGain?: number;
  gpxUrl?: string;
  challengeId?: string;
  likesCount: number;
  isLiked?: boolean;
  commentsCount: number;
  comments: ActivityComment[];
  caption: string;
  createdAt: string;
  lat?: number;
  lng?: number;
  locationName?: string;
  calculatedDistanceKm?: number;
}

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  type: 'distance' | 'calories' | 'sprint';
  scope: 'global' | 'local';
  targetValue: number;
  currentValue: number;
  unit: string;
  endsIn: string;
  joinedUsersCount: number;
  bannerUrl: string;
  status: 'active' | 'pending_approval' | 'completed';
  isJoined?: boolean;
  lat?: number;
  lng?: number;
  locationName?: string;
  calculatedDistanceKm?: number;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  location?: string;
  sportCategory: SportType;
  privacy: 'public' | 'private';
  membersCount: number;
  coverUrl: string;
  createdBy: string;
  createdAt: string;
  lat?: number;
  lng?: number;
  calculatedDistanceKm?: number;
}

export interface CommunityMessage {
  id: string;
  communityId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  mediaUrl?: string;
  isVideo?: boolean;
  repliesCount: number;
  flameCount: number;
  hasReacted?: boolean;
  createdAt: string;
}

export interface LeaderboardAthlete {
  rank: number;
  uid: string;
  name: string;
  avatarUrl: string;
  points: number;
  distanceKm: number;
  fireBadges: number;
  isCurrentUser?: boolean;
  isInfluencer?: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'challenge' | 'like' | 'comment' | 'community' | 'system';
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  ipAddress: string;
  timestamp: string;
}

export type DealStage = 'lead' | 'contact' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface CrmDeal {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  category: 'Patrocínio' | 'Clube de Corrida' | 'Parceria Corporativa' | 'Evento Esportivo';
  value: number; // Em R$
  stage: DealStage;
  expectedCloseDate: string;
  notes?: string;
  createdAt: string;
}

export interface CrmUser {
  id: string;
  fullName: string;
  email: string;
  role: 'Atleta' | 'Admin' | 'Coach' | 'Parceiro';
  status: 'Ativo' | 'Suspenso' | 'VIP / Pro';
  totalKm: number;
  points: number;
  avatarUrl: string;
  joinedDate: string;
  region: string;
}

export type ThemeMode = 'dark' | 'light' | 'system';
