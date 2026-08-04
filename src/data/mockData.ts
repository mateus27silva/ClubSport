import { UserProfile, ActivityPost, Challenge, Community, CommunityMessage, LeaderboardAthlete, AuditLog, NotificationItem, CrmDeal, CrmUser } from '../types';

export const initialCurrentUser: UserProfile | null = null;

export const initialLiveChallengesUsers: any[] = [];

export const initialActivities: ActivityPost[] = [];

export const initialChallenges: Challenge[] = [];

export const initialLeaderboard: LeaderboardAthlete[] = [];

export const initialCommunities: Community[] = [
  {
    id: 'comm_1',
    name: 'Corredores de São Paulo',
    description: 'Comunidade oficial de treino e corridas de rua em São Paulo - Parque Ibirapuera e Villa-Lobos.',
    location: 'São Paulo, SP, Brasil',
    sportCategory: 'Running',
    privacy: 'public',
    membersCount: 128,
    coverUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80',
    createdBy: 'Mateus Silva',
    creatorId: 'usr_mateus',
    lat: -23.587416,
    lng: -46.657634,
    members: [
      { id: 'usr_mateus', name: 'Mateus Silva', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', role: 'creator' }
    ],
    admins: ['usr_mateus'],
    pinnedMessageText: '📌 Treino de tiro sábado no Ibirapuera às 06h30! Concentração no Portão 7.',
    pinnedMessageId: 'msg_1',
    createdAt: new Date().toISOString()
  },
  {
    id: 'comm_2',
    name: 'Pelotão Ciclismo SP',
    description: 'Grupo de pedais matinais na Marginal Pinheiros e Rodovia dos Bandeirantes.',
    location: 'São Paulo, SP, Brasil',
    sportCategory: 'Cycling',
    privacy: 'public',
    membersCount: 84,
    coverUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
    createdBy: 'Atleta ClubSport',
    lat: -23.55052,
    lng: -46.633308,
    createdAt: new Date().toISOString()
  }
];

export const initialCommunityMessages: CommunityMessage[] = [];

export const initialNotifications: NotificationItem[] = [];

export const initialAuditLogs: AuditLog[] = [];

export const initialCrmDeals: CrmDeal[] = [];

export const initialCrmUsers: CrmUser[] = [];
