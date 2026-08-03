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

/* ============================================================================
   SUPABASE STORAGE FOR IMAGES
   ============================================================================ */

const STORAGE_BUCKET = 'clubsport-images';

let isBucketChecked = false;
async function ensureBucketExists() {
  if (isBucketChecked) return;
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === STORAGE_BUCKET);
    if (!exists) {
      await supabase.storage.createBucket(STORAGE_BUCKET, { public: true });
    }
    isBucketChecked = true;
  } catch (err) {
    console.warn('Bucket check warning:', err);
  }
}

/**
 * Uploads a file, Blob, or base64 Data URL to Supabase Storage.
 * Returns the permanent public Supabase Storage CDN URL.
 */
export async function uploadImageToSupabase(
  fileOrDataUrl: string | File | Blob,
  folder: 'activities' | 'avatars' | 'banners' = 'activities'
): Promise<string> {
  if (!fileOrDataUrl) return '';

  // If it's already an external HTTP URL, return as is
  if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('http')) {
    return fileOrDataUrl;
  }

  await ensureBucketExists();

  try {
    let fileToUpload: Blob;
    let fileExt = 'jpg';

    if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
      const arr = fileOrDataUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      fileExt = mime.split('/')[1] || 'jpg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      fileToUpload = new Blob([u8arr], { type: mime });
    } else if (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob) {
      fileToUpload = fileOrDataUrl;
      if (fileOrDataUrl instanceof File && fileOrDataUrl.name) {
        fileExt = fileOrDataUrl.name.split('.').pop() || 'jpg';
      }
    } else {
      return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '';
    }

    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, fileToUpload, {
        cacheControl: '3600',
        upsert: true,
        contentType: fileToUpload.type || 'image/jpeg',
      });

    if (error) {
      console.warn('[Supabase Storage] Upload error:', error.message || error);
      return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '';
    }

    const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);
    return publicData.publicUrl || '';
  } catch (err) {
    console.warn('[Supabase Storage] Catch error during upload:', err);
    return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '';
  }
}

export async function createActivity(activity: ActivityPost): Promise<boolean> {
  try {
    // Process image uploads to Supabase Storage
    let uploadedImageUrl = activity.imageUrl || null;
    if (uploadedImageUrl && uploadedImageUrl.startsWith('data:')) {
      uploadedImageUrl = await uploadImageToSupabase(uploadedImageUrl, 'activities');
    }

    let uploadedAvatarUrl = activity.userAvatar || null;
    if (uploadedAvatarUrl && uploadedAvatarUrl.startsWith('data:')) {
      uploadedAvatarUrl = await uploadImageToSupabase(uploadedAvatarUrl, 'avatars');
    }

    const payload = {
      id: activity.id,
      user_id: activity.userId,
      user_name: activity.userName,
      user_avatar: uploadedAvatarUrl,
      time_ago: activity.timeAgo || 'Agora',
      sport: activity.sport,
      title: activity.title,
      distance_km: activity.distanceKm,
      time_minutes: activity.timeMinutes,
      pace: activity.pace,
      calories: activity.calories,
      image_url: uploadedImageUrl,
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

export async function updateActivityCaption(activityId: string, newCaption: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('activities')
      .update({ caption: newCaption })
      .eq('id', activityId);

    if (error) {
      handleSupabaseError(error, 'updateActivityCaption');
      return false;
    }
    return true;
  } catch (err) {
    handleSupabaseError(err, 'updateActivityCaption catch');
    return false;
  }
}

export async function deleteActivity(activityId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId);

    if (error) {
      handleSupabaseError(error, 'deleteActivity');
      return false;
    }

    // Clean up related likes and comments if tables exist
    await supabase.from('activity_likes').delete().eq('activity_id', activityId);
    await supabase.from('activity_comments').delete().eq('activity_id', activityId);

    return true;
  } catch (err) {
    handleSupabaseError(err, 'deleteActivity catch');
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
    let uploadedBannerUrl = challenge.bannerUrl || null;
    if (uploadedBannerUrl && uploadedBannerUrl.startsWith('data:')) {
      uploadedBannerUrl = await uploadImageToSupabase(uploadedBannerUrl, 'banners');
    }

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
      banner_url: uploadedBannerUrl,
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
    let uploadedCoverUrl = community.coverUrl || null;
    if (uploadedCoverUrl && uploadedCoverUrl.startsWith('data:')) {
      uploadedCoverUrl = await uploadImageToSupabase(uploadedCoverUrl, 'banners');
    }

    const payload = {
      id: community.id,
      name: community.name,
      description: community.description,
      location: community.location || 'São Paulo, SP, Brasil',
      sport_category: community.sportCategory,
      privacy: community.privacy,
      members_count: community.membersCount || 1,
      cover_url: uploadedCoverUrl,
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
    let uploadedMediaUrl = message.mediaUrl || null;
    if (uploadedMediaUrl && uploadedMediaUrl.startsWith('data:')) {
      uploadedMediaUrl = await uploadImageToSupabase(uploadedMediaUrl, 'activities');
    }

    let uploadedAvatar = message.userAvatar || null;
    if (uploadedAvatar && uploadedAvatar.startsWith('data:')) {
      uploadedAvatar = await uploadImageToSupabase(uploadedAvatar, 'avatars');
    }

    const payload = {
      id: message.id,
      community_id: message.communityId,
      user_id: message.userId,
      user_name: message.userName,
      user_avatar: uploadedAvatar,
      text: message.text,
      media_url: uploadedMediaUrl,
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

/* ============================================================================
   SOCIAL INTERACTIONS (LIKES, COMMENTS, CHALLENGES & COMMUNITY MEMBERSHIPS)
   ============================================================================ */

export async function fetchUserLikedActivities(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('activity_likes')
      .select('activity_id')
      .eq('user_id', userId);
    if (error) return [];
    return (data || []).map((d) => d.activity_id);
  } catch {
    return [];
  }
}

export async function toggleActivityLike(
  activityId: string,
  userId: string,
  currentLikesCount: number
): Promise<{ isLiked: boolean; likesCount: number }> {
  try {
    const { data: existing } = await supabase
      .from('activity_likes')
      .select('id')
      .eq('activity_id', activityId)
      .eq('user_id', userId)
      .single();

    let isLiked = false;
    let newCount = currentLikesCount;

    if (existing) {
      await supabase
        .from('activity_likes')
        .delete()
        .eq('activity_id', activityId)
        .eq('user_id', userId);

      isLiked = false;
      newCount = Math.max(0, currentLikesCount - 1);
    } else {
      await supabase.from('activity_likes').insert([
        { activity_id: activityId, user_id: userId }
      ]);

      isLiked = true;
      newCount = currentLikesCount + 1;
    }

    await supabase
      .from('activities')
      .update({ likes_count: newCount })
      .eq('id', activityId);

    return { isLiked, likesCount: newCount };
  } catch (err) {
    handleSupabaseError(err, 'toggleActivityLike');
    return { isLiked: false, likesCount: currentLikesCount };
  }
}

export async function fetchActivityComments(activityId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('activity_comments')
      .select('*')
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true });
    if (error) return [];
    return (data || []).map((c) => ({
      id: c.id,
      userName: c.user_name,
      userAvatar: c.user_avatar,
      text: c.text,
      createdAt: c.created_at
    }));
  } catch {
    return [];
  }
}

export async function addActivityComment(
  activityId: string,
  userId: string,
  userName: string,
  userAvatar: string,
  text: string,
  currentCommentsCount: number
): Promise<{ success: boolean; newCommentsCount: number }> {
  try {
    const { error } = await supabase.from('activity_comments').insert([
      {
        activity_id: activityId,
        user_id: userId,
        user_name: userName,
        user_avatar: userAvatar,
        text,
      },
    ]);

    if (error) {
      handleSupabaseError(error, 'addActivityComment');
      return { success: false, newCommentsCount: currentCommentsCount };
    }

    const newCommentsCount = currentCommentsCount + 1;
    await supabase
      .from('activities')
      .update({ comments_count: newCommentsCount })
      .eq('id', activityId);

    return { success: true, newCommentsCount };
  } catch (err) {
    handleSupabaseError(err, 'addActivityComment catch');
    return { success: false, newCommentsCount: currentCommentsCount };
  }
}

export async function fetchUserJoinedChallenges(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('challenge_participants')
      .select('challenge_id')
      .eq('user_id', userId);
    if (error) return [];
    return (data || []).map((d) => d.challenge_id);
  } catch {
    return [];
  }
}

export async function toggleChallengeParticipation(
  challengeId: string,
  userId: string,
  currentJoinedCount: number
): Promise<{ isJoined: boolean; newCount: number }> {
  try {
    const { data: existing } = await supabase
      .from('challenge_participants')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
      .single();

    let isJoined = false;
    let newCount = currentJoinedCount;

    if (existing) {
      await supabase
        .from('challenge_participants')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);

      isJoined = false;
      newCount = Math.max(0, currentJoinedCount - 1);
    } else {
      await supabase
        .from('challenge_participants')
        .insert([{ challenge_id: challengeId, user_id: userId }]);

      isJoined = true;
      newCount = currentJoinedCount + 1;
    }

    await supabase
      .from('challenges')
      .update({ joined_users_count: newCount })
      .eq('id', challengeId);

    return { isJoined, newCount };
  } catch (err) {
    handleSupabaseError(err, 'toggleChallengeParticipation');
    return { isJoined: false, newCount: currentJoinedCount };
  }
}

export async function fetchUserJoinedCommunities(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', userId);
    if (error) return [];
    return (data || []).map((d) => d.community_id);
  } catch {
    return [];
  }
}

export async function toggleCommunityMembership(
  communityId: string,
  userId: string,
  currentMembersCount: number
): Promise<{ isMember: boolean; newCount: number }> {
  try {
    const { data: existing } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .single();

    let isMember = false;
    let newCount = currentMembersCount;

    if (existing) {
      await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', userId);

      isMember = false;
      newCount = Math.max(1, currentMembersCount - 1);
    } else {
      await supabase
        .from('community_members')
        .insert([{ community_id: communityId, user_id: userId, role: 'member' }]);

      isMember = true;
      newCount = currentMembersCount + 1;
    }

    await supabase
      .from('communities')
      .update({ members_count: newCount })
      .eq('id', communityId);

    return { isMember, newCount };
  } catch (err) {
    handleSupabaseError(err, 'toggleCommunityMembership');
    return { isMember: false, newCount: currentMembersCount };
  }
}

