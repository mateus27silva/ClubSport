import React, { useState, useEffect } from 'react';
import { 
  db, 
  collection, 
  onSnapshot, 
  addDoc, 
  setDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  getDocFromServer,
  handleFirestoreError,
  OperationType 
} from './lib/firebase';
import { ThemeProvider } from './context/ThemeContext';
import { OfflineProvider } from './context/OfflineContext';
import { AuthProvider, useAuth } from './context/AuthContext';

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
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [currentView, setCurrentView] = useState<string>('home'); // 'home', 'search', 'challenges', 'profile', 'analytics', 'admin', 'capture', 'upload', 'edit_profile', 'create_community', 'community_chat'

  // Data State
  const [activities, setActivities] = useState<ActivityPost[]>(initialActivities);
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);
  const [communities, setCommunities] = useState<Community[]>(initialCommunities);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string>('');
  const [selectedTrackerChallengeId, setSelectedTrackerChallengeId] = useState<string | undefined>();

  // Validate connection to Firestore on initial boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log('Firestore server connection verified.');
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error('Please check your Firebase configuration.');
        }
      }
    }
    testConnection();
  }, []);

  // Real-time Firestore sync for activities, challenges, communities, and notifications
  useEffect(() => {
    const unsubActivities = onSnapshot(
      collection(db, 'activities'),
      (snapshot) => {
        if (!snapshot.empty) {
          const fetched = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ActivityPost, 'id'>)
          }));
          setActivities(fetched);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'activities')
    );

    const unsubChallenges = onSnapshot(
      collection(db, 'challenges'),
      (snapshot) => {
        if (!snapshot.empty) {
          const fetched = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Challenge, 'id'>)
          }));
          setChallenges(fetched);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'challenges')
    );

    const unsubCommunities = onSnapshot(
      collection(db, 'communities'),
      (snapshot) => {
        if (!snapshot.empty) {
          const fetched = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Community, 'id'>)
          }));
          setCommunities(fetched);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'communities')
    );

    const unsubNotifs = onSnapshot(
      collection(db, 'notifications'),
      (snapshot) => {
        if (!snapshot.empty) {
          const fetched = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<NotificationItem, 'id'>)
          }));
          setNotifications(fetched);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'notifications')
    );

    return () => {
      unsubActivities();
      unsubChallenges();
      unsubCommunities();
      unsubNotifs();
    };
  }, []);

  // Modals
  const [isFirebasePlanOpen, setIsFirebasePlanOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isConnectWatchOpen, setIsConnectWatchOpen] = useState<boolean>(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState<boolean>(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<TargetUserProfileInfo | null>(null);

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

  // Like Toggle
  const handleToggleLike = (activityId: string) => {
    setActivities((prev) =>
      prev.map((act) =>
        act.id === activityId
          ? {
              ...act,
              isLiked: !act.isLiked,
              likesCount: act.isLiked ? act.likesCount - 1 : act.likesCount + 1
            }
          : act
      )
    );
  };

  // Comment Add
  const handleAddComment = (activityId: string, text: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setActivities((prev) =>
      prev.map((act) =>
        act.id === activityId
          ? {
              ...act,
              commentsCount: act.commentsCount + 1,
              comments: [
                ...act.comments,
                {
                  id: 'cm_' + Date.now(),
                  userId: user.uid,
                  userName: user.fullName || 'Atleta ClubSport',
                  userAvatar: user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                  text,
                  createdAt: 'Agora'
                }
              ]
            }
          : act
      )
    );
  };

  // Delete Activity
  const handleDeleteActivity = (activityId: string) => {
    setActivities((prev) => prev.filter((act) => act.id !== activityId));
  };

  // Edit Activity Caption
  const handleEditActivity = (activityId: string, newCaption: string) => {
    setActivities((prev) =>
      prev.map((act) =>
        act.id === activityId ? { ...act, caption: newCaption } : act
      )
    );
  };

  // Challenge Join (Once joined, user cannot leave)
  const handleToggleJoinChallenge = (challengeId: string) => {
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === challengeId ? { ...c, isJoined: true } : c
      )
    );
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
      imageUrl: postData.photoUrl,
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
      await addDoc(collection(db, 'activities'), newAct);
    } catch (err) {
      console.warn('Could not persist activity to Firestore:', err);
    }

    setCurrentView('home');
    setActiveTab('home');
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <div id="app-wrapper" className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-orange-500 selection:text-black">
      {/* Sticky Top Header */}
      <Header
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenFirebasePlan={() => setIsFirebasePlanOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
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
            onOpenCommunityChat={() => setCurrentView('community_chat')}
            onOpenUserProfile={handleOpenUserProfile}
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
                await addDoc(collection(db, 'communities'), fullCommunity);
              } catch (err) {
                console.warn('Could not persist community to Firestore:', err);
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
                await addDoc(collection(db, 'challenges'), newChallenge);
              } catch (err) {
                console.warn('Could not persist challenge to Firestore:', err);
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
                await addDoc(collection(db, 'activities'), newActivity);
              } catch (err) {
                console.warn('Could not save activity to Firestore:', err);
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
        onQuickPlusClick={() => setIsQuickMenuOpen(true)}
      />

      {/* Quick Action Popup Menu */}
      {isQuickMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl p-5 text-white space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-center text-zinc-400">Menu Rápido</h3>
            <div className="grid grid-cols-1 gap-2 text-xs font-bold">
              <button
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  setCurrentView('challenges');
                  setActiveTab('challenges');
                }}
                className="py-3.5 bg-orange-500 text-zinc-950 font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-orange-600 shadow-lg text-sm"
              >
                🏆 Ir para Desafios (Iniciar Corrida)
              </button>
              <button
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  setCurrentView('capture');
                }}
                className="py-3 bg-zinc-800 text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-700"
              >
                📸 Abrir Câmera & Foto (Capture)
              </button>
              <button
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  setCurrentView('upload');
                }}
                className="py-3 bg-zinc-800 text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-700"
              >
                🖼️ Upload Rápido de Treino (Quick Upload)
              </button>
              <button
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  setCurrentView('create_challenge');
                }}
                className="py-3 bg-zinc-800 text-orange-400 border border-orange-500/30 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-700"
              >
                🏆 Publicar Desafio
              </button>
              <button
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  setCurrentView('create_community');
                }}
                className="py-3 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-700 hover:text-white"
              >
                👥 Criar Nova Comunidade
              </button>
            </div>
            <button
              onClick={() => setIsQuickMenuOpen(false)}
              className="w-full py-2 text-xs text-zinc-400 font-bold hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

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
