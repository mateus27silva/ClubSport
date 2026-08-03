import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { OfflineProvider } from './context/OfflineContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  testSupabaseConnection,
  fetchActivities,
  subscribeActivities,
  createActivity,
  fetchChallenges,
  subscribeChallenges,
  createChallenge,
  fetchCommunities,
  subscribeCommunities,
  createCommunity,
  uploadImageToSupabase,
  toggleActivityLike,
  addActivityComment,
  toggleChallengeParticipation,
  toggleCommunityMembership,
  fetchUserLikedActivities,
  fetchUserJoinedChallenges,
  fetchUserJoinedCommunities,
  updateActivityCaption,
  deleteActivity,
} from './lib/supabase';

import { Header } from './components/Header';
import { BottomNav, ActiveTab } from './components/BottomNav';

import { FeedView } from './components/views/FeedView';
import { ChallengesView } from './components/views/ChallengesView';
import { ProfileView } from './components/views/ProfileView';
import { LeaderboardView } from './components/views/LeaderboardView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { AdminDashboardView } from './components/views/AdminDashboardView';
import { CaptureView } from './components/views/CaptureView';
import { QuickUploadView } from './components/views/QuickUploadView';
import { EditProfileView } from './components/views/EditProfileView';
import { SettingsView } from './components/views/SettingsView';
import { CreateCommunityView } from './components/views/CreateCommunityView';
import { CommunityChatView } from './components/views/CommunityChatView';
import { CreateChallengeView } from './components/views/CreateChallengeView';
import { LiveTrackerView } from './components/views/LiveTrackerView';

import { FirebaseSetupGuideModal } from './components/modals/FirebaseSetupGuideModal';
import { NotificationsDrawer } from './components/modals/NotificationsDrawer';
import { AuthModal } from './components/modals/AuthModal';
import { ConnectWatchModal } from './components/modals/ConnectWatchModal';
import { UserProfileModal, TargetUserProfileInfo } from './components/modals/UserProfileModal';

import {
  initialActivities,
  initialChallenges,
  initialCommunities,
  initialLeaderboard,
  initialNotifications
} from './data/mockData';
import { ActivityPost, Challenge, Community, NotificationItem } from './types';

function MainAppContent() {
  const { user, isAuthenticated, isLoading, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [currentView, setCurrentView] = useState<string>('home');

  // Data State with localStorage persistence
  const [activities, setActivities] = useState<ActivityPost[]>(() => {
    try {
      const saved = localStorage.getItem('clubsport_activities');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading stored activities from localStorage', e);
    }
    return initialActivities;
  });

  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);
  const [communities, setCommunities] = useState<Community[]>(initialCommunities);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string>('');
  const [selectedTrackerChallengeId, setSelectedTrackerChallengeId] = useState<string | undefined>();

  // Persist activities to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('clubsport_activities', JSON.stringify(activities.slice(0, 50)));
    } catch (e) {
      console.warn('Could not persist activities to localStorage:', e);
    }
  }, [activities]);

  // Validate connection to Supabase on initial boot
  useEffect(() => {
    testSupabaseConnection();
  }, []);

  // Real-time Supabase sync for activities, challenges, communities
  useEffect(() => {
    // Initial fetches with merge to preserve local posts with images
    fetchActivities().then((fetched) => {
      if (fetched.length > 0) {
        setActivities((prev) => {
          const map = new Map();
          fetched.forEach((item) => map.set(item.id, item));
          prev.forEach((item) => {
            if (!map.has(item.id)) {
              map.set(item.id, item);
            }
          });
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
        });
      }
    });
    fetchChallenges().then((fetched) => {
      if (fetched.length > 0) setChallenges(fetched);
    });
    fetchCommunities().then((fetched) => {
      if (fetched.length > 0) setCommunities(fetched);
    });

    // Real-time subscribers
    const unsubActivities = subscribeActivities((updated) => {
      if (updated.length > 0) {
        setActivities((prev) => {
          const map = new Map();
          updated.forEach((item) => map.set(item.id, item));
          prev.forEach((item) => {
            if (!map.has(item.id)) map.set(item.id, item);
          });
          return Array.from(map.values());
        });
      }
    });
    const unsubChallenges = subscribeChallenges((updated) => {
      if (updated.length > 0) setChallenges(updated);
    });
    const unsubCommunities = subscribeCommunities((updated) => {
      if (updated.length > 0) setCommunities(updated);
    });

    return () => {
      unsubActivities();
      unsubChallenges();
      unsubCommunities();
    };
  }, []);

  // Sync User Social Interactions when user changes
  useEffect(() => {
    if (user?.uid) {
      fetchUserLikedActivities(user.uid).then((likedIds) => {
        if (likedIds.length > 0) {
          const likedSet = new Set(likedIds);
          setActivities((prev) =>
            prev.map((act) => ({
              ...act,
              isLiked: likedSet.has(act.id) || act.isLiked,
            }))
          );
        }
      });

      fetchUserJoinedChallenges(user.uid).then((joinedIds) => {
        if (joinedIds.length > 0) {
          const joinedSet = new Set(joinedIds);
          setChallenges((prev) =>
            prev.map((ch) => ({
              ...ch,
              isJoined: joinedSet.has(ch.id) || ch.isJoined,
            }))
          );
        }
      });
    }
  }, [user?.uid]);

  // Modals
  const [isFirebasePlanOpen, setIsFirebasePlanOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isConnectWatchOpen, setIsConnectWatchOpen] = useState<boolean>(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<TargetUserProfileInfo | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black text-orange-500 uppercase tracking-wider">ClubSport</p>
          <p className="text-[11px] font-medium text-zinc-400">Verificando credenciais do atleta...</p>
        </div>
      </div>
    );
  }

  // Strict Authentication Gate: Require user registration / login before accessing app
  if (!isAuthenticated) {
    return (
      <div id="app-wrapper" className="min-h-screen bg-zinc-950 text-white font-sans flex items-center justify-center">
        <AuthModal onClose={undefined} />
      </div>
    );
  }

  const handleOpenUserProfile = (userObj: { userId: string; userName: string; userAvatar?: string }) => {
    setSelectedUserProfile(userObj);
  };

  // Sync tab navigation with view
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'home') setCurrentView('home');
    else if (tab === 'search') setCurrentView('search');
    else if (tab === 'challenges') setCurrentView('challenges');
    else if (tab === 'profile') setCurrentView('profile');
  };

  // Like Toggle (Optimistic + Supabase Sync)
  const handleToggleLike = async (activityId: string) => {
    const target = activities.find((a) => a.id === activityId);
    if (!target) return;

    const currentLikesCount = target.likesCount || 0;

    setActivities((prev) =>
      prev.map((act) =>
        act.id === activityId
          ? {
              ...act,
              isLiked: !act.isLiked,
              likesCount: act.isLiked ? Math.max(0, act.likesCount - 1) : act.likesCount + 1
            }
          : act
      )
    );

    if (user?.uid) {
      const res = await toggleActivityLike(activityId, user.uid, currentLikesCount);
      setActivities((prev) =>
        prev.map((act) =>
          act.id === activityId
            ? { ...act, isLiked: res.isLiked, likesCount: res.likesCount }
            : act
        )
      );
    }
  };

  // Comment Add (Optimistic + Supabase Sync)
  const handleAddComment = async (activityId: string, text: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const target = activities.find((a) => a.id === activityId);
    if (!target) return;

    const newCommentObj = {
      id: 'cm_' + Date.now(),
      userId: user.uid,
      userName: user.fullName || 'Atleta ClubSport',
      userAvatar: user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      text,
      createdAt: 'Agora'
    };

    setActivities((prev) =>
      prev.map((act) =>
        act.id === activityId
          ? {
              ...act,
              commentsCount: act.commentsCount + 1,
              comments: [...act.comments, newCommentObj]
            }
          : act
      )
    );

    const res = await addActivityComment(
      activityId,
      user.uid,
      user.fullName || 'Atleta ClubSport',
      user.avatarUrl || '',
      text,
      target.commentsCount || 0
    );

    if (res.success) {
      setActivities((prev) =>
        prev.map((act) =>
          act.id === activityId
            ? { ...act, commentsCount: res.newCommentsCount }
            : act
        )
      );
    }
  };

  // Delete Activity (Optimistic + Supabase Sync)
  const handleDeleteActivity = async (activityId: string) => {
    setActivities((prev) => prev.filter((act) => act.id !== activityId));
    await deleteActivity(activityId);
  };

  // Edit Activity Caption (Optimistic + Supabase Sync)
  const handleEditActivity = async (activityId: string, newCaption: string) => {
    setActivities((prev) =>
      prev.map((act) =>
        act.id === activityId ? { ...act, caption: newCaption } : act
      )
    );
    await updateActivityCaption(activityId, newCaption);
  };

  // Challenge Join (Optimistic + Supabase Sync)
  const handleToggleJoinChallenge = async (challengeId: string) => {
    const target = challenges.find((c) => c.id === challengeId);
    if (!target) return;

    const currentCount = target.joinedUsersCount || 0;

    setChallenges((prev) =>
      prev.map((c) =>
        c.id === challengeId
          ? {
              ...c,
              isJoined: !c.isJoined,
              joinedUsersCount: c.isJoined ? Math.max(0, c.joinedUsersCount - 1) : c.joinedUsersCount + 1
            }
          : c
      )
    );

    if (user?.uid) {
      const res = await toggleChallengeParticipation(challengeId, user.uid, currentCount);
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === challengeId ? { ...c, isJoined: res.isJoined, joinedUsersCount: res.newCount } : c
        )
      );
    }
  };

  // Trigger Push Notification Simulation
  const handleSendSimulatedPush = () => {
    const newNotif: NotificationItem = {
      id: 'n_' + Date.now(),
      userId: user?.uid || 'guest',
      title: '🚨 Alerta de Desafio em Tempo Real',
      message: `${user?.fullName || 'Atleta'} acabou de registrar uma nova atividade no aplicativo!`,
      type: 'challenge',
      read: false,
      createdAt: 'Agora'
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Quick Action Publish
  const handlePublishPost = async (postData: {
    photoUrl: string;
    caption: string;
    locationName?: string;
    lat?: number;
    lng?: number;
  }) => {
    const activeUser = user || {
      uid: 'guest_' + Date.now(),
      fullName: 'Atleta ClubSport',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    };

    let cdnPhotoUrl = postData.photoUrl;
    if (cdnPhotoUrl && cdnPhotoUrl.startsWith('data:')) {
      cdnPhotoUrl = await uploadImageToSupabase(cdnPhotoUrl, 'activities');
    }

    const newAct: ActivityPost = {
      id: 'act_' + Date.now(),
      userId: activeUser.uid,
      userName: activeUser.fullName || 'Atleta ClubSport',
      userAvatar: activeUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      timeAgo: 'Agora',
      sport: 'Running',
      title: 'Nova Atividade Publicada',
      distanceKm: 8.5,
      timeMinutes: 42,
      pace: '4:56 /km',
      calories: 520,
      imageUrl: cdnPhotoUrl,
      hasMap: false,
      likesCount: 1,
      isLiked: true,
      commentsCount: 0,
      comments: [],
      caption: postData.caption,
      locationName: postData.locationName || 'São Paulo, SP, Brasil',
      lat: postData.lat ?? -23.55052,
      lng: postData.lng ?? -46.633308,
      createdAt: new Date().toISOString()
    };
    setActivities((prev) => [newAct, ...prev]);

    try {
      await createActivity(newAct);
    } catch (err) {
      console.warn('Could not persist activity to Supabase:', err);
    }

    setCurrentView('home');
    setActiveTab('home');
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <div id="app-wrapper" className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans selection:bg-orange-500 selection:text-black transition-colors duration-200">
      {/* Sticky Top Header */}
      <Header
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenSettings={() => setCurrentView('settings')}
        onOpenEditProfile={() => setCurrentView('edit_profile')}
        unreadCount={unreadNotifCount}
      />

      {/* Primary Container */}
      <main className="max-w-lg mx-auto pt-3">
        {currentView === 'home' && (
          <FeedView
            activities={activities}
            onToggleLike={handleToggleLike}
            onAddComment={handleAddComment}
            onOpenCommunityChat={() => setCurrentView('community_chat')}
            onOpenCapture={() => setCurrentView('capture')}
            onOpenTracker={() => setCurrentView('tracker')}
            onDeleteActivity={handleDeleteActivity}
            onEditActivity={handleEditActivity}
            onOpenUserProfile={handleOpenUserProfile}
          />
        )}

        {currentView === 'search' && (
          <LeaderboardView
            athletes={initialLeaderboard}
            communities={communities}
            onOpenCommunityChat={() => setCurrentView('community_chat')}
            onOpenUserProfile={handleOpenUserProfile}
          />
        )}

        {currentView === 'challenges' && (
          <ChallengesView
            challenges={challenges}
            communities={communities}
            onToggleJoinChallenge={handleToggleJoinChallenge}
            onOpenAnalytics={() => setCurrentView('analytics')}
            onOpenCommunityChat={() => setCurrentView('community_chat')}
            onOpenCreateCommunity={() => setCurrentView('create_community')}
            onOpenCreateChallenge={() => setCurrentView('create_challenge')}
            onStartRunForChallenge={(challengeId) => {
              setSelectedTrackerChallengeId(challengeId);
              handleToggleJoinChallenge(challengeId);
              setCurrentView('tracker');
            }}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            challenges={challenges}
            activities={activities}
            onOpenEditProfile={() => setCurrentView('edit_profile')}
            onOpenConnectWatch={() => setIsConnectWatchOpen(true)}
            onOpenAdminDashboard={() => setCurrentView('admin')}
            onOpenAnalytics={() => setCurrentView('analytics')}
            onOpenSettings={() => setCurrentView('settings')}
            onOpenCommunityChat={() => setCurrentView('community_chat')}
            onOpenUserProfile={handleOpenUserProfile}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            onBack={() => setCurrentView('profile')}
            onOpenEditProfile={() => setCurrentView('edit_profile')}
            onOpenConnectWatch={() => setIsConnectWatchOpen(true)}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView
            activities={activities}
            challenges={challenges}
            onBack={() => setCurrentView('challenges')}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboardView onBack={() => setCurrentView('profile')} />
        )}

        {currentView === 'capture' && (
          <CaptureView
            onNextToUpload={(url) => {
              setCapturedPhotoUrl(url);
              setCurrentView('upload');
            }}
            onClose={() => setCurrentView('home')}
          />
        )}

        {currentView === 'upload' && (
          <QuickUploadView
            initialPhotoUrl={capturedPhotoUrl}
            onPublish={handlePublishPost}
            onBack={() => setCurrentView('home')}
          />
        )}

        {currentView === 'edit_profile' && (
          <EditProfileView onBack={() => setCurrentView('profile')} />
        )}

        {currentView === 'create_community' && (
          <CreateCommunityView
            onCancel={() => setCurrentView('challenges')}
            onCreate={async (newComm) => {
              const fullCommunity: Community = {
                id: 'comm_' + Date.now(),
                name: newComm.name,
                description: newComm.description,
                location: newComm.location || 'Brasil',
                sportCategory: newComm.sportCategory,
                privacy: newComm.privacy,
                membersCount: 1,
                coverUrl: newComm.coverUrl,
                createdBy: user?.fullName || 'Atleta ClubSport',
                createdAt: new Date().toISOString()
              };
              setCommunities((prev) => [fullCommunity, ...prev]);
              try {
                await createCommunity(fullCommunity);
              } catch (err) {
                console.warn('Could not persist community to Supabase:', err);
              }
              setCurrentView('challenges');
              setActiveTab('challenges');
            }}
          />
        )}

        {currentView === 'community_chat' && (
          <CommunityChatView
            onBack={() => setCurrentView('home')}
            onOpenUserProfile={handleOpenUserProfile}
          />
        )}

        {currentView === 'create_challenge' && (
          <CreateChallengeView
            onCancel={() => setCurrentView('challenges')}
            onCreate={async (newChallenge) => {
              setChallenges((prev) => [newChallenge, ...prev]);
              try {
                await createChallenge(newChallenge);
              } catch (err) {
                console.warn('Could not persist challenge to Supabase:', err);
              }
              setCurrentView('challenges');
              setActiveTab('challenges');
            }}
          />
        )}

        {currentView === 'tracker' && (
          <LiveTrackerView
            challenges={challenges}
            initialChallengeId={selectedTrackerChallengeId}
            onFinishRun={async (newActivity) => {
              setActivities((prev) => [newActivity, ...prev]);

              try {
                await createActivity(newActivity);
              } catch (err) {
                console.warn('Could not save activity to Supabase:', err);
              }

              // Update challenge state if run was linked to a challenge
              if (newActivity.challengeId) {
                setChallenges((prev) =>
                  prev.map((c) => {
                    if (c.id === newActivity.challengeId) {
                      const updatedValue = parseFloat(((c.currentValue || 0) + newActivity.distanceKm).toFixed(2));
                      const isCompleted = updatedValue >= c.targetValue;
                      return {
                        ...c,
                        currentValue: updatedValue,
                        isJoined: true,
                        status: isCompleted ? 'completed' : c.status
                      };
                    }
                    return c;
                  })
                );
              }

              // Update logged-in User profile statistics
              if (user) {
                updateProfile({
                  totalKm: parseFloat(((user.totalKm || 0) + newActivity.distanceKm).toFixed(2)),
                  points: (user.points || 0) + Math.round(newActivity.distanceKm * 20),
                  activeDays: (user.activeDays || 0) + 1
                });
              }

              // Trigger notification
              const newNotif: NotificationItem = {
                id: 'n_' + Date.now(),
                userId: user?.uid || 'guest',
                title: '🏆 Desafio & Estatísticas Atualizadas!',
                message: `Corrida de ${newActivity.distanceKm} km registrada! Os dados foram vinculados ${newActivity.challengeId ? 'ao Desafio' : 'ao seu histórico'} e sincronizados com o Firestore.`,
                type: 'challenge',
                read: false,
                createdAt: 'Agora'
              };
              setNotifications((prev) => [newNotif, ...prev]);
            }}
            onClose={() => {
              setSelectedTrackerChallengeId(undefined);
              setCurrentView('home');
            }}
            onOpenConnectWatch={() => setIsConnectWatchOpen(true)}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onQuickPlusClick={() => setCurrentView('capture')}
      />

      {/* Modals & Drawers */}
      {isFirebasePlanOpen && (
        <FirebaseSetupGuideModal onClose={() => setIsFirebasePlanOpen(false)} />
      )}

      {isNotificationsOpen && (
        <NotificationsDrawer
          notifications={notifications}
          onClose={() => setIsNotificationsOpen(false)}
          onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
          onSendSimulatedPush={handleSendSimulatedPush}
        />
      )}

      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} />
      )}

      {isConnectWatchOpen && (
        <ConnectWatchModal onClose={() => setIsConnectWatchOpen(false)} />
      )}

      {selectedUserProfile && (
        <UserProfileModal
          targetUser={selectedUserProfile}
          onClose={() => setSelectedUserProfile(null)}
          activities={activities}
          onOpenCommunityChat={() => {
            setSelectedUserProfile(null);
            setCurrentView('community_chat');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <OfflineProvider>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </OfflineProvider>
    </ThemeProvider>
  );
}
