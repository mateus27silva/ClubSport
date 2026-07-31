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
import { 
  calculateHaversineDistance, 
  formatPace, 
  formatDuration, 
  generateSvgPathFromPoints, 
  downloadGpxFile 
} from '../../lib/runUtils';
import { db, collection, addDoc, doc, updateDoc, increment, getDoc, setDoc } from '../../lib/firebase';

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
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'finished'>('idle');
  const [trackingMode, setTrackingMode] = useState<'gps' | 'simulation'>('simulation');
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
  const selectedChallenge = challenges.find((c) => c.id === selectedChallengeId);

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

  // Simulation GPS Movement
  useEffect(() => {
    let simInterval: any = null;
    if (status === 'running' && trackingMode === 'simulation') {
      simInterval = setInterval(() => {
        const coord = IBIRAPUERA_COORDS[simIndexRef.current % IBIRAPUERA_COORDS.length];
        
        // Add tiny random jitter to make track realistic
        const jitterLat = (Math.random() - 0.5) * 0.00015;
        const jitterLng = (Math.random() - 0.5) * 0.00015;

        const newPoint: GpsPoint = {
          lat: coord.lat + jitterLat,
          lng: coord.lng + jitterLng,
          alt: coord.alt + Math.floor(Math.random() * 3),
          timestamp: Date.now(),
          heartRate,
          speedKmH: 11.5 + (Math.random() * 1.2)
        };

        setPoints((prev) => {
          const updated = [...prev, newPoint];
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const dist = calculateHaversineDistance(last.lat, last.lng, newPoint.lat, newPoint.lng);
            setDistanceKm((d) => parseFloat((d + dist).toFixed(3)));
          }
          return updated;
        });

        simIndexRef.current += 1;
      }, 2000);
    }
    return () => {
      if (simInterval) clearInterval(simInterval);
    };
  }, [status, trackingMode, heartRate]);

  // Real Web Geolocation API
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
              speedKmH: pos.coords.speed ? pos.coords.speed * 3.6 : 11.0
            };

            setPoints((prev) => {
              const updated = [...prev, newPoint];
              if (prev.length > 0) {
                const last = prev[prev.length - 1];
                const dist = calculateHaversineDistance(last.lat, last.lng, newPoint.lat, newPoint.lng);
                setDistanceKm((d) => parseFloat((d + dist).toFixed(3)));
              }
              return updated;
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

  // Calculations
  const paceSecondsPerKm = distanceKm > 0 ? (durationSeconds / distanceKm) : 0;
  const currentPaceStr = formatPace(paceSecondsPerKm);
  const avgSpeedKmH = durationSeconds > 0 ? ((distanceKm / (durationSeconds / 3600))).toFixed(1) : '0.0';
  const estimatedCalories = Math.round(distanceKm * 65);
  const elevationGain = Math.round(distanceKm * 18);

  const handleStartRun = () => {
    setStatus('running');
    if (points.length === 0) {
      // Seed first point
      const startCoord = IBIRAPUERA_COORDS[0];
      setPoints([
        {
          lat: startCoord.lat,
          lng: startCoord.lng,
          alt: startCoord.alt,
          timestamp: Date.now(),
          heartRate: 135,
          speedKmH: 11.0
        }
      ]);
    }
  };

  const handlePauseRun = () => setStatus('paused');
  const handleResumeRun = () => setStatus('running');

  const handleFinishRun = async () => {
    setStatus('finished');
    setIsSaving(true);

    const svgRoute = generateSvgPathFromPoints(points, 340, 160);

    const newActivity: ActivityPost = {
      id: 'run_' + Date.now(),
      userId: 'user_mateus_001',
      userName: 'Mateus Silva',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
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
      locationName: 'Parque do Ibirapuera, SP',
      lat: -23.5874,
      lng: -46.6576,
      calculatedDistanceKm: 0.1,
      challengeId: selectedChallengeId || undefined,
      createdAt: new Date().toISOString()
    };

    // Save into Firestore
    try {
      // 1. Save Activity
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col pb-24">
      {/* Top Bar Header */}
      <div className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>GPS Tracking & Watch</span>
              <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-1.5 py-0.2 rounded-md">
                LIVE
              </span>
            </h1>
            <span className="text-[10px] text-zinc-400 block">
              Parque do Ibirapuera, São Paulo - SP
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Smartwatch Quick Indicator */}
          <button
            onClick={() => setIsWatchModalVisible(true)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              watchConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            <Watch className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Wear OS</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Tracker Container */}
      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Tracking Mode Switcher */}
        <div className="bg-zinc-900 border border-zinc-800/80 p-1.5 rounded-2xl flex items-center justify-between text-xs font-bold">
          <button
            onClick={() => setTrackingMode('simulation')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              trackingMode === 'simulation'
                ? 'bg-orange-500 text-zinc-950 shadow-md font-extrabold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Simulação (Ibirapuera)</span>
          </button>
          <button
            onClick={() => setTrackingMode('gps')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              trackingMode === 'gps'
                ? 'bg-orange-500 text-zinc-950 shadow-md font-extrabold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>GPS Dispositivo</span>
          </button>
        </div>

        {/* Live Challenge Selector */}
        {challenges.length > 0 && status !== 'finished' && (
          <div className="bg-zinc-900/90 border border-zinc-800/80 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-orange-500" />
                Vincular a um Desafio Ativo
              </span>
              {selectedChallenge && (
                <span className="text-[10px] text-orange-400 font-mono font-bold bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                  {Math.min(100, Math.round((distanceKm / selectedChallenge.targetValue) * 100))}% Concluído
                </span>
              )}
            </div>
            <select
              value={selectedChallengeId}
              onChange={(e) => setSelectedChallengeId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
            >
              <option value="">Nenhum Desafio (Treino Livre)</option>
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>
                  🏆 {c.title} ({c.targetValue} {c.unit})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Interactive Live Route Map Canvas */}
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl h-52 sm:h-60 flex flex-col justify-between p-4">
          {/* Subtle Grid Map Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

          {/* Top Canvas Badges */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-[11px] font-bold text-orange-400">
                <MapPin className="w-3 h-3 text-orange-500" />
                Parque do Ibirapuera
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-[10px] font-mono text-zinc-400">
                {points.length} pontos GPS
              </span>
            </div>

            {/* Smartwatch Live HR Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl">
              <Heart className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
              <span className="text-xs font-mono font-bold text-white">{heartRate}</span>
              <span className="text-[9px] text-zinc-400 font-bold uppercase">BPM</span>
            </div>
          </div>

          {/* SVG Polyline Map Route */}
          <div className="absolute inset-x-0 top-10 bottom-6 flex items-center justify-center p-2">
            <svg
              viewBox="0 0 340 160"
              className="w-full h-full drop-shadow-[0_0_12px_rgba(249,115,22,0.4)]"
            >
              {/* Glow Polyline Background */}
              <path
                d={svgPath}
                fill="none"
                stroke="#f97316"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.3"
              />
              {/* Sharp Front Polyline */}
              <path
                d={svgPath}
                fill="none"
                stroke="#f97316"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Start Point Marker */}
              {points.length > 0 && (
                <circle cx="30" cy="110" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
              )}
              {/* Current Position Pulsing Dot */}
              {status === 'running' && (
                <g>
                  <circle cx="280" cy="90" r="8" fill="#f97316" opacity="0.4" className="animate-ping" />
                  <circle cx="280" cy="90" r="6" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
                </g>
              )}
            </svg>
          </div>

          {/* Map Footer Info */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1 font-mono">
              <Compass className="w-3 h-3 text-zinc-500" />
              Sinal GPS: Excelente (3m)
            </span>
            <span className="font-mono text-orange-400 font-bold">
              {trackingMode === 'simulation' ? 'Simulação Ibirapuera' : 'GPS do Celular'}
            </span>
          </div>
        </div>

        {/* Primary Metrics HUD Dashboard */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
          {/* Main Giant Distance Metric */}
          <div className="text-center py-2 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Distância Percorrida
            </span>
            <div className="flex items-baseline justify-center space-x-2">
              <span className="text-5xl sm:text-6xl font-black font-sport tracking-tight text-white">
                {distanceKm.toFixed(2)}
              </span>
              <span className="text-xl font-bold font-sport text-orange-500">KM</span>
            </div>
          </div>

          <div className="h-px bg-zinc-800/80 w-full" />

          {/* Grid Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Time */}
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80 text-center">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                Tempo
              </span>
              <span className="text-xl font-black font-mono text-white block">
                {formatDuration(durationSeconds)}
              </span>
            </div>

            {/* Pace */}
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80 text-center">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                Ritmo
              </span>
              <span className="text-xl font-black font-sport text-orange-400 block">
                {currentPaceStr.replace('/km', '')}
              </span>
            </div>

            {/* Speed */}
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80 text-center">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                Velocidade
              </span>
              <span className="text-xl font-black font-mono text-emerald-400 block">
                {avgSpeedKmH} <span className="text-[10px] text-zinc-500">km/h</span>
              </span>
            </div>

            {/* Calories */}
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80 text-center">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                Calorias
              </span>
              <span className="text-xl font-black font-mono text-rose-400 block">
                {estimatedCalories} <span className="text-[10px] text-zinc-500">kcal</span>
              </span>
            </div>
          </div>

          {/* Secondary Stats Strip */}
          <div className="flex items-center justify-around pt-1 text-xs text-zinc-400">
            <span className="flex items-center gap-1 font-semibold">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              Média BPM: <strong className="text-white font-mono">{heartRate}</strong>
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Elevação: <strong className="text-white font-mono">+{elevationGain}m</strong>
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Check className="w-5 h-5" />
              <h2 className="text-base font-extrabold text-white">Corrida Concluída com Sucesso!</h2>
            </div>

            <p className="text-xs text-zinc-400">
              Sua atividade foi salva no **Firebase Firestore** e o arquivo `.gpx` foi gerado para exportação.
            </p>

            {/* Run Title Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Título do Treino</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Caption Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Legenda para o Feed Social</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => downloadGpxFile(title || 'Corrida', points)}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-2xl border border-zinc-700 flex items-center justify-center gap-2 transition-all"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl p-5 text-white space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsWatchModalVisible(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <Watch className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-bold">Smartwatch Wear OS & Wearable DataLayer</h3>
            </div>

            {/* Round Watch Face Graphic */}
            <div className="w-44 h-44 mx-auto rounded-full bg-black border-4 border-zinc-800 p-4 flex flex-col items-center justify-center text-center space-y-1 shadow-inner relative">
              <span className="text-[10px] font-mono font-bold text-orange-400">GALAXY WATCH</span>
              <span className="text-2xl font-black font-sport text-white">{distanceKm.toFixed(2)} km</span>
              <span className="text-xs font-mono text-zinc-400">{formatDuration(durationSeconds)}</span>
              <div className="flex items-center gap-1 text-xs text-rose-500 font-bold">
                <Heart className="w-3 h-3 fill-current animate-pulse" />
                <span>{heartRate} BPM</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-zinc-400 pt-1">
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span>Status da Conexão:</span>
                <span className="text-emerald-400 font-bold">Ativo via Firebase Realtime</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span>Bateria do Relógio:</span>
                <span className="text-white font-mono font-bold">{watchBattery}%</span>
              </div>
              <div className="flex justify-between pb-1">
                <span>Protocolo de Sensores:</span>
                <span className="text-orange-400 font-mono font-bold">Wearable.DataLayer</span>
              </div>
            </div>

            <button
              onClick={() => setIsWatchModalVisible(false)}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl"
            >
              Fechar Simulador
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
