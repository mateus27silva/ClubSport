import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  User,
  Lock,
  Shield,
  ChevronRight,
  Bell,
  Mail,
  Watch,
  X,
  Check,
  Globe,
  Ruler,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getDeviceLocale, getLanguageLabel } from '../../lib/localize';

interface SettingsViewProps {
  onBack: () => void;
  onOpenEditProfile: () => void;
  onOpenConnectWatch: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onBack,
  onOpenEditProfile,
  onOpenConnectWatch
}) => {
  const { user, logout } = useAuth();

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Preference states loaded persistently from localStorage/Supabase
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<'metric' | 'imperial'>(() => {
    try {
      const saved = localStorage.getItem('clubsport_app_settings');
      if (saved) return JSON.parse(saved).unitsOfMeasure || 'metric';
    } catch (e) {}
    return 'metric';
  });

  const [language, setLanguage] = useState<'auto' | 'pt-BR' | 'en-US' | 'es-ES'>(() => {
    try {
      const saved = localStorage.getItem('clubsport_app_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.language) return parsed.language;
      }
    } catch (e) {}
    return 'auto';
  });

  const [pushNotifications, setPushNotifications] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('clubsport_app_settings');
      if (saved) return JSON.parse(saved).pushNotifications ?? true;
    } catch (e) {}
    return true;
  });

  const [emailNotifications, setEmailNotifications] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('clubsport_app_settings');
      if (saved) return JSON.parse(saved).emailNotifications ?? false;
    } catch (e) {}
    return false;
  });

  // Privacy state
  const [isPublicProfile, setIsPublicProfile] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('clubsport_app_settings');
      if (saved) return JSON.parse(saved).isPublicProfile ?? true;
    } catch (e) {}
    return true;
  });

  const [activityDefaultPrivacy, setActivityDefaultPrivacy] = useState<'public' | 'followers' | 'private'>(() => {
    try {
      const saved = localStorage.getItem('clubsport_app_settings');
      if (saved) return JSON.parse(saved).activityDefaultPrivacy || 'public';
    } catch (e) {}
    return 'public';
  });

  // Helper function to persist settings both locally and to Supabase
  const persistSettings = async (updatedSettings: {
    unitsOfMeasure?: 'metric' | 'imperial';
    language?: 'auto' | 'pt-BR' | 'en-US' | 'es-ES';
    pushNotifications?: boolean;
    emailNotifications?: boolean;
    isPublicProfile?: boolean;
    activityDefaultPrivacy?: 'public' | 'followers' | 'private';
  }) => {
    try {
      const current = {
        unitsOfMeasure,
        language,
        pushNotifications,
        emailNotifications,
        isPublicProfile,
        activityDefaultPrivacy,
        ...updatedSettings
      };

      localStorage.setItem('clubsport_app_settings', JSON.stringify(current));

      if (user?.uid) {
        await supabase
          .from('profiles')
          .update({ settings: current })
          .eq('id', user.uid);
      }
    } catch (err) {
      console.warn('Error saving settings:', err);
    }
  };

  // Modal states
  const [activeModal, setActiveModal] = useState<
    'none' | 'password' | 'privacy' | 'units' | 'language' | 'delete'
  >('none');

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete account state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Por favor, preencha todos os campos.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'As novas senhas não coincidem.' });
      return;
    }

    setPasswordMsg({ type: 'success', text: 'Senha alterada com sucesso!' });
    setTimeout(() => {
      setActiveModal('none');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg(null);
    }, 1200);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText.toUpperCase() !== 'DELETAR') {
      alert('Digite DELETAR para confirmar a exclusão.');
      return;
    }
    alert('Sua conta e dados foram excluídos do ClubSport.');
    logout();
  };

  // Helper filter search
  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-28 pt-2 max-w-2xl mx-auto px-4 font-sans antialiased">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-md h-16 flex items-center justify-between border-b border-zinc-800/80 px-1 mb-6">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors active:scale-95"
          title="Voltar"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {!isSearchOpen ? (
          <h1 className="text-xl font-black uppercase tracking-tight text-white font-sans">
            SETTINGS
          </h1>
        ) : (
          <div className="flex-1 mx-3 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar nas configurações..."
              autoFocus
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-full px-4 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1.5 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => {
            setIsSearchOpen(!isSearchOpen);
            if (isSearchOpen) setSearchQuery('');
          }}
          className="p-2 -mr-2 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
          title="Pesquisar"
        >
          {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Container Sections */}
      <div className="space-y-8">
        {/* ACCOUNT SECTION */}
        {(matchesSearch('account') ||
          matchesSearch('edit profile') ||
          matchesSearch('editar perfil') ||
          matchesSearch('password') ||
          matchesSearch('senha') ||
          matchesSearch('privacy') ||
          matchesSearch('privacidade')) && (
          <section className="space-y-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-orange-500 font-mono">
              ACCOUNT
            </h2>

            <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-xl overflow-hidden divide-y divide-zinc-800/80 shadow-md">
              {/* Edit Profile */}
              {(matchesSearch('edit profile') || matchesSearch('editar perfil')) && (
                <div
                  onClick={onOpenEditProfile}
                  className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-zinc-300 group-hover:text-orange-400 transition-colors" />
                    <span className="text-sm font-semibold text-zinc-100">Edit Profile</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:translate-x-1 group-hover:text-zinc-300 transition-all" />
                </div>
              )}

              {/* Change Password */}
              {(matchesSearch('change password') || matchesSearch('senha')) && (
                <div
                  onClick={() => setActiveModal('password')}
                  className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-zinc-300 group-hover:text-orange-400 transition-colors" />
                    <span className="text-sm font-semibold text-zinc-100">Change Password</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:translate-x-1 group-hover:text-zinc-300 transition-all" />
                </div>
              )}

              {/* Privacy */}
              {(matchesSearch('privacy') || matchesSearch('privacidade')) && (
                <div
                  onClick={() => setActiveModal('privacy')}
                  className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-zinc-300 group-hover:text-orange-400 transition-colors" />
                    <span className="text-sm font-semibold text-zinc-100">Privacy</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:translate-x-1 group-hover:text-zinc-300 transition-all" />
                </div>
              )}
            </div>
          </section>
        )}

        {/* PREFERENCES SECTION */}
        {(matchesSearch('preferences') ||
          matchesSearch('units') ||
          matchesSearch('unidades') ||
          matchesSearch('language') ||
          matchesSearch('idioma')) && (
          <section className="space-y-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-orange-500 font-mono">
              PREFERENCES
            </h2>

            <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-xl overflow-hidden divide-y divide-zinc-800/80 shadow-md">
              {/* Units of Measure */}
              {(matchesSearch('units') || matchesSearch('unidades')) && (
                <div
                  onClick={() => setActiveModal('units')}
                  className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-100">Units of Measure</span>
                    <span className="text-xs text-zinc-400 font-medium mt-0.5">
                      {unitsOfMeasure === 'metric' ? 'Metric (km, kg)' : 'Imperial (mi, lbs)'}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:translate-x-1 group-hover:text-zinc-300 transition-all" />
                </div>
              )}

              {/* Language */}
              {(matchesSearch('language') || matchesSearch('idioma')) && (
                <div
                  onClick={() => setActiveModal('language')}
                  className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-100">Language</span>
                    <span className="text-xs text-zinc-400 font-medium mt-0.5">
                      {getLanguageLabel(language)}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:translate-x-1 group-hover:text-zinc-300 transition-all" />
                </div>
              )}
            </div>
          </section>
        )}

        {/* NOTIFICATIONS SECTION */}
        {(matchesSearch('notifications') ||
          matchesSearch('push') ||
          matchesSearch('email')) && (
          <section className="space-y-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-orange-500 font-mono">
              NOTIFICATIONS
            </h2>

            <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-xl overflow-hidden divide-y divide-zinc-800/80 shadow-md">
              {/* Push Notifications */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-zinc-300" />
                  <span className="text-sm font-semibold text-zinc-100">Push Notifications</span>
                </div>
                <button
                  onClick={() => {
                    const newVal = !pushNotifications;
                    setPushNotifications(newVal);
                    persistSettings({ pushNotifications: newVal });
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                    pushNotifications ? 'bg-orange-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow ${
                      pushNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-zinc-300" />
                  <span className="text-sm font-semibold text-zinc-100">Email Notifications</span>
                </div>
                <button
                  onClick={() => {
                    const newVal = !emailNotifications;
                    setEmailNotifications(newVal);
                    persistSettings({ emailNotifications: newVal });
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                    emailNotifications ? 'bg-orange-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow ${
                      emailNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* CONNECTED DEVICES SECTION */}
        {(matchesSearch('connected') ||
          matchesSearch('watch') ||
          matchesSearch('garmin') ||
          matchesSearch('strava')) && (
          <section className="space-y-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-orange-500 font-mono">
              CONNECTED DEVICES
            </h2>

            <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-xl overflow-hidden shadow-md">
              <div
                onClick={onOpenConnectWatch}
                className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Watch className="w-5 h-5 text-zinc-300 group-hover:text-orange-400 transition-colors" />
                  <span className="text-sm font-semibold text-zinc-100">
                    Manage Watch / App Connections
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:translate-x-1 group-hover:text-zinc-300 transition-all" />
              </div>
            </div>
          </section>
        )}

        {/* LOG OUT & DELETE ACCOUNT BUTTONS */}
        <div className="pt-6 space-y-4">
          <button
            onClick={() => {
              if (confirm('Deseja realmente sair da sua conta?')) {
                logout();
              }
            }}
            className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-black text-base uppercase tracking-wider rounded-full flex items-center justify-center transition-all shadow-lg shadow-orange-500/25 active:scale-[0.98]"
          >
            LOG OUT
          </button>

          <div className="text-center">
            <button
              onClick={() => setActiveModal('delete')}
              className="text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-500 hover:text-red-400 transition-colors py-2 px-4"
            >
              DELETE ACCOUNT
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-MODALS */}
      {/* ========================================================================= */}

      {/* 1. CHANGE PASSWORD MODAL */}
      {activeModal === 'password' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setActiveModal('none')}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Alterar Senha</h3>
                <p className="text-xs text-zinc-400">Atualize sua senha de acesso ao ClubSport</p>
              </div>
            </div>

            {passwordMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold mb-4 ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-red-500/20 border border-red-500/40 text-red-300'
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. PRIVACY MODAL */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setActiveModal('none')}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Privacidade e Visibilidade</h3>
                <p className="text-xs text-zinc-400">Controle quem pode ver seu perfil e treinos</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/60">
                <div>
                  <span className="text-xs font-bold text-white block">Perfil Público</span>
                  <span className="text-[11px] text-zinc-400 block">
                    Permitir que outros atletas vejam seu perfil no ranking
                  </span>
                </div>
                <button
                  onClick={() => setIsPublicProfile(!isPublicProfile)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                    isPublicProfile ? 'bg-orange-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow ${
                      isPublicProfile ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-2">
                  Privacidade Padrão das Atividades
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'public', label: 'Público (Todos do ClubSport)', desc: 'Qualquer atleta pode visualizar no feed' },
                    { id: 'followers', label: 'Membros do Meu Clube', desc: 'Apenas membros das suas comunidades' },
                    { id: 'private', label: 'Privado (Apenas Eu)', desc: 'Visível somente no seu perfil privado' }
                  ].map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setActivityDefaultPrivacy(opt.id as any)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                        activityDefaultPrivacy === opt.id
                          ? 'bg-orange-500/10 border-orange-500 text-white'
                          : 'bg-zinc-800/40 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{opt.label}</div>
                        <div className="text-[10px] text-zinc-400">{opt.desc}</div>
                      </div>
                      {activityDefaultPrivacy === opt.id && (
                        <Check className="w-4 h-4 text-orange-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  persistSettings({ isPublicProfile, activityDefaultPrivacy });
                  alert('Configurações de privacidade salvas!');
                  setActiveModal('none');
                }}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl"
              >
                Salvar Privacidade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. UNITS MODAL */}
      {activeModal === 'units' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setActiveModal('none')}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <Ruler className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Unidades de Medida</h3>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => {
                  setUnitsOfMeasure('metric');
                  persistSettings({ unitsOfMeasure: 'metric' });
                  setActiveModal('none');
                }}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between ${
                  unitsOfMeasure === 'metric'
                    ? 'bg-orange-500/10 border-orange-500 text-white'
                    : 'bg-zinc-800/40 border-zinc-700/60 text-zinc-300'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">Métrico</div>
                  <div className="text-[10px] text-zinc-400">Quilômetros (km), Quilogramas (kg)</div>
                </div>
                {unitsOfMeasure === 'metric' && <Check className="w-4 h-4 text-orange-400" />}
              </div>

              <div
                onClick={() => {
                  setUnitsOfMeasure('imperial');
                  persistSettings({ unitsOfMeasure: 'imperial' });
                  setActiveModal('none');
                }}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between ${
                  unitsOfMeasure === 'imperial'
                    ? 'bg-orange-500/10 border-orange-500 text-white'
                    : 'bg-zinc-800/40 border-zinc-700/60 text-zinc-300'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">Imperial</div>
                  <div className="text-[10px] text-zinc-400">Milhas (mi), Libras (lbs)</div>
                </div>
                {unitsOfMeasure === 'imperial' && <Check className="w-4 h-4 text-orange-400" />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. LANGUAGE MODAL */}
      {activeModal === 'language' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setActiveModal('none')}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Idioma / Language</h3>
                <p className="text-[11px] text-zinc-400">Suporte a react-native-localize</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {/* Auto / System option via react-native-localize */}
              <div
                onClick={() => {
                  setLanguage('auto');
                  persistSettings({ language: 'auto' });
                  setActiveModal('none');
                }}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between ${
                  language === 'auto'
                    ? 'bg-orange-500/10 border-orange-500 text-white'
                    : 'bg-zinc-800/40 border-zinc-700/60 text-zinc-300'
                }`}
              >
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>Automático (Sistema)</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-mono">RN-Localize</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    Detectado: {getDeviceLocale().languageTag} ({getDeviceLocale().source === 'react-native-localize' ? 'react-native-localize' : 'Navegador'})
                  </div>
                </div>
                {language === 'auto' && <Check className="w-4 h-4 text-orange-400" />}
              </div>

              {/* Português (BR) */}
              <div
                onClick={() => {
                  setLanguage('pt-BR');
                  persistSettings({ language: 'pt-BR' });
                  setActiveModal('none');
                }}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between ${
                  language === 'pt-BR'
                    ? 'bg-orange-500/10 border-orange-500 text-white'
                    : 'bg-zinc-800/40 border-zinc-700/60 text-zinc-300'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">Português (BR)</div>
                  <div className="text-[10px] text-zinc-400">Português do Brasil</div>
                </div>
                {language === 'pt-BR' && <Check className="w-4 h-4 text-orange-400" />}
              </div>

              {/* English (US) */}
              <div
                onClick={() => {
                  setLanguage('en-US');
                  persistSettings({ language: 'en-US' });
                  setActiveModal('none');
                }}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between ${
                  language === 'en-US'
                    ? 'bg-orange-500/10 border-orange-500 text-white'
                    : 'bg-zinc-800/40 border-zinc-700/60 text-zinc-300'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">English (US)</div>
                  <div className="text-[10px] text-zinc-400">United States English</div>
                </div>
                {language === 'en-US' && <Check className="w-4 h-4 text-orange-400" />}
              </div>

              {/* Español (ES) */}
              <div
                onClick={() => {
                  setLanguage('es-ES');
                  persistSettings({ language: 'es-ES' });
                  setActiveModal('none');
                }}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between ${
                  language === 'es-ES'
                    ? 'bg-orange-500/10 border-orange-500 text-white'
                    : 'bg-zinc-800/40 border-zinc-700/60 text-zinc-300'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">Español (ES)</div>
                  <div className="text-[10px] text-zinc-400">Español de España</div>
                </div>
                {language === 'es-ES' && <Check className="w-4 h-4 text-orange-400" />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. DELETE ACCOUNT MODAL */}
      {activeModal === 'delete' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setActiveModal('none')}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Excluir Conta Permanentemente</h3>
                <p className="text-xs text-red-400">Esta ação é irreversível</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
              Ao deletar sua conta, todos os seus treinos, estatísticas, fotos, medalhas e participação em clubes serão permanentemente excluídos do banco de dados do ClubSport.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Digite <span className="text-red-400 font-bold">DELETAR</span> para confirmar:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETAR"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setActiveModal('none')}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Excluir Minha Conta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
