import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, Download, CheckCircle, Flame, Users, FileText, ChevronLeft, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import { initialAuditLogs } from '../../data/mockData';
import { AuditLog } from '../../types';

interface AdminDashboardProps {
  onBack?: () => void;
}

const regionData = [
  { region: 'North America', users: 17 },
  { region: 'Europe', users: 13 },
  { region: 'Asia', users: 10 },
  { region: 'India', users: 6 },
  { region: 'South America', users: 5 },
  { region: 'Others', users: 3 },
];

export const AdminDashboardView: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [campaigns, setCampaigns] = useState([
    { id: 'c1', name: 'Summer Run Challenge', status: 'Active', impressions: '2.1M', ctr: '4.5%', conversion: '1.2%' },
    { id: 'c2', name: 'Global Cycling Sprint', status: 'Active', impressions: '1.8M', ctr: '3.9%', conversion: '1.0%' },
    { id: 'c3', name: 'Triathlon Masters 2026', status: 'Pending Approval', impressions: '890k', ctr: '5.1%', conversion: '2.4%' },
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [activeTab, setActiveTab] = useState<'metrics' | 'campaigns' | 'audit'>('metrics');

  const handleApproveCampaign = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'Active Approved' } : c))
    );
  };

  const handleBoostCampaign = (id: string) => {
    alert(`Campanha ${id} promovida com sucesso! Notificações Push enviadas aos atletas da região.`);
  };

  // PDF Export using jsPDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('ClubSport - Relatório de Auditoria e Desempenho do Sistema', 14, 20);
    doc.setFontSize(10);
    doc.text(`Data do Relatório: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
    doc.text(`Total de Usuários Ativos: 1.5M | Taxa de Engajamento: 8.7%`, 14, 34);

    doc.setFontSize(12);
    doc.text('Logs de Auditoria Recentes:', 14, 46);

    let y = 54;
    auditLogs.forEach((log, index) => {
      doc.setFontSize(9);
      doc.text(
        `${index + 1}. [${log.timestamp.slice(0, 19)}] User: ${log.userName} | Action: ${log.action} | Resource: ${log.resource} | IP: ${log.ipAddress}`,
        14,
        y
      );
      y += 8;
    });

    doc.save('ClubSport_Audit_Report.pdf');
  };

  // CSV Export
  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,ID,Timestamp,User,Action,Resource,IP_Address\n';
    auditLogs.forEach((l) => {
      csvContent += `"${l.id}","${l.timestamp}","${l.userName}","${l.action}","${l.resource}","${l.ipAddress}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'ClubSport_Audit_Logs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto px-4">
      {/* Header */}
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
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-orange-500" />
            Admin Dashboard
          </h1>
        </div>

        {/* Audit Export Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={exportPDF}
            className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/30 text-xs font-bold flex items-center gap-1 hover:bg-orange-500/20"
            title="Exportar PDF de Auditoria"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
          <button
            onClick={exportCSV}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-bold flex items-center gap-1"
            title="Exportar CSV de Logs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Top 3 KPI Cards (Image 6 top) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl space-y-1">
          <span className="text-[9px] font-bold uppercase text-zinc-400 block truncate">
            Total Active Users
          </span>
          <div className="text-xl font-black text-orange-500 font-mono">1.5M</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl space-y-1">
          <span className="text-[9px] font-bold uppercase text-zinc-400 block truncate">
            App Engagement Rate
          </span>
          <div className="text-xl font-black text-orange-500 font-mono">8.7%</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl space-y-1">
          <span className="text-[9px] font-bold uppercase text-zinc-400 block truncate">
            Ad Revenue
          </span>
          <div className="text-xl font-black text-orange-500 font-mono">$450k</div>
        </div>
      </div>

      {/* User Growth by Region Bar Chart (Image 6 center) */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3 shadow-xl">
        <h2 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
          User Growth by Region
        </h2>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionData}>
              <XAxis dataKey="region" stroke="#71717a" fontSize={9} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={9} tickLine={false} unit="k" />
              <Tooltip
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                formatter={(val: any) => [`${val}k Users`, 'Athletes']}
              />
              <Bar dataKey="users" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Campaign Performance Table with Approve/Boost (Image 6 bottom) */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3">
        <h2 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
          Campaign Performance
        </h2>

        <div className="space-y-3">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="bg-zinc-950/70 border border-zinc-800 p-3 rounded-xl flex items-center justify-between"
            >
              <div>
                <h3 className="text-xs font-bold text-white">{c.name}</h3>
                <span className="text-[10px] text-emerald-400 font-mono block">{c.status}</span>
                <span className="text-[10px] text-zinc-400">
                  {c.impressions} Impressions | {c.ctr} CTR | {c.conversion} Conv
                </span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleApproveCampaign(c.id)}
                  className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-zinc-950 text-[10px] font-bold rounded-lg uppercase"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleBoostCampaign(c.id)}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-orange-400 border border-orange-500/30 text-[10px] font-bold rounded-lg uppercase"
                >
                  Boost
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3">
        <h2 className="text-xs font-bold uppercase text-zinc-400 tracking-wider flex items-center justify-between">
          <span>System Security Audit Logs</span>
          <span className="text-[10px] text-orange-400 font-mono">{auditLogs.length} Records</span>
        </h2>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {auditLogs.map((log) => (
            <div key={log.id} className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 text-[11px] space-y-1">
              <div className="flex justify-between font-bold text-orange-400">
                <span>{log.action}</span>
                <span className="text-zinc-500 font-mono text-[9px]">{log.timestamp.slice(11, 19)}</span>
              </div>
              <div className="text-zinc-300">
                {log.userName} ({log.resource})
              </div>
              <div className="text-[9px] text-zinc-500 font-mono">IP: {log.ipAddress}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
