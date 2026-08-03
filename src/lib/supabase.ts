import { createClient } from '@supabase/supabase-js';
import { ActivityPost, Challenge, Community, CommunityMessage, NotificationItem, UserProfile } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wpjmgvtnfazixxbrkspa.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eMQB2zbEIEMKtLiD9R4fgQ__HHnbWPg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Handle and log Supabase query errors safely
 */
export function handleSupabaseError(error: any, context: string) {
  if (!error) return;
  console.warn(`[Supabase Error in ${context}]:`, error.message || error);
}

/**
 * Helper to test Supabase connection and connectivity status
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('activities').select('id').limit(1);
    if (error && error.code !== '42P01' && error.code !== 'PGRST116') {
      console.log('Supabase initialized with URL:', SUPABASE_URL);
    } else {
      console.log('Supabase connection verified successfully!');
    }
    return true;
  } catch (err) {
    console.warn('Supabase connection warning:', err);
    return false;
  }
}

/* ============================================================================
   ACTIVITIES API & REAL-TIME
   ============================================================================ */

export async function fetchActivities(): Promise<ActivityPost[]> {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'fetchActivities');
      return [];
    }
    return (data || []).map((item) => ({
      ...item,
      userId: item.user_id || item.userId,
      userName: item.user_name || item.userName,
      userAvatar: item.user_avatar || item.userAvatar,
      distanceKm: item.distance_km ?? item.distanceKm ?? 0,
      timeMinutes: item.time_minutes ?? item.timeMinutes ?? 0,
      timeAgo: item.time_ago || item.timeAgo || 'Recent',
      likesCount: item.likes_count ?? item.likesCount ?? 0,
      commentsCount: item.comments_count ?? item.commentsCount ?? 0,
      comments: item.comments || [],
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
    }));
  } catch (err) {
    handleSupabaseError(err, 'fetchActivities catch');
    return [];
  }
}

export function subscribeActivities(onUpdate: (activities: ActivityPost[]) => void) {
  const channel = supabase
    .channel('public:activities')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, async () => {
      const updated = await fetchActivities();
      onUpdate(updated);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function createActivity(activity: ActivityPost): Promise<boolean> {
  try {
    const payload = {
      id: activity.id,
      user_id: activity.userId,
      user_name: activity.userName,
      user_avatar: activity.userAvatar,
      time_ago: activity.timeAgo || 'Agora',
      sport: activity.sport,
      title: activity.title,
      distance_km: activity.distanceKm,
      time_minutes: activity.timeMinutes,
      pace: activity.pace,
      calories: activity.calories,
      image_url: activity.imageUrl || null,
      has_map: activity.hasMap,
      map_route_svg: activity.mapRouteSvg || null,
      route_points: activity.routePoints || [],
      likes_count: activity.likesCount || 0,
      comments_count: activity.commentsCount || 0,
      comments: activity.comments || [],
      caption: activity.caption || '',
      created_at: activity.createdAt || new Date().toISOString(),
      lat: activity.lat || null,
      lng: activity.lng || null,
      location_name: activity.locationName || null,
    };

    const { error } = await supabase.from('activities').insert([payload]);
    if (error) {
      handleSupabaseError(error, 'createActivity');
      return false;
    }
    return true;
  } catch (err) {
    handleSupabaseError(err, 'createActivity catch');
    return false;
  }
}

/* ============================================================================
   CHALLENGES API & REAL-TIME
   ============================================================================ */

export async function fetchChallenges(): Promise<Challenge[]> {
  try {
    const { data, error } = await supabase.from('challenges').select('*');
    if (error) {
      handleSupabaseError(error, 'fetchChallenges');
      return [];
    }
    return (data || []).map((item) => ({
      ...item,
      targetValue: item.target_value ?? item.targetValue ?? 0,
      currentValue: item.current_value ?? item.currentValue ?? 0,
      endsIn: item.ends_in || item.endsIn || '30 dias',
      joinedUsersCount: item.joined_users_count ?? item.joinedUsersCount ?? 0,
      bannerUrl: item.banner_url || item.bannerUrl || '',
      locationName: item.location_name || item.locationName,
    }));
  } catch (err) {
    handleSupabaseError(err, 'fetchChallenges catch');
    return [];
  }
}

export function subscribeChallenges(onUpdate: (challenges: Challenge[]) => void) {
  const channel = supabase
    .channel('public:challenges')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, async () => {
      const updated = await fetchChallenges();
      onUpdate(updated);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function createChallenge(challenge: Challenge): Promise<boolean> {
  try {
    const payload = {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description || '',
      type: challenge.type,
      scope: challenge.scope,
      target_value: challenge.targetValue,
      current_value: challenge.currentValue || 0,
      unit: challenge.unit,
      ends_in: challenge.endsIn,
      joined_users_count: challenge.joinedUsersCount || 1,
      banner_url: challenge.bannerUrl,
      status: challenge.status || 'active',
      lat: challenge.lat || null,
      lng: challenge.lng || null,
      location_name: challenge.locationName || null,
    };

    const { error } = await supabase.from('challenges').insert([payload]);
    if (error) {
      handleSupabaseError(error, 'createChallenge');
      return false;
    }
    return true;
  } catch (err) {
    handleSupabaseError(err, 'createChallenge catch');
    return false;
  }
}

/* ============================================================================
   COMMUNITIES API & REAL-TIME
   ============================================================================ */

export async function fetchCommunities(): Promise<Community[]> {
  try {
    const { data, error } = await supabase.from('communities').select('*');
    if (error) {
      handleSupabaseError(error, 'fetchCommunities');
      return [];
    }
    return (data || []).map((item) => ({
      ...item,
      sportCategory: item.sport_category || item.sportCategory || 'Running',
      membersCount: item.members_count ?? item.membersCount ?? 0,
      coverUrl: item.cover_url || item.coverUrl || '',
      createdBy: item.created_by || item.createdBy || 'user',
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
    }));
  } catch (err) {
    handleSupabaseError(err, 'fetchCommunities catch');
    return [];
  }
}

export function subscribeCommunities(onUpdate: (communities: Community[]) => void) {
  const channel = supabase
    .channel('public:communities')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'communities' }, async () => {
      const updated = await fetchCommunities();
      onUpdate(updated);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function createCommunity(community: Community): Promise<boolean> {
  try {
    const payload = {
      id: community.id,
      name: community.name,
      description: community.description,
      location: community.location || 'São Paulo, SP, Brasil',
      sport_category: community.sportCategory,
      privacy: community.privacy,
      members_count: community.membersCount || 1,
      cover_url: community.coverUrl,
      created_by: community.createdBy,
      created_at: community.createdAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('communities').insert([payload]);
    if (error) {
      handleSupabaseError(error, 'createCommunity');
      return false;
    }
    return true;
  } catch (err) {
    handleSupabaseError(err, 'createCommunity catch');
    return false;
  }
}

/* ============================================================================
   COMMUNITY MESSAGES
   ============================================================================ */

export async function fetchCommunityMessages(communityId: string): Promise<CommunityMessage[]> {
  try {
    const { data, error } = await supabase
      .from('community_messages')
      .select('*')
      .eq('community_id', communityId)
      .order('created_at', { ascending: true });

    if (error) {
      handleSupabaseError(error, 'fetchCommunityMessages');
      return [];
    }

    return (data || []).map((item) => ({
      ...item,
      communityId: item.community_id || item.communityId,
      userId: item.user_id || item.userId,
      userName: item.user_name || item.userName,
      userAvatar: item.user_avatar || item.userAvatar,
      mediaUrl: item.media_url || item.mediaUrl,
      isVideo: item.is_video ?? item.isVideo ?? false,
      repliesCount: item.replies_count ?? item.repliesCount ?? 0,
      flameCount: item.flame_count ?? item.flameCount ?? 0,
      hasReacted: item.has_reacted ?? item.hasReacted ?? false,
      createdAt: item.created_at || item.createdAt || 'Agora',
    }));
  } catch (err) {
    handleSupabaseError(err, 'fetchCommunityMessages catch');
    return [];
  }
}

export function subscribeCommunityMessages(
  communityId: string,
  onUpdate: (messages: CommunityMessage[]) => void
) {
  const channel = supabase
    .channel(`public:community_messages:${communityId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'community_messages',
        filter: `community_id=eq.${communityId}`,
      },
      async () => {
        const updated = await fetchCommunityMessages(communityId);
        onUpdate(updated);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function createCommunityMessage(message: CommunityMessage): Promise<boolean> {
  try {
    const payload = {
      id: message.id,
      community_id: message.communityId,
      user_id: message.userId,
      user_name: message.userName,
      user_avatar: message.userAvatar,
      text: message.text,
      media_url: message.mediaUrl || null,
      is_video: message.isVideo || false,
      replies_count: message.repliesCount || 0,
      flame_count: message.flameCount || 0,
      has_reacted: message.hasReacted || false,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('community_messages').insert([payload]);
    if (error) {
      handleSupabaseError(error, 'createCommunityMessage');
      return false;
    }
    return true;
  } catch (err) {
    handleSupabaseError(err, 'createCommunityMessage catch');
    return false;
  }
}

