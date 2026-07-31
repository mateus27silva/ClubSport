import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot } from '../../lib/firebase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import {
  Shield,
  Download,
  CheckCircle,
  Users,
  FileText,
  ChevronLeft,
  Plus,
  Search,
  Building2,
  DollarSign,
  TrendingUp,
  Award,
  Filter,
  UserCheck,
  UserX,
  Trophy,
  Flame,
  Send,
  MoreVertical,
  Briefcase,
  Layers,
  MapPin,
  Sparkles,
  Calendar,
  Phone,
  Mail,
  Zap
} from 'lucide-react';
import jsPDF from 'jspdf';
import { initialAuditLogs, initialCrmDeals, initialCrmUsers, initialChallenges } from '../../data/mockData';
import { AuditLog, CrmDeal, CrmUser, DealStage, Challenge } from '../../types';

interface AdminDashboardProps {
  onBack?: () => void;
}

const revenueMonthlyData = [
  { month: 'Jan', revenue: 28000, users: 8200 },
  { month: 'Fev', revenue: 32000, users: 9500 },
  { month: 'Mar', revenue: 39000, users: 11200 },
  { month: 'Abr', revenue: 42000, users: 12400 },
  { month: 'Mai', revenue: 45000, users: 13800 },
  { month: 'Jun', revenue: 48500, users: 14280 },
];

const regionData = [
  { region: 'São Paulo', users: 5800 },
  { region: 'Rio de Janeiro', users: 3400 },
  { region: 'Minas Gerais', users: 2100 },
  { region: 'Sul', users: 1800 },
  { region: 'Nordeste', users: 1180 },
];

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#ec4899'];

const STAGE_LABELS: Record<DealStage, { label: string; color: string }> = {
  lead: { label: 'Novo Lead', color: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  contact: { label: 'Em Contato', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  proposal: { label: 'Proposta Enviada', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  negotiation: { label: 'Em Negociação', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  won: { label: 'Fechado / Ganho', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  lost: { label: 'Perdido', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
};

export const AdminDashboardView: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'crm' | 'users' | 'challenges' | 'audit'>('analytics');

  // CRM State
  const [deals, setDeals] = useState<CrmDeal[]>(initialCrmDeals);
  const [crmUsers, setCrmUsers] = useState<CrmUser[]>(initialCrmUsers);
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);

  // Sync real users from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const fetchedUsers: CrmUser[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            fullName: data.fullName || data.displayName || 'Atleta Anônimo',
            email: data.email || 'atleta@clubsport.app',
            role: data.role === 'admin' ? 'Admin' : (data.role || 'Atleta'),
            status: data.status || 'Ativo',
            totalKm: data.totalKm || 0,
            points: data.points || 0,
            avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            joinedDate: data.createdAt ? new Date(data.createdAt).toISOString().split('T')[0] : '2026-07-31',
            region: data.region || 'São Paulo, SP'
          };
        });
        if (fetchedUsers.length > 0) {
          setCrmUsers(fetchedUsers);
        }
      },
      (err) => {
        console.warn('Could not fetch Firestore users:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  // Filters
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [dealCategoryFilter, setDealCategoryFilter] = useState<string>('all');

  // Modals state
  const [isNewDealModalOpen, setIsNewDealModalOpen] = useState(false);
  const [newDealForm, setNewDealForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    category: 'Patrocínio' as CrmDeal['category'],
    value: 50000,
    stage: 'lead' as DealStage,
    notes: '',
  });

  const [isNewChallengeModalOpen, setIsNewChallengeModalOpen] = useState(false);
  const [newChallengeForm, setNewChallengeForm] = useState({
    title: '',
    targetValue: 21,
    unit: 'KM',
    locationName: 'Parque do Ibirapuera, SP',
    lat: -23.5874,
    lng: -46.6576,
  });

  // Totals calculations
  const totalPipelineValue = deals.reduce((acc, d) => acc + d.value, 0);
  const wonDealsValue = deals.filter((d) => d.stage === 'won').reduce((acc, d) => acc + d.value, 0);
  const activeAthletesCount = crmUsers.filter((u) => u.status !== 'Suspenso').length;

  // Handlers for Deals
  const handleAddDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealForm.companyName.trim()) return;

    const newDeal: CrmDeal = {
      id: `deal_${Date.now()}`,
      companyName: newDealForm.companyName,
      contactName: newDealForm.contactName || 'Contato Principal',
      email: newDealForm.email || 'contato@empresa.com',
      phone: newDealForm.phone || '(11) 90000-0000',
      category: newDealForm.category,
      value: Number(newDealForm.value) || 10000,
      stage: newDealForm.stage,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: newDealForm.notes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setDeals([newDeal, ...deals]);
    setIsNewDealModalOpen(false);
    setNewDealForm({
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      category: 'Patrocínio',
      value: 50000,
      stage: 'lead',
      notes: '',
    });

    // Add audit log
    const log: AuditLog = {
      id: `log_${Date.now()}`,
      userId: 'user_admin',
      userName: 'Admin ClubSport',
      action: 'CRM_DEAL_CREATE',
      resource: `Deal: ${newDeal.companyName} (R$ ${newDeal.value.toLocaleString()})`,
      ipAddress: '192.168.1.1',
      timestamp: new Date().toISOString(),
    };
    setAuditLogs([log, ...auditLogs]);
  };

  const handleUpdateDealStage = (dealId: string, newStage: DealStage) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );
  };

  // Handlers for Users
  const handleToggleUserStatus = (userId: string) => {
    setCrmUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newStatus = u.status === 'Suspenso' ? 'Ativo' : 'Suspenso';
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  const handleAddPointsToUser = (userId: string) => {
    setCrmUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, points: u.points + 500 } : u))
    );
    alert('Concedidos +500 Pontos de Recompensa ao atleta!');
  };

  // Handlers for Challenges
  const handleApproveChallenge = (id: string) => {
    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'active' } : c))
    );
  };

  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChallengeForm.title.trim()) return;

    const created: Challenge = {
      id: `ch_${Date.now()}`,
      title: newChallengeForm.title,
      type: 'distance',
      scope: 'local',
      targetValue: newChallengeForm.targetValue,
      currentValue: 0,
      unit: newChallengeForm.unit,
      endsIn: '30 dias',
      joinedUsersCount: 1,
      bannerUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
      status: 'active',
      isJoined: true,
      locationName: newChallengeForm.locationName,
      lat: newChallengeForm.lat,
      lng: newChallengeForm.lng,
    };

    setChallenges([created, ...challenges]);
    setIsNewChallengeModalOpen(false);
    setNewChallengeForm({
      title: '',
      targetValue: 21,
      unit: 'KM',
      locationName: 'Parque do Ibirapuera, SP',
      lat: -23.5874,
      lng: -46.6576,
    });
  };

  // PDF Export using jsPDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('ClubSport - Relatório de Gestão CRM & Auditoria ADM', 14, 20);
    doc.setFontSize(10);
    doc.text(`Data do Relatório: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
    doc.text(`Receita Mensal Recorrente (MRR): R$ 48.500 | Pipeline Total: R$ ${totalPipelineValue.toLocaleString()}`, 14, 34);
    doc.text(`Atletas Ativos no CRM: ${activeAthletesCount} | Oportunidades Ganhas: R$ ${wonDealsValue.toLocaleString()}`, 14, 40);

    doc.setFontSize(12);
    doc.text('Oportunidades de Parceria (CRM Deals):', 14, 52);

    let y = 60;
    deals.forEach((deal, index) => {
      doc.setFontSize(9);
      doc.text(
        `${index + 1}. [${deal.companyName}] - ${deal.category} | R$ ${deal.value.toLocaleString('pt-BR')} | Estágio: ${STAGE_LABELS[deal.stage].label}`,
        14,
        y
      );
      y += 8;
    });

    y += 6;
    doc.setFontSize(12);
    doc.text('Logs de Auditoria do Sistema:', 14, y);
    y += 8;

    auditLogs.slice(0, 10).forEach((log, index) => {
      doc.setFontSize(8);
      doc.text(
        `${index + 1}. [${log.timestamp.slice(0, 19)}] Admin: ${log.userName} | Ação: ${log.action} | Recurso: ${log.resource}`,
        14,
        y
      );
      y += 6;
    });

    doc.save('ClubSport_CRM_Admin_Report.pdf');
  };

  // CSV Export
  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,ID,Empresa,Contato,Email,Telefone,Categoria,Valor_R$,Estagio,Data_Criacao\n';
    deals.forEach((d) => {
      csvContent += `"${d.id}","${d.companyName}","${d.contactName}","${d.email}","${d.phone}","${d.category}","${d.value}","${d.stage}","${d.createdAt}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'ClubSport_CRM_Deals_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Users
  const filteredUsers = crmUsers.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.region.toLowerCase().includes(userSearchQuery.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role.toLowerCase() === userRoleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 pb-28 max-w-lg mx-auto px-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              Gestão ADM & CRM
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono">ClubSport Business Intelligence</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-1.5">
          <button
            onClick={() => setIsNewDealModalOpen(true)}
            className="p-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-zinc-950 text-xs font-bold flex items-center gap-1 shadow-lg shadow-orange-500/20"
            title="Criar Nova Oportunidade CRM"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Novo Deal</span>
          </button>
          <button
            onClick={exportPDF}
            className="p-2 rounded-xl bg-zinc-800 text-orange-400 border border-orange-500/30 text-xs font-bold flex items-center gap-1 hover:bg-zinc-700"
            title="Exportar PDF do CRM"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Main CRM Navigation Tabs */}
      <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded-2xl border border-zinc-800/80 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
            activeTab === 'analytics'
              ? 'bg-orange-500 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Métricas</span>
        </button>
        <button
          onClick={() => setActiveTab('crm')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
            activeTab === 'crm'
              ? 'bg-orange-500 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Funil CRM</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
            activeTab === 'users'
              ? 'bg-orange-500 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Atletas</span>
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
            activeTab === 'challenges'
              ? 'bg-orange-500 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Desafios</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
            activeTab === 'audit'
              ? 'bg-orange-500 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Logs</span>
        </button>
      </div>

      {/* TAB 1: CRM ANALYTICS & KPIS */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl space-y-1 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-zinc-400">MRR Mensal</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-black text-white font-mono">R$ 48.500</div>
              <span className="text-[9px] text-emerald-400 font-bold block">+12.4% vs mês anterior</span>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl space-y-1 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Funil Ativo</span>
                <Briefcase className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-xl font-black text-orange-400 font-mono">
                R$ {(totalPipelineValue / 1000).toFixed(0)}k
              </div>
              <span className="text-[9px] text-zinc-400 block">{deals.length} parcerias em andamento</span>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl space-y-1 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Atletas Ativos</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl font-black text-blue-400 font-mono">14.280</div>
              <span className="text-[9px] text-zinc-400 block">1.5M impressões de treino</span>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl space-y-1 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Contratos Ganhos</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-black text-amber-400 font-mono">
                R$ {(wonDealsValue / 1000).toFixed(0)}k
              </div>
              <span className="text-[9px] text-emerald-400 font-bold block">Taxa conversão 68%</span>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase text-zinc-300 tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                Evolução da Receita & Assinaturas
              </h2>
              <span className="text-[10px] text-zinc-400 font-mono">2026</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueMonthlyData}>
                  <XAxis dataKey="month" stroke="#71717a" fontSize={9} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#09090b',
                      borderColor: '#27272a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`R$ ${val.toLocaleString('pt-BR')}`, 'Receita Mensal']}
                  />
                  <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Regional Users Chart */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3 shadow-xl">
            <h2 className="text-xs font-bold uppercase text-zinc-300 tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-orange-500" />
              Atletas por Região do Brasil
            </h2>

            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionData} layout="vertical">
                  <XAxis type="number" stroke="#71717a" fontSize={9} tickLine={false} />
                  <YAxis dataKey="region" type="category" stroke="#71717a" fontSize={9} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#09090b',
                      borderColor: '#27272a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="users" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FUNIL CRM (DEALS & PIPELINE) */}
      {activeTab === 'crm' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-orange-500" />
                Funil de Parcerias & Patrocínios
              </h2>
              <span className="text-[10px] text-zinc-400">Gerencie leads, clubes e patrocinadores esportivos</span>
            </div>
            <button
              onClick={() => setIsNewDealModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-orange-500 text-zinc-950 font-bold text-xs flex items-center gap-1 hover:bg-orange-600"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Novo Deal</span>
            </button>
          </div>

          {/* Deals list by Stage */}
          <div className="space-y-3">
            {deals.map((deal) => (
              <div
                key={deal.id}
                className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3 shadow-md hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{deal.companyName}</h3>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {deal.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-zinc-500" />
                        {deal.contactName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-zinc-500" />
                        {deal.email}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-orange-400 font-mono block">
                      R$ {deal.value.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Previsão: {deal.expectedCloseDate}
                    </span>
                  </div>
                </div>

                {deal.notes && (
                  <p className="text-xs text-zinc-300 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800/80">
                    "{deal.notes}"
                  </p>
                )}

                {/* Stage Selector Controls */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-400 font-bold">Estágio:</span>
                    <select
                      value={deal.stage}
                      onChange={(e) => handleUpdateDealStage(deal.id, e.target.value as DealStage)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none ${STAGE_LABELS[deal.stage].color}`}
                    >
                      <option value="lead">1. Novo Lead</option>
                      <option value="contact">2. Em Contato</option>
                      <option value="proposal">3. Proposta Enviada</option>
                      <option value="negotiation">4. Em Negociação</option>
                      <option value="won">5. Fechado / Ganho</option>
                      <option value="lost">X. Perdido</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handleUpdateDealStage(deal.id, 'won')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold hover:bg-emerald-500/20 flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Marcar Ganho</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GESTÃO DE ATLETAS & USUÁRIOS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" />
              CRM de Atletas ({crmUsers.length})
            </h2>
          </div>

          {/* Search & Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou cidade..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex space-x-1 overflow-x-auto no-scrollbar text-xs">
              {['all', 'atleta', 'coach', 'admin', 'parceiro'].map((role) => (
                <button
                  key={role}
                  onClick={() => setUserRoleFilter(role)}
                  className={`px-3 py-1 rounded-lg font-bold capitalize transition-all ${
                    userRoleFilter === role
                      ? 'bg-orange-500 text-zinc-950'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {role === 'all' ? 'Todos os Papéis' : role}
                </button>
              ))}
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-2.5">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={u.avatarUrl}
                    alt={u.fullName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-orange-500/40"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white">{u.fullName}</h3>
                      <span
                        className={`text-[9px] px-2 py-0.2 rounded font-bold ${
                          u.status === 'Suspenso'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : u.status === 'VIP / Pro'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {u.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 block">{u.email}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      📍 {u.region} | 🏃 {u.totalKm} KM | 🔥 {u.points} pts
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-1 text-right">
                  <button
                    onClick={() => handleAddPointsToUser(u.id)}
                    className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30 text-[10px] font-bold hover:bg-orange-500/20"
                  >
                    +500 Pts
                  </button>
                  <button
                    onClick={() => handleToggleUserStatus(u.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      u.status === 'Suspenso'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {u.status === 'Suspenso' ? 'Ativar' : 'Suspender'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: GESTÃO DE DESAFIOS */}
      {activeTab === 'challenges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-orange-500" />
              Gestão de Desafios & Campanhas
            </h2>
            <button
              onClick={() => setIsNewChallengeModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-orange-500 text-zinc-950 font-bold text-xs flex items-center gap-1 hover:bg-orange-600"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Novo Desafio</span>
            </button>
          </div>

          <div className="space-y-3">
            {challenges.map((c) => (
              <div
                key={c.id}
                className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-2xl flex items-center justify-between"
              >
                <div className="space-y-1 max-w-[220px]">
                  <h3 className="text-xs font-bold text-white truncate">{c.title}</h3>
                  <span className="text-[10px] text-zinc-400 block font-mono">
                    Meta: {c.targetValue} {c.unit} | 👥 {c.joinedUsersCount} participantes
                  </span>
                  {c.locationName && (
                    <span className="text-[10px] text-orange-400 block truncate">📍 {c.locationName}</span>
                  )}
                </div>

                <div className="flex space-x-1.5">
                  {c.status === 'pending_approval' ? (
                    <button
                      onClick={() => handleApproveChallenge(c.id)}
                      className="px-3 py-1.5 bg-emerald-500 text-zinc-950 text-[10px] font-bold rounded-xl uppercase hover:bg-emerald-400"
                    >
                      Aprovar
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-xl">
                      Ativo
                    </span>
                  )}
                  <button
                    onClick={() => alert(`Notificação Push enviada para os atletas participantes do desafio "${c.title}"!`)}
                    className="px-2.5 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/30 text-[10px] font-bold rounded-xl hover:bg-orange-500/20"
                  >
                    Boost
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: LOGS DE SEGURANÇA & AUDITORIA */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-500" />
              Logs de Auditoria do Sistema ({auditLogs.length})
            </h2>
            <button
              onClick={exportCSV}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-bold flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-[11px] space-y-1">
                <div className="flex justify-between font-bold text-orange-400">
                  <span>{log.action}</span>
                  <span className="text-zinc-500 font-mono text-[9px]">{log.timestamp.slice(11, 19)}</span>
                </div>
                <div className="text-zinc-300">
                  {log.userName} — {log.resource}
                </div>
                <div className="text-[9px] text-zinc-500 font-mono">IP do Dispositivo: {log.ipAddress}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CRIAR NOVO DEAL CRM */}
      {isNewDealModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-orange-500" />
                Nova Oportunidade CRM
              </h3>
              <button onClick={() => setIsNewDealModalOpen(false)} className="text-zinc-400 hover:text-white text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDeal} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-zinc-400 font-bold block mb-1">Empresa / Clube</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nike Brasil / Assessoria Run"
                  value={newDealForm.companyName}
                  onChange={(e) => setNewDealForm({ ...newDealForm, companyName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">Contato</label>
                  <input
                    type="text"
                    placeholder="Nome do Diretor"
                    value={newDealForm.contactName}
                    onChange={(e) => setNewDealForm({ ...newDealForm, contactName: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">Valor Contrato (R$)</label>
                  <input
                    type="number"
                    value={newDealForm.value}
                    onChange={(e) => setNewDealForm({ ...newDealForm, value: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-bold block mb-1">Categoria do Negócio</label>
                <select
                  value={newDealForm.category}
                  onChange={(e) => setNewDealForm({ ...newDealForm, category: e.target.value as any })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Patrocínio">Patrocínio</option>
                  <option value="Clube de Corrida">Clube de Corrida</option>
                  <option value="Parceria Corporativa">Parceria Corporativa</option>
                  <option value="Evento Esportivo">Evento Esportivo</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-bold block mb-1">Observações da Proposta</label>
                <textarea
                  rows={2}
                  placeholder="Detalhes dos benefícios, ativação e metas..."
                  value={newDealForm.notes}
                  onChange={(e) => setNewDealForm({ ...newDealForm, notes: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewDealModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-orange-500 text-zinc-950 font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/20"
                >
                  Salvar Oportunidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR NOVO DESAFIO ADM */}
      {isNewChallengeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-orange-500" />
                Criar Desafio Oficial ADM
              </h3>
              <button onClick={() => setIsNewChallengeModalOpen(false)} className="text-zinc-400 hover:text-white text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateChallenge} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-zinc-400 font-bold block mb-1">Título do Desafio</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Desafio Meia Maratona 21K"
                  value={newChallengeForm.title}
                  onChange={(e) => setNewChallengeForm({ ...newChallengeForm, title: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">Meta</label>
                  <input
                    type="number"
                    value={newChallengeForm.targetValue}
                    onChange={(e) => setNewChallengeForm({ ...newChallengeForm, targetValue: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">Unidade</label>
                  <select
                    value={newChallengeForm.unit}
                    onChange={(e) => setNewChallengeForm({ ...newChallengeForm, unit: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="KM">KM</option>
                    <option value="KCAL">KCAL</option>
                    <option value="DIAS">DIAS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-bold block mb-1">Localização GPS / Cidade</label>
                <input
                  type="text"
                  value={newChallengeForm.locationName}
                  onChange={(e) => setNewChallengeForm({ ...newChallengeForm, locationName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewChallengeModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-orange-500 text-zinc-950 font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/20"
                >
                  Publicar Desafio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
