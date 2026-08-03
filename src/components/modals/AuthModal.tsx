import React, { useState } from 'react';
import {
  X,
  Search,
  Check,
  ChevronLeft,
  Flame,
  Bike,
  Waves,
  CircleDot,
  Dribbble,
  Trophy,
  Lock,
  Mail,
  User,
  Phone,
  Calendar,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import stadiumLandingImg from '../../assets/images/clubsport_stadium_landing_1785459901545.jpg';

interface AuthModalProps {
  onClose?: () => void;
  initialStep?: 'welcome' | 'signin' | 'step1' | 'step2' | 'step3';
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, initialStep = 'welcome' }) => {
  const { loginWithEmail, signupWithEmail, loginWithSocial } = useAuth();

  const [currentStep, setCurrentStep] = useState<
    'welcome' | 'signin' | 'step1' | 'step2' | 'step3' | 'forgot' | 'terms'
  >(initialStep);

  // Form Fields State
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    phoneNumber: '',
    dateOfBirth: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Sports selection state
  const [selectedSports, setSelectedSports] = useState<string[]>(['Running', 'Cycling']);

  // Region selection state
  const [regionSearch, setRegionSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Los Angeles, USA');

  // Terms and Forgot Password modals/notices
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const popularRegions = [
    'Los Angeles, USA',
    'London, UK',
    'Paris, France',
    'São Paulo, Brasil',
    'Tokyo, Japan',
    'Sydney, Australia'
  ];

  const filteredRegions = popularRegions.filter((r) =>
    r.toLowerCase().includes(regionSearch.toLowerCase())
  );

  const sportsList = [
    { id: 'Running', label: 'Running', icon: 'runner' },
    { id: 'Cycling', label: 'Cycling', icon: 'cyclist' },
    { id: 'Swimming', label: 'Swimming', icon: 'swimmer' },
    { id: 'Tennis', label: 'Tennis', icon: 'tennis' },
    { id: 'Basketball', label: 'Basketball', icon: 'basketball' },
    { id: 'Soccer', label: 'Soccer', icon: 'soccer' }
  ];

  const toggleSport = (sportId: string) => {
    setSelectedSports((prev) =>
      prev.includes(sportId) ? prev.filter((s) => s !== sportId) : [...prev, sportId]
    );
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) return;
    await loginWithEmail(formData.email, formData.password);
    if (onClose) onClose();
  };

  const handleFinishRegistration = async () => {
    const finalName = formData.fullName || formData.nickname || 'Novo Atleta';
    const finalEmail = formData.email || `atleta_${Date.now()}@clubsport.com`;
    await signupWithEmail(finalEmail, formData.password || '123456', finalName);
    if (onClose) onClose();
  };

  // Render Sports Icon helper
  const renderSportIcon = (iconType: string) => {
    switch (iconType) {
      case 'runner':
        return (
          <svg className="w-8 h-8 text-white stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="4" r="2.5" />
            <path d="M7.5 18 10 13l3.5 1.5 2.5-4" />
            <path d="M12 10.5 9.5 8 5.5 10" />
            <path d="m14 14.5 2.5 5.5" />
          </svg>
        );
      case 'cyclist':
        return <Bike className="w-8 h-8 text-white" />;
      case 'swimmer':
        return <Waves className="w-8 h-8 text-white" />;
      case 'tennis':
        return (
          <svg className="w-8 h-8 text-white fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M5.5 5.5a10 10 0 0 1 13 13" />
            <path d="M18.5 5.5a10 10 0 0 0-13 13" />
          </svg>
        );
      case 'basketball':
        return <Dribbble className="w-8 h-8 text-white" />;
      case 'soccer':
        return (
          <svg className="w-8 h-8 text-white fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 7l3 2v3.5l-3 2-3-2V9z" />
            <path d="M12 2v5" />
            <path d="M15 9l4.5-2" />
            <path d="M15 12.5l4.5 2" />
            <path d="M12 17.5V22" />
            <path d="M9 12.5L4.5 14.5" />
            <path d="M9 9L4.5 7" />
          </svg>
        );
      default:
        return <Flame className="w-8 h-8 text-white" />;
    }
  };

  // Render Header Progress Indicator for Steps 1, 2, 3
  const renderStepProgress = (stepNumber: 1 | 2 | 3) => {
    return (
      <div className="w-full max-w-xs mx-auto space-y-1 mt-2">
        <div className="grid grid-cols-3 gap-1.5">
          <div className={`h-1 rounded-full ${stepNumber >= 1 ? 'bg-orange-500' : 'bg-zinc-800'}`} />
          <div className={`h-1 rounded-full ${stepNumber >= 2 ? 'bg-orange-500' : 'bg-zinc-800'}`} />
          <div className={`h-1 rounded-full ${stepNumber >= 3 ? 'bg-orange-500' : 'bg-zinc-800'}`} />
        </div>
        <p className="text-[11px] text-zinc-400 text-center font-medium">
          Step {stepNumber} of 3
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800/80 w-full max-w-md h-full sm:h-auto sm:max-h-[95vh] sm:rounded-3xl flex flex-col overflow-hidden text-white shadow-2xl relative">
        
        {/* Close Button top-right if modal can close */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-40 p-2 bg-black/40 hover:bg-zinc-800/80 backdrop-blur-md text-zinc-300 hover:text-white rounded-full border border-white/10 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* SCREEN 1: WELCOME LANDING SCREEN */}
        {currentStep === 'welcome' && (
          <div className="relative flex-1 flex flex-col justify-between min-h-[580px] p-6 text-center overflow-hidden">
            {/* Stadium Background Image */}
            <div className="absolute inset-0 z-0">
              <img
                src={stadiumLandingImg}
                alt="ClubSport Stadium"
                className="w-full h-full object-cover object-center scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-black/50" />
            </div>

            {/* Top Brand */}
            <div className="relative z-10 pt-6">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-lg">
                <span className="text-orange-500">Club</span>
                <span className="text-white">Sport</span>
              </h1>
            </div>

            {/* Bottom Actions */}
            <div className="relative z-10 space-y-3 pb-4">
              <button
                onClick={() => setCurrentStep('signin')}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-base rounded-2xl shadow-xl shadow-orange-500/20 transition-all transform active:scale-95"
              >
                Sign In
              </button>

              <button
                onClick={() => setCurrentStep('step1')}
                className="w-full py-4 bg-transparent hover:bg-orange-500/10 text-orange-500 font-bold text-base rounded-2xl border-2 border-orange-500 transition-all transform active:scale-95"
              >
                Create Account
              </button>

              <div className="flex items-center justify-center space-x-6 pt-3 text-xs text-zinc-400 font-medium">
                <button
                  onClick={() => setCurrentStep('forgot')}
                  className="hover:text-white hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
                <span>•</span>
                <button
                  onClick={() => setCurrentStep('terms')}
                  className="hover:text-white hover:underline transition-colors"
                >
                  Terms of Service
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 2: SIGN IN SCREEN */}
        {currentStep === 'signin' && (
          <div className="flex-1 flex flex-col justify-between p-6 space-y-6 overflow-y-auto">
            <div>
              <button
                onClick={() => setCurrentStep('welcome')}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors mb-4"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <h2 className="text-3xl font-black text-white text-center tracking-tight mb-6">
                Sign In
              </h2>

              <form onSubmit={handleSignInSubmit} className="space-y-4 max-w-sm mx-auto">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-medium">Email</label>
                  <div className="bg-zinc-900 border border-zinc-800 focus-within:border-orange-500 rounded-xl px-3.5 py-3 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-zinc-500" />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-zinc-600"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-medium">Password</label>
                  <div className="bg-zinc-900 border border-zinc-800 focus-within:border-orange-500 rounded-xl px-3.5 py-3 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-zinc-500" />
                    <input
                      type="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-zinc-600"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-base rounded-2xl shadow-xl shadow-orange-500/20 transition-all mt-4"
                >
                  Sign In
                </button>
              </form>

              <div className="text-center mt-3">
                <button
                  onClick={() => setCurrentStep('forgot')}
                  className="text-xs text-orange-400 hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-900">
              <p className="text-xs text-zinc-400 text-center flex items-center justify-center gap-2 font-medium">
                <span>Or sign in with</span>
              </p>

              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => loginWithSocial('google')}
                  className="w-12 h-12 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center transition-all hover:scale-105"
                  title="Google"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => loginWithSocial('github')}
                  className="w-12 h-12 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center transition-all hover:scale-105"
                  title="Apple"
                >
                  <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.16-1.9-14.48-6.08-3.38-2.75-7.29-7.39-11.72-13.9-6.07-8.7-10.9-18.42-14.49-29.15-3.59-10.74-5.38-21.03-5.38-30.88 0-14.37 3.6-26.25 10.8-35.63 7.2-9.38 16.27-14.16 27.2-14.34 4.8 0 10.12 1.25 15.96 3.76 5.84 2.5 9.77 3.8 11.78 3.89 1.66 0 5.76-1.35 12.3-4.04 6.54-2.7 12.04-3.95 16.51-3.76 12.18.96 21.68 5.61 28.49 13.96-10.85 6.55-16.14 15.61-15.87 27.18.28 9.06 3.75 16.63 10.42 22.7 6.67 6.07 14.54 9.49 23.6 10.27-2.32 6.89-5.37 13.88-9.14 20.97zM119.22 31.86c0-6.89 2.47-13.55 7.42-19.98 4.95-6.43 11.25-10.46 18.91-12.08.18 1.4.27 2.65.27 3.76 0 6.88-2.5 13.57-7.51 20.07-5.01 6.5-11.36 10.51-19.09 12.03z" />
                  </svg>
                </button>
              </div>

              <p className="text-center text-xs text-zinc-500 pt-2">
                Don't have an account?{' '}
                <button
                  onClick={() => setCurrentStep('step1')}
                  className="text-orange-400 font-bold hover:underline"
                >
                  Create Account
                </button>
              </p>
            </div>
          </div>
        )}

        {/* SCREEN 3: STEP 1 OF 3 - CREATE ACCOUNT */}
        {currentStep === 'step1' && (
          <div className="flex-1 flex flex-col justify-between p-6 space-y-4 overflow-y-auto">
            <div>
              <button
                onClick={() => setCurrentStep('welcome')}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors mb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <h2 className="text-3xl font-black text-white text-center tracking-tight">
                Create Account
              </h2>

              {renderStepProgress(1)}

              {/* Step 1 Input Fields */}
              <div className="space-y-3 mt-6">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-300 font-semibold">Full Name</label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none placeholder:text-zinc-600 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-300 font-semibold">
                    Nickname (Athlete Name)
                  </label>
                  <input
                    type="text"
                    placeholder="Nickname (Athlete Name)"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none placeholder:text-zinc-600 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-300 font-semibold">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none placeholder:text-zinc-600 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-300 font-semibold">Date of Birth</label>
                  <input
                    type="text"
                    placeholder="Date of Birth"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none placeholder:text-zinc-600 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-300 font-semibold">Email</label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none placeholder:text-zinc-600 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-300 font-semibold">Password</label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none placeholder:text-zinc-600 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl px-4 py-3 text-xs text-white outline-none placeholder:text-zinc-600 transition-colors"
                  />
                </div>

                <button
                  onClick={() => setCurrentStep('step2')}
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-base rounded-2xl shadow-xl shadow-orange-500/20 transition-all mt-4"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-900 text-center space-y-3">
              <p className="text-xs text-zinc-400 font-medium">Or sign up with</p>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => loginWithSocial('google')}
                  className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                  </svg>
                </button>

                <button
                  onClick={() => loginWithSocial('github')}
                  className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center transition-all"
                >
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.16-1.9-14.48-6.08-3.38-2.75-7.29-7.39-11.72-13.9-6.07-8.7-10.9-18.42-14.49-29.15-3.59-10.74-5.38-21.03-5.38-30.88 0-14.37 3.6-26.25 10.8-35.63 7.2-9.38 16.27-14.16 27.2-14.34 4.8 0 10.12 1.25 15.96 3.76 5.84 2.5 9.77 3.8 11.78 3.89 1.66 0 5.76-1.35 12.3-4.04 6.54-2.7 12.04-3.95 16.51-3.76 12.18.96 21.68 5.61 28.49 13.96-10.85 6.55-16.14 15.61-15.87 27.18.28 9.06 3.75 16.63 10.42 22.7 6.67 6.07 14.54 9.49 23.6 10.27-2.32 6.89-5.37 13.88-9.14 20.97zM119.22 31.86c0-6.89 2.47-13.55 7.42-19.98 4.95-6.43 11.25-10.46 18.91-12.08.18 1.4.27 2.65.27 3.76 0 6.88-2.5 13.57-7.51 20.07-5.01 6.5-11.36 10.51-19.09 12.03z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 4: STEP 2 OF 3 - SELECT YOUR SPORTS */}
        {currentStep === 'step2' && (
          <div className="flex-1 flex flex-col justify-between p-6 space-y-4 overflow-y-auto">
            <div>
              <button
                onClick={() => setCurrentStep('step1')}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors mb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <h2 className="text-3xl font-black text-white text-center tracking-tight">
                Select Your Sports
              </h2>

              {renderStepProgress(2)}

              {/* Sports Circles Grid (3 columns, 2 rows) */}
              <div className="grid grid-cols-3 gap-6 my-8 max-w-xs mx-auto">
                {sportsList.map((sport) => {
                  const isSelected = selectedSports.includes(sport.id);
                  return (
                    <div
                      key={sport.id}
                      onClick={() => toggleSport(sport.id)}
                      className="flex flex-col items-center cursor-pointer group"
                    >
                      <div
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-2 border-orange-500 bg-zinc-900/90 shadow-lg shadow-orange-500/20 scale-105'
                            : 'border border-zinc-700 bg-zinc-900/40 hover:border-zinc-500'
                        }`}
                      >
                        {renderSportIcon(sport.icon)}
                      </div>
                      <span className="text-xs font-medium text-white mt-2 group-hover:text-orange-400 transition-colors">
                        {sport.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentStep('step3')}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-base rounded-2xl shadow-xl shadow-orange-500/20 transition-all max-w-sm mx-auto block"
              >
                Next
              </button>
            </div>

            <div className="pt-4 border-t border-zinc-900 text-center space-y-3">
              <p className="text-xs text-zinc-400 font-medium">Or sign up with</p>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => loginWithSocial('google')}
                  className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                  </svg>
                </button>

                <button
                  onClick={() => loginWithSocial('github')}
                  className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center transition-all"
                >
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.16-1.9-14.48-6.08-3.38-2.75-7.29-7.39-11.72-13.9-6.07-8.7-10.9-18.42-14.49-29.15-3.59-10.74-5.38-21.03-5.38-30.88 0-14.37 3.6-26.25 10.8-35.63 7.2-9.38 16.27-14.16 27.2-14.34 4.8 0 10.12 1.25 15.96 3.76 5.84 2.5 9.77 3.8 11.78 3.89 1.66 0 5.76-1.35 12.3-4.04 6.54-2.7 12.04-3.95 16.51-3.76 12.18.96 21.68 5.61 28.49 13.96-10.85 6.55-16.14 15.61-15.87 27.18.28 9.06 3.75 16.63 10.42 22.7 6.67 6.07 14.54 9.49 23.6 10.27-2.32 6.89-5.37 13.88-9.14 20.97zM119.22 31.86c0-6.89 2.47-13.55 7.42-19.98 4.95-6.43 11.25-10.46 18.91-12.08.18 1.4.27 2.65.27 3.76 0 6.88-2.5 13.57-7.51 20.07-5.01 6.5-11.36 10.51-19.09 12.03z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 5: STEP 3 OF 3 - REGION SELECTION */}
        {currentStep === 'step3' && (
          <div className="flex-1 flex flex-col justify-between p-6 space-y-6 overflow-y-auto">
            <div>
              <button
                onClick={() => setCurrentStep('step2')}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors mb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <h2 className="text-3xl font-black text-white text-center tracking-tight">
                Region Selection
              </h2>

              {renderStepProgress(3)}

              {/* Region Search Input */}
              <div className="mt-6 mb-6">
                <div className="bg-zinc-900 border border-zinc-800 focus-within:border-orange-500 rounded-xl px-4 py-3.5 flex items-center gap-2">
                  <Search className="w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search for city or country"
                    value={regionSearch}
                    onChange={(e) => setRegionSearch(e.target.value)}
                    className="w-full bg-transparent text-xs text-white focus:outline-none placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* Popular Regions Nearby */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-zinc-300">Popular Regions Nearby</h3>

                <div className="space-y-2">
                  {filteredRegions.map((region) => {
                    const isSelected = selectedRegion === region;
                    return (
                      <div
                        key={region}
                        onClick={() => setSelectedRegion(region)}
                        className={`p-3.5 rounded-2xl cursor-pointer text-sm transition-all ${
                          isSelected
                            ? 'bg-orange-500 text-zinc-950 font-bold shadow-md shadow-orange-500/10'
                            : 'bg-transparent hover:bg-zinc-900 text-zinc-200 border-b border-zinc-800/80'
                        }`}
                      >
                        {region}
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-zinc-400 font-medium text-center mt-6">
                Top 10 athletes here can propose challenges!
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={handleFinishRegistration}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-base rounded-2xl shadow-xl shadow-orange-500/20 transition-all transform active:scale-95"
              >
                Finish Registration
              </button>
            </div>
          </div>
        )}

        {/* FORGOT PASSWORD SCREEN */}
        {currentStep === 'forgot' && (
          <div className="p-6 space-y-6">
            <button
              onClick={() => setCurrentStep('welcome')}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <h2 className="text-2xl font-black text-white text-center">Reset Password</h2>

            {forgotSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-emerald-300">
                  Password reset link sent! Please check your email inbox.
                </p>
                <button
                  onClick={() => setCurrentStep('signin')}
                  className="mt-3 text-xs text-orange-400 font-bold underline"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setForgotSuccess(true);
                }}
                className="space-y-4"
              >
                <p className="text-xs text-zinc-400 text-center">
                  Enter your email address and we'll send you instructions to reset your password.
                </p>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-3 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-transparent text-sm text-white focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl"
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        )}

        {/* TERMS OF SERVICE SCREEN */}
        {currentStep === 'terms' && (
          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setCurrentStep('welcome')}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <h2 className="text-2xl font-black text-white">Terms of Service</h2>
            <div className="text-xs text-zinc-300 space-y-3 leading-relaxed">
              <p>
                Welcome to <strong>ClubSport</strong>. By creating an account or using our mobile application, you agree to comply with and be bound by the following terms of service.
              </p>
              <h3 className="font-bold text-white text-sm pt-2">1. Athlete Safety & GPS Tracking</h3>
              <p>
                You are responsible for your personal safety while participating in sports, runs, cycling activities, and community challenges.
              </p>
              <h3 className="font-bold text-white text-sm pt-2">2. Community Guidelines</h3>
              <p>
                Respect fellow athletes in group chats, leaderboards, and comments. Harassment or toxic behavior will result in account suspension.
              </p>
              <h3 className="font-bold text-white text-sm pt-2">3. Data & Privacy</h3>
              <p>
                Your sports activity data is synced securely to your profile. You can manage visibility in your profile settings.
              </p>
            </div>

            <button
              onClick={() => setCurrentStep('welcome')}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl border border-zinc-800"
            >
              Accept & Return
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
