import { UserProfile, ActivityPost, Challenge, Community, CommunityMessage, LeaderboardAthlete, AuditLog, NotificationItem, CrmDeal, CrmUser } from '../types';

export const initialCurrentUser: UserProfile | null = null;

export const initialLiveChallengesUsers: any[] = [];

export const initialActivities: ActivityPost[] = [];

export const initialChallenges: Challenge[] = [
  {
    id: 'ch_1',
    title: 'Desafio 50KM Corrida Mensal',
    description: 'Corra um total acumulado de 50 KM durante este mês e conquiste a insígnia oficial ClubSport Pro.',
    type: 'distance',
    scope: 'global',
    targetValue: 50,
    currentValue: 28.5,
    unit: 'KM',
    endsIn: '15 dias',
    joinedUsersCount: 42,
    bannerUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    isJoined: true
  },
  {
    id: 'ch_2',
    title: '100KM Ciclismo Urbano SP',
    description: 'Complete 100 KM de pedal pelas vias e ciclofaixas urbanas com seu grupo ou solo.',
    type: 'distance',
    scope: 'global',
    targetValue: 100,
    currentValue: 65.0,
    unit: 'KM',
    endsIn: '20 dias',
    joinedUsersCount: 28,
    bannerUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    isJoined: true
  },
  {
    id: 'ch_3',
    title: 'Supera 10K Sprint de Velocidade',
    description: 'Conclua uma corrida de 10 KM no menor tempo possível para pontuar no ranking regional.',
    type: 'sprint',
    scope: 'global',
    targetValue: 10,
    currentValue: 10.0,
    unit: 'KM',
    endsIn: 'Concluído',
    joinedUsersCount: 89,
    bannerUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
    status: 'completed',
    isJoined: true
  },
  {
    id: 'ch_4',
    title: 'Desafio 30 KM Trilha & Montanha',
    description: 'Acumule 30 KM em percursos fora de estrada, trilhas ou montanhas regionais.',
    type: 'distance',
    scope: 'local',
    targetValue: 30,
    currentValue: 0,
    unit: 'KM',
    endsIn: '25 dias',
    joinedUsersCount: 15,
    bannerUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    isJoined: false
  }
];

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
