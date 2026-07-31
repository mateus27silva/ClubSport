import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Image, Zap, ZapOff, Camera, RefreshCw, AlertCircle, Upload, Heart, MessageSquare, Send, Sparkles, Mic, MicOff, Radio, Users, Play, Square, Share2, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CaptureViewProps {
  onNextToUpload: (photoUrl: string, postType: 'Post' | 'Story' | 'Live') => void;
  onClose: () => void;
}

interface LiveComment {
  id: string;
  userName: string;
  avatarUrl: string;
  text: string;
  time: string;
}

export const CaptureView: React.FC<CaptureViewProps> = ({ onNextToUpload, onClose }) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [postType, setPostType] = useState<'Post' | 'Story' | 'Live'>('Post');
  const [isLiveActive, setIsLiveActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Live Stream Metrics State
  const [liveDuration, setLiveDuration] = useState<number>(0);
  const [viewerCount, setViewerCount] = useState<number>(14);
  const [heartsCount, setHeartsCount] = useState<number>(84);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; left: number }[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [showAiCoach, setShowAiCoach] = useState<boolean>(true);
  const [aiCoachMsg, setAiCoachMsg] = useState<string>(
    'IA Coach Ativo: Excelente postura de corrida! Cadência perfeita em 174 SPM.'
  );

  const [comments, setComments] = useState<LiveComment[]>([
    {
      id: 'c1',
      userName: 'Ana Costa',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
      text: 'Força Mateus! Bora pro treino 🔥',
      time: 'agora'
    },
    {
      id: 'c2',
      userName: 'Lucas Mendes',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      text: 'Qual o ritmo da corrida de hoje? 🏃‍♂️',
      time: 'agora'
    },
    {
      id: 'c3',
      userName: 'Juliana Paes',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      text: 'Top demais! ClubSport ao vivo! 👏',
      time: 'agora'
    }
  ]);

  const [showEndSummary, setShowEndSummary] = useState<boolean>(false);

  const [capturedImage, setCapturedImage] = useState<string>(
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80'
  );

  // Initialize Camera Stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    async function startCamera() {
      setCameraError(null);
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facingMode === 'environment' ? { ideal: 'environment' } : 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: postType === 'Live' ? !isMuted : false
          });

          if (!isMounted) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            try {
              await videoRef.current.play();
            } catch (playErr) {
              console.warn('Video play interrupted:', playErr);
            }
            setIsCameraActive(true);
          }
        } else {
          setCameraError('Câmera não suportada neste navegador.');
        }
      } catch (err: any) {
        console.warn('Erro ao acessar a câmera:', err);
        if (isMounted) {
          setIsCameraActive(false);
          setCameraError(
            'Permissão de câmera negada ou bloqueada no navegador. Clique em "Abrir Câmera do Celular" para tirar foto usando a câmera nativa do aparelho.'
          );
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, postType]);

  // Live Transmission Timer & Simulated Activity Feed
  useEffect(() => {
    let timer: any;
    let viewerInterval: any;
    let commentInterval: any;

    if (isLiveActive) {
      timer = setInterval(() => {
        setLiveDuration((prev) => prev + 1);
      }, 1000);

      viewerInterval = setInterval(() => {
        setViewerCount((prev) => prev + Math.floor(Math.random() * 5) + 1);
      }, 3000);

      const incomingComments = [
        'Mandando ver no treino!',
        'Acompanhando de São Paulo! 🚀',
        'Incrível essa performance!',
        'Quais suplementos você usa?',
        'ClubSport Elite demais!',
        'Bora bater a meta de 10k de hoje!',
        'Acelera no sprint final! 🔥'
      ];

      const names = ['Carlos Eduardo', 'Fernanda Lima', 'Rodrigo Silva', 'Beatriz Santos', 'Gabriel Souza'];
      const avatars = [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
      ];

      commentInterval = setInterval(() => {
        const randComment = incomingComments[Math.floor(Math.random() * incomingComments.length)];
        const randName = names[Math.floor(Math.random() * names.length)];
        const randAvatar = avatars[Math.floor(Math.random() * avatars.length)];

        setComments((prev) => [
          ...prev.slice(-10),
          {
            id: 'c_' + Date.now(),
            userName: randName,
            avatarUrl: randAvatar,
            text: randComment,
            time: 'agora'
          }
        ]);
        setHeartsCount((h) => h + Math.floor(Math.random() * 3) + 1);
      }, 4500);
    } else {
      setLiveDuration(0);
    }

    return () => {
      clearInterval(timer);
      clearInterval(viewerInterval);
      clearInterval(commentInterval);
    };
  }, [isLiveActive]);

  // Format Timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Add Heart Reaction
  const handleAddHeart = () => {
    setHeartsCount((prev) => prev + 1);
    const id = Date.now();
    const left = Math.floor(Math.random() * 60) + 20; // 20% to 80%
    setFloatingHearts((prev) => [...prev, { id, left }]);

    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2000);
  };

  // Send Comment in Live
  const handleSendComment = () => {
    if (!chatInput.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: 'c_' + Date.now(),
        userName: user?.fullName || 'Você',
        avatarUrl: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        text: chatInput,
        time: 'agora'
      }
    ]);
    setChatInput('');
  };

  // Toggle Live Transmission Start/Stop
  const handleToggleLive = () => {
    if (isLiveActive) {
      setIsLiveActive(false);
      setShowEndSummary(true);
    } else {
      setIsLiveActive(true);
      setShowEndSummary(false);
    }
  };

  // Capture Photo from Live Camera Stream
  const handleShutter = () => {
    if (isCameraActive && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        setIsCameraActive(false);
        return;
      }
    }

    if (!isCameraActive && !cameraError) {
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
      return;
    }

    fileInputRef.current?.click();
  };

  // Native Mobile File Input
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedImage(event.target.result as string);
          setIsCameraActive(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between max-w-lg mx-auto overflow-hidden">
      {/* Native Mobile Camera File Input Fallback */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileSelected}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Floating Hearts Animation */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        {floatingHearts.map((h) => (
          <div
            key={h.id}
            style={{ left: `${h.left}%` }}
            className="absolute bottom-24 text-red-500 animate-bounce transition-all duration-1000 transform opacity-90 scale-125"
          >
            <Heart className="w-8 h-8 fill-red-500" />
          </div>
        ))}
      </div>

      {/* Top Bar */}
      <div className="p-4 flex items-center justify-between z-20">
        <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full">
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-xs font-mono font-bold text-white">ClubSport Live API</span>
        </div>

        <button
          onClick={() => onNextToUpload(capturedImage, postType)}
          className="text-sm font-bold text-orange-500 hover:text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/20"
        >
          Avançar
        </button>
      </div>

      {/* Camera / Live Stream Viewfinder Box */}
      <div className="relative mx-3 flex-1 rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
        />
        {!isCameraActive && (
          <img
            src={capturedImage}
            alt="Camera preview"
            className="w-full h-full object-cover"
          />
        )}

        {/* Permission Warning Overlay */}
        {cameraError && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center z-20 space-y-3">
            <AlertCircle className="w-10 h-10 text-orange-400" />
            <p className="text-xs text-zinc-200 font-medium leading-relaxed max-w-xs">
              {cameraError}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>Abrir Câmera do Celular</span>
            </button>
          </div>
        )}

        {/* Focus Reticle Crosshairs for normal post */}
        {postType !== 'Live' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-32 h-32 border-2 border-white/40 rounded-xl relative">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 -mt-1 -ml-1 border-orange-500" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 -mt-1 -mr-1 border-orange-500" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 -mb-1 -ml-1 border-orange-500" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 -mb-1 -mr-1 border-orange-500" />
            </div>
          </div>
        )}

        {/* Live Stream Top Controls & Badges */}
        {postType === 'Live' && (
          <>
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
              <div className="flex items-center gap-2">
                <div className="bg-red-600/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg border border-red-500/50">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                  <span>AO VIVO</span>
                  {isLiveActive && (
                    <span className="pl-1 border-l border-white/30 font-mono text-white">
                      {formatTime(liveDuration)}
                    </span>
                  )}
                </div>

                <div className="bg-zinc-900/80 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold text-white border border-zinc-700">
                  <Eye className="w-3 h-3 text-red-400" />
                  <span>{viewerCount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted((m) => !m)}
                  className={`p-2 rounded-full backdrop-blur-md border ${
                    isMuted ? 'bg-red-500/80 border-red-400 text-white' : 'bg-black/50 border-white/20 text-white'
                  }`}
                  title={isMuted ? 'Ativar Microfone' : 'Mutar Microfone'}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* AI Coach Floating Overlay */}
            {isLiveActive && showAiCoach && (
              <div className="absolute top-12 left-3 right-3 bg-zinc-950/90 border border-orange-500/40 p-2.5 rounded-2xl backdrop-blur-md z-20 flex items-start gap-2 shadow-xl animate-fade-in">
                <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-zinc-100 leading-snug">{aiCoachMsg}</p>
                </div>
                <button
                  onClick={() => setShowAiCoach(false)}
                  className="text-[10px] text-zinc-400 hover:text-white px-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Live Chat Stream Overlay */}
            <div className="absolute bottom-3 left-3 right-3 z-20 space-y-2 max-h-[160px] overflow-y-auto no-scrollbar pointer-events-auto">
              {comments.map((c) => (
                <div key={c.id} className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 w-fit max-w-[90%]">
                  <img src={c.avatarUrl} alt={c.userName} className="w-5 h-5 rounded-full object-cover border border-orange-500/50 shrink-0" />
                  <span className="text-[11px] font-bold text-orange-400 shrink-0">{c.userName}:</span>
                  <span className="text-[11px] font-medium text-white truncate">{c.text}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="p-4 space-y-4 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-900 z-20">
        {/* Live Chat Input Bar when Live is Active */}
        {postType === 'Live' && isLiveActive && (
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl px-3 py-1.5">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
              placeholder="Enviar mensagem ao vivo..."
              className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
            />
            <button
              onClick={handleSendComment}
              className="p-1.5 text-orange-500 hover:text-orange-400"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              onClick={handleAddHeart}
              className="p-1.5 text-red-500 hover:text-red-400 active:scale-125 transition-transform"
              title="Enviar Curtida / Coração"
            >
              <Heart className="w-5 h-5 fill-red-500" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-around">
          {/* Gallery / File Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
            title="Escolher Foto da Galeria ou Câmera Nativa"
          >
            <Image className="w-6 h-6" />
          </button>

          {/* Shutter / Live Transmission Toggle Button */}
          <button
            onClick={() => {
              if (postType === 'Live') {
                handleToggleLive();
              } else {
                handleShutter();
              }
            }}
            className={`w-20 h-20 rounded-full border-4 p-1 flex items-center justify-center active:scale-95 transition-all ${
              postType === 'Live'
                ? isLiveActive
                  ? 'border-red-600 shadow-lg shadow-red-500/40 bg-red-950/30'
                  : 'border-red-500 shadow-md shadow-red-500/20'
                : 'border-orange-500'
            }`}
            title={postType === 'Live' ? (isLiveActive ? 'Encerrar Live' : 'Iniciar Transmissão Ao Vivo') : 'Tirar Foto'}
          >
            {postType === 'Live' ? (
              isLiveActive ? (
                <div className="w-8 h-8 bg-red-600 rounded-md animate-pulse flex items-center justify-center">
                  <Square className="w-4 h-4 text-white fill-white" />
                </div>
              ) : (
                <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center">
                  <Radio className="w-7 h-7 text-white" />
                </div>
              )
            ) : (
              <div className="w-full h-full rounded-full bg-orange-500" />
            )}
          </button>

          {/* Camera Flip Button */}
          <button
            onClick={toggleFacingMode}
            className="p-3 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
            title="Inverter Câmera (Frontal / Traseira)"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>

        {/* Post vs Story vs Live Tabs */}
        <div className="flex justify-center space-x-8 text-sm font-bold">
          <button
            onClick={() => {
              setPostType('Post');
              setIsLiveActive(false);
            }}
            className={`pb-1 border-b-2 transition-colors ${
              postType === 'Post' ? 'border-orange-500 text-orange-500' : 'border-transparent text-zinc-400'
            }`}
          >
            Post
          </button>
          <button
            onClick={() => {
              setPostType('Story');
              setIsLiveActive(false);
            }}
            className={`pb-1 border-b-2 transition-colors ${
              postType === 'Story' ? 'border-orange-500 text-orange-500' : 'border-transparent text-zinc-400'
            }`}
          >
            Story
          </button>
          <button
            onClick={() => setPostType('Live')}
            className={`pb-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              postType === 'Live' ? 'border-red-500 text-red-500 font-black' : 'border-transparent text-zinc-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                postType === 'Live' ? 'bg-red-500 animate-pulse' : 'bg-zinc-500'
              }`}
            />
            Live Transmissão
          </button>
        </div>
      </div>

      {/* Live Stream Ended Summary Modal */}
      {showEndSummary && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-6 flex flex-col justify-center items-center text-center">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl max-w-sm w-full space-y-4">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
              <Radio className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">Transmissão Encerrada</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Sua live com a comunidade ClubSport foi um sucesso!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-500 block font-semibold">DURAÇÃO</span>
                <span className="text-sm font-mono font-bold text-white">{formatTime(liveDuration || 142)}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block font-semibold">ESPECTADORES</span>
                <span className="text-sm font-mono font-bold text-orange-400">{viewerCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block font-semibold">CURTIDAS</span>
                <span className="text-sm font-mono font-bold text-red-500">{heartsCount}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => onNextToUpload(capturedImage, 'Live')}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-xs rounded-xl shadow-lg transition-all"
              >
                Publicar Replay no Feed
              </button>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-all"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

