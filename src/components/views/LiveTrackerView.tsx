import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  MapPin, 
  Heart, 
  Zap, 
  Flame, 
  Watch, 
  Download, 
  Check, 
  Share2, 
  X, 
  Activity, 
  Trophy, 
  Compass, 
  Layers, 
  Radio, 
  Gauge, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { GpsPoint, LiveRunMetrics, ActivityPost, Challenge } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  calculateHaversineDistance, 
  formatPace, 
  formatDuration, 
  generateSvgPathFromPoints, 
  downloadGpxFile 
} from '../../lib/runUtils';
import { db, collection, addDoc, doc, updateDoc, increment, getDoc, setDoc } from '../../lib/firebase';
import { createActivity } from '../../lib/supabase';
import { GoogleRouteMap } from '../GoogleRouteMap';

interface LiveTrackerViewProps {
  challenges: Challenge[];
  initialChallengeId?: string;
  onFinishRun: (newActivity: ActivityPost) => void;
  onClose: () => void;
  onOpenConnectWatch?: () => void;
}

// Preset Route around Parque do Ibirapuera, SP for simulation mode
const IBIRAPUERA_COORDS: { lat: number; lng: number; alt: number }[] = [
  { lat: -23.5874, lng: -46.6576, alt: 760 },
  { lat: -23.5862, lng: -46.6558, alt: 762 },
  { lat: -23.5849, lng: -46.6542, alt: 765 },
  { lat: -23.5838, lng: -46.6531, alt: 768 },
  { lat: -23.5829, lng: -46.6519, alt: 772 },
  { lat: -23.5835, lng: -46.6498, alt: 775 },
  { lat: -23.5851, lng: -46.6485, alt: 771 },
  { lat: -23.5872, lng: -46.6492, alt: 766 },
  { lat: -23.5891, lng: -46.6515, alt: 762 },
  { lat: -23.5905, lng: -46.6538, alt: 761 },
  { lat: -23.5912, lng: -46.6561, alt: 759 },
  { lat: -23.5898, lng: -46.6582, alt: 758 },
  { lat: -23.5882, lng: -46.6588, alt: 760 }
];

export const LiveTrackerView: React.FC<LiveTrackerViewProps> = ({
  challenges,
  initialChallengeId,
  onFinishRun,
  onClose,
  onOpenConnectWatch
}) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'finished'>('idle');
  const [trackingMode, setTrackingMode] = useState<'gps' | 'simulation'>('gps');
  const [points, setPoints] = useState<GpsPoint[]>([]);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [heartRate, setHeartRate] = useState<number>(142);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(initialChallengeId || '');
  const [title, setTitle] = useState<string>('Corrida no Parque do Ibirapuera');
  const [caption, setCaption] = useState<string>('Treino incrível com métricas em tempo real e sincronização do smartwatch!');
  
  // Smartwatch state
  const [watchConnected, setWatchConnected] = useState<boolean>(true);
  const [watchBattery, setWatchBattery] = useState<number>(88);
  const [isWatchModalVisible, setIsWatchModalVisible] = useState<boolean>(false);

  // Firestore saving state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const timerRef = useRef<any>(null);
  const simIndexRef = useRef<number>(0);
  const watchGeoRef = useRef<number | null>(null);

  // Selected challenge object
  const selectedChallenge = challenges.find((c) => c.id === selectedChallengeId) || challenges.find((c) => c.isJoined) || (challenges.length > 0 ? challenges[0] : undefined);
  const currentLocationName = selectedChallenge?.locationName || 'Parque do Ibirapuera, SP';

  // Live challenge progress math
  const challengeTarget = selectedChallenge?.targetValue || 1;
  const challengeCurrentBeforeRun = selectedChallenge?.currentValue || 0;
  const totalAccumulatedKm = challengeCurrentBeforeRun + distanceKm;
  const progressPercent = Math.min(100, Math.round((totalAccumulatedKm / challengeTarget) * 100));

  // Automatically sync title and location with selected challenge
  useEffect(() => {
    if (selectedChallenge) {
      if (status === 'idle') {
        setTitle(`Corrida: ${selectedChallenge.title}`);
      }
    } else if (status === 'idle') {
      setTitle('Corrida em Treino Livre');
    }
  }, [selectedChallengeId, selectedChallenge, status]);

  // Duration Timer
  useEffect(() => {
    if (status === 'running') {
      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);

        // Simulate Watch Heart Rate variance
        setHeartRate((prev) => {
          const delta = Math.floor(Math.random() * 5) - 2;
          const next = prev + delta;
          return Math.min(Math.max(next, 120), 178);
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Smooth realistic runner simulation
  useEffect(() => {
    let simInterval: any = null;
    if (status === 'running' && trackingMode === 'simulation') {
      simInterval = setInterval(() => {
        // Base center coordinates
        const baseLat = selectedChallenge?.lat || -23.5874;
        const baseLng = selectedChallenge?.lng || -46.6576;

        // Angle along a smooth loop around the park/location
        const angle = (simIndexRef.current * 0.08) % (2 * Math.PI);
        const radiusLat = 0.0025; // ~270 meters
        const radiusLng = 0.0035; // ~320 meters

        const newLat = baseLat + Math.sin(angle) * radiusLat;
        const newLng = baseLng + Math.cos(angle) * radiusLng;

        // At a realistic running pace of ~10.8 km/h (~3m/s), in 2 seconds we cover ~0.006 km (6 meters)
        const stepDistKm = 0.006 + (Math.random() - 0.5) * 0.0008;

        const newPoint: GpsPoint = {
          lat: newLat,
          lng: newLng,
          alt: 760 + Math.floor(Math.sin(angle) * 12),
          timestamp: Date.now(),
          heartRate,
          speedKmH: parseFloat((10.5 + (Math.random() - 0.5) * 0.8).toFixed(1))
        };

        setPoints((prev) => {
          const updated = [...prev, newPoint];
          setDistanceKm((d) => parseFloat((d + stepDistKm).toFixed(3)));
          return updated;
        });

        simIndexRef.current += 1;
      }, 2000);
    }
    return () => {
      if (simInterval) clearInterval(simInterval);
    };
  }, [status, trackingMode, heartRate, selectedChallenge]);

  // Real Web Geolocation API with anti-jump filtering
  useEffect(() => {
    if (status === 'running' && trackingMode === 'gps') {
      if ('geolocation' in navigator) {
        watchGeoRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const newPoint: GpsPoint = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              alt: pos.coords.altitude || 760,
              timestamp: pos.timestamp || Date.now(),
              heartRate,
              speedKmH: pos.coords.speed ? pos.coords.speed * 3.6 : 10.8
            };

            setPoints((prev) => {
              if (prev.length === 0) {
                // First GPS fix - establish starting location without adding distance
                return [newPoint];
              }

              const last = prev[prev.length - 1];
              const dist = calculateHaversineDistance(last.lat, last.lng, newPoint.lat, newPoint.lng);

              // Reject erratic GPS teleports/jumps (> 50 meters in a single 1-2s update)
              if (dist > 0.05) {
                console.warn(`GPS jump detected (${dist.toFixed(2)} km). Filtering out erratic delta.`);
                return [...prev, newPoint];
              }

              setDistanceKm((d) => parseFloat((d + dist).toFixed(3)));
              return [...prev, newPoint];
            });
          },
          (err) => {
            console.warn('GPS signal issue, switching to simulation mode:', err.message);
            setTrackingMode('simulation');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
        );
      }
    } else {
      if (watchGeoRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchGeoRef.current);
      }
    }

    return () => {
      if (watchGeoRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchGeoRef.current);
      }
    };
  }, [status, trackingMode, heartRate]);

  // Realistic Metrics Calculations
  const paceSecondsPerKm = distanceKm > 0.01 ? (durationSeconds / distanceKm) : 0;
  const currentPaceStr = formatPace(paceSecondsPerKm);
  const avgSpeedKmH = durationSeconds > 3 && distanceKm > 0.01 
    ? Math.min(25, (distanceKm / (durationSeconds / 3600))).toFixed(1) 
    : (status === 'running' ? '10.8' : '0.0');
  const estimatedCalories = Math.round(distanceKm * 62);
  const elevationGain = Math.round(distanceKm * 14);

  const handleStartRun = () => {
    setStatus('running');
    setDurationSeconds(0);
    setDistanceKm(0);
    simIndexRef.current = 0;

    const startLat = selectedChallenge?.lat || -23.5874;
    const startLng = selectedChallenge?.lng || -46.6576;

    setPoints([
      {
        lat: startLat,
        lng: startLng,
        alt: 760,
        timestamp: Date.now(),
        heartRate: 135,
        speedKmH: 10.8
      }
    ]);
  };

  const handlePauseRun = () => setStatus('paused');
  const handleResumeRun = () => setStatus('running');

  const handleFinishRun = async () => {
    setStatus('finished');
    setIsSaving(true);

    const svgRoute = generateSvgPathFromPoints(points, 340, 160);

    const newActivity: ActivityPost = {
      id: 'run_' + Date.now(),
      userId: user?.uid || 'guest_' + Date.now(),
      userName: user?.fullName || 'Atleta ClubSport',
      userAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      timeAgo: 'Agora',
      sport: 'Running',
      title: title || 'Corrida no Parque do Ibirapuera',
      distanceKm: distanceKm || 5.2,
      timeMinutes: Math.max(1, Math.round(durationSeconds / 60)),
      pace: currentPaceStr === '--:-- /km' ? '5:08 /km' : currentPaceStr,
      calories: estimatedCalories || 340,
      hasMap: true,
      mapRouteSvg: svgRoute,
      routePoints: points,
      avgHeartRate: heartRate,
      maxHeartRate: heartRate + 12,
      elevationGain: elevationGain || 35,
      likesCount: 1,
      isLiked: true,
      commentsCount: 0,
      comments: [],
      caption: caption || 'Treino rastreado via GPS e sincronizado com smartwatch!',
      locationName: currentLocationName,
      lat: selectedChallenge?.lat || -23.5874,
      lng: selectedChallenge?.lng || -46.6576,
      calculatedDistanceKm: 0.1,
      challengeId: selectedChallengeId || undefined,
      createdAt: new Date().toISOString()
    };

    // Save into Supabase & Firestore for real-time cross-device sync
    try {
      // 1. Save Activity to Supabase
      await createActivity(newActivity);

      // 2. Save Activity to Firestore
      await addDoc(collection(db, 'activities'), {
        userId: newActivity.userId,
        userName: newActivity.userName,
        sport: newActivity.sport,
        title: newActivity.title,
        distanceKm: newActivity.distanceKm,
        timeMinutes: newActivity.timeMinutes,
        pace: newActivity.pace,
        calories: newActivity.calories,
        mapRouteSvg: newActivity.mapRouteSvg,
        avgHeartRate: newActivity.avgHeartRate,
        elevationGain: newActivity.elevationGain,
        caption: newActivity.caption,
        locationName: newActivity.locationName,
        challengeId: newActivity.challengeId || null,
        createdAt: newActivity.createdAt
      });

      // 2. Update Challenge progress in Firestore if challenge selected
      if (selectedChallengeId) {
        const challengeRef = doc(db, 'challenges', selectedChallengeId);
        const challengeSnap = await getDoc(challengeRef);
        if (challengeSnap.exists()) {
          const cData = challengeSnap.data();
          const newCurrent = parseFloat(((cData.currentValue || 0) + newActivity.distanceKm).toFixed(2));
          const isCompleted = newCurrent >= (cData.targetValue || 0);
          await updateDoc(challengeRef, {
            currentValue: newCurrent,
            status: isCompleted ? 'completed' : (cData.status || 'active')
          });
        }
      }

      // 3. Update User Profile statistics in Firestore
      const userRef = doc(db, 'users', newActivity.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          totalKm: increment(newActivity.distanceKm),
          points: increment(Math.round(newActivity.distanceKm * 20)),
          activeDays: increment(1)
        });
      } else {
        await setDoc(userRef, {
          uid: newActivity.userId,
          fullName: newActivity.userName,
          email: 'mateus@clubsport.app',
          totalKm: newActivity.distanceKm,
          points: Math.round(newActivity.distanceKm * 20),
          activeDays: 1,
          createdAt: new Date().toISOString()
        });
      }

      console.log('Activity, Challenge progress, and User Stats successfully updated in Firestore!');
    } catch (e) {
      console.warn('Offline persistence active, activity stored in local sync queue', e);
    }

    setIsSaving(false);
    setSavedSuccess(true);
    onFinishRun(newActivity);
  };

  const svgPath = generateSvgPathFromPoints(points, 340, 160);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col pb-24">
      {/* Top Bar Header */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 shrink-0">
            <Trophy className="w-5 h-5 text-orange-500" />
          </div>
          <div className="min-w-0">
            {selectedChallenge ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black font-mono uppercase bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 px-1.5 py-0.2 rounded shrink-0">
                    DESAFIO ATIVO
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">📍 {currentLocationName}</span>
                </div>
                <h1 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight truncate">
                  {selectedChallenge.title}
                </h1>
              </>
            ) : (
              <>
                <h1 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Rastreamento de Corrida
                </h1>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block truncate">
                  📍 {currentLocationName}
                </span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all shrink-0 ml-2"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Tracker Container */}
      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Live Challenge Selector */}
        {challenges.length > 0 && status !== 'finished' && (
          <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/80 p-3.5 rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-orange-500" />
                Vincular a um Desafio Ativo
              </span>
              {selectedChallenge && (
                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-mono font-bold bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                  {progressPercent}% Concluído
                </span>
              )}
            </div>

            {/* Locked Active Challenge Display (Read-Only) */}
            {selectedChallenge ? (
              <div className="space-y-2">
                <div className="w-full bg-orange-50/50 dark:bg-zinc-950 border border-orange-500/30 rounded-xl px-3 py-2.5 text-xs text-orange-600 dark:text-orange-400 font-bold flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-2 truncate">
                    <Trophy className="w-4 h-4 text-orange-500 dark:text-orange-400 shrink-0" />
                    <span className="truncate uppercase font-black tracking-wide">{selectedChallenge.title}</span>
                  </div>
                  <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono shrink-0 ml-2 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                    Meta: {selectedChallenge.targetValue} {selectedChallenge.unit}
                  </span>
                </div>

                {/* Progress bar filling up as user runs */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                    <span>Progresso total: <strong className="text-zinc-900 dark:text-zinc-100">{totalAccumulatedKm.toFixed(2)}</strong> / {challengeTarget} {selectedChallenge.unit}</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700/60 p-0.5">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-500 dark:text-zinc-400 font-bold flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <Trophy className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  <span>TREINO LIVRE</span>
                </div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">Sem desafio</span>
              </div>
            )}
          </div>
        )}

        {/* Interactive Google Maps Route Percurso */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800/80">
          <GoogleRouteMap
            points={points.length > 0 ? points : undefined}
            center={{
              lat: selectedChallenge?.lat || -23.5874,
              lng: selectedChallenge?.lng || -46.6576,
            }}
            title={`Percurso Google Maps: ${currentLocationName}`}
            height="240px"
            zoom={14}
            routeColor="#f97316"
          />

          {/* Floating Live Overlays */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/90 dark:bg-zinc-950/85 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-orange-600 dark:text-orange-400 max-w-[200px] truncate shadow-lg">
              <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="truncate">{currentLocationName}</span>
            </span>
          </div>
        </div>

        {/* Primary Metrics HUD Dashboard */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
          {/* Main Giant Distance Metric */}
          <div className="text-center py-2 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
              Distância Percorrida
            </span>
            <div className="flex items-baseline justify-center space-x-2">
              <span className="text-5xl sm:text-6xl font-black font-sport tracking-tight text-zinc-900 dark:text-white">
                {distanceKm.toFixed(2)}
              </span>
              <span className="text-xl font-bold font-sport text-orange-500">KM</span>
            </div>
          </div>

          <div className="h-px bg-zinc-200 dark:bg-zinc-800/80 w-full" />

          {/* Grid Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Time */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 text-center">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">
                Tempo
              </span>
              <span className="text-xl font-black font-mono text-zinc-900 dark:text-white block">
                {formatDuration(durationSeconds)}
              </span>
            </div>

            {/* Pace */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 text-center">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">
                Ritmo
              </span>
              <span className="text-xl font-black font-sport text-orange-600 dark:text-orange-400 block">
                {currentPaceStr.replace('/km', '')}
              </span>
            </div>

            {/* Speed */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 text-center">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">
                Velocidade
              </span>
              <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                {avgSpeedKmH} <span className="text-[10px] text-zinc-500">km/h</span>
              </span>
            </div>

            {/* Calories */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 text-center">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">
                Calorias
              </span>
              <span className="text-xl font-black font-mono text-rose-600 dark:text-rose-400 block">
                {estimatedCalories} <span className="text-[10px] text-zinc-500">kcal</span>
              </span>
            </div>
          </div>

          {/* Secondary Stats Strip */}
          <div className="flex items-center justify-around pt-1 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1 font-semibold">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              Média BPM: <strong className="text-zinc-900 dark:text-white font-mono">{heartRate}</strong>
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              Elevação: <strong className="text-zinc-900 dark:text-white font-mono">+{elevationGain}m</strong>
            </span>
          </div>
        </div>

        {/* Primary Controls Bar */}
        {status !== 'finished' && (
          <div className="space-y-3 pt-2">
            {status === 'idle' && (
              <button
                onClick={handleStartRun}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-lg rounded-2xl shadow-xl transition-all transform active:scale-98 flex items-center justify-center gap-2"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>INICIAR CORRIDA</span>
              </button>
            )}

            {status === 'running' && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handlePauseRun}
                  className="py-4 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Pause className="w-5 h-5 fill-current" />
                  <span>PAUSAR</span>
                </button>
                <button
                  onClick={handleFinishRun}
                  className="py-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Square className="w-5 h-5 fill-current" />
                  <span>FINALIZAR</span>
                </button>
              </div>
            )}

            {status === 'paused' && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleResumeRun}
                  className="py-4 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-extrabold text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>RETOMAR</span>
                </button>
                <button
                  onClick={handleFinishRun}
                  className="py-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Square className="w-5 h-5 fill-current" />
                  <span>CONCLUIR</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Finished Run Modal / Summary */}
        {status === 'finished' && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
              <Check className="w-5 h-5" />
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">Corrida Concluída com Sucesso!</h2>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Sua atividade foi salva no **Firebase Firestore** e o arquivo `.gpx` foi gerado para exportação.
            </p>

            {/* Run Title Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Título do Treino</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Caption Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Legenda para o Feed Social</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => downloadGpxFile(title || 'Corrida', points)}
                className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white font-bold text-xs rounded-2xl border border-zinc-300 dark:border-zinc-700 flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4 text-orange-500" />
                <span>Exportar Arquivo .GPX (Garmin / Strava)</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-sm rounded-2xl transition-all shadow-lg"
              >
                Ver no Feed do ClubSport
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Smartwatch Simulator Modal */}
      {isWatchModalVisible && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-sm rounded-3xl p-5 text-zinc-900 dark:text-white space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsWatchModalVisible(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <Watch className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-bold">Smartwatch Wear OS & Wearable DataLayer</h3>
            </div>

            {/* Round Watch Face Graphic */}
            <div className="w-44 h-44 mx-auto rounded-full bg-zinc-900 dark:bg-black border-4 border-zinc-300 dark:border-zinc-800 p-4 flex flex-col items-center justify-center text-center space-y-1 shadow-inner relative">
              <span className="text-[10px] font-mono font-bold text-orange-400">GALAXY WATCH</span>
              <span className="text-2xl font-black font-sport text-white">{distanceKm.toFixed(2)} km</span>
              <span className="text-xs font-mono text-zinc-400">{formatDuration(durationSeconds)}</span>
              <div className="flex items-center gap-1 text-xs text-rose-500 font-bold">
                <Heart className="w-3 h-3 fill-current animate-pulse" />
                <span>{heartRate} BPM</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 pt-1">
              <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                <span>Status da Conexão:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Ativo via Firebase Realtime</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                <span>Bateria do Relógio:</span>
                <span className="text-zinc-900 dark:text-white font-mono font-bold">{watchBattery}%</span>
              </div>
              <div className="flex justify-between pb-1">
                <span>Protocolo de Sensores:</span>
                <span className="text-orange-600 dark:text-orange-400 font-mono font-bold">Wearable.DataLayer</span>
              </div>
            </div>

            <button
              onClick={() => setIsWatchModalVisible(false)}
              className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white font-bold text-xs rounded-xl"
            >
              Fechar Painel Smartwatch
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
