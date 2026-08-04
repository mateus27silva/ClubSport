import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Timer, Award, Zap, ChevronLeft, Activity, Trophy } from 'lucide-react';
import { ActivityPost, Challenge } from '../../types';

interface AnalyticsViewProps {
  activities?: ActivityPost[];
  challenges?: Challenge[];
  onBack?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  activities = [],
  challenges = [],
  onBack
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | 'month' | 'year'>('7d');

  // Filter activities based on selected time range
  const filteredActivities = useMemo(() => {
    const now = new Date().getTime();
    const rangeMs =
      timeRange === '7d'
        ? 7 * 24 * 60 * 60 * 1000
        : timeRange === 'month'
        ? 30 * 24 * 60 * 60 * 1000
        : 365 * 24 * 60 * 60 * 1000;

    return activities.filter((act) => {
      const actTime = act.createdAt ? new Date(act.createdAt).getTime() : now;
      return now - actTime <= rangeMs;
    });
  }, [activities, timeRange]);

  // Total statistics
  const totalHours = useMemo(() => {
    const totalSec = filteredActivities.reduce((acc, act) => acc + (act.durationSec || 0), 0);
    return (totalSec / 3600).toFixed(1);
  }, [filteredActivities]);

  const avgPace = useMemo(() => {
    if (filteredActivities.length === 0) return '0.0';
    const totalDist = filteredActivities.reduce((acc, act) => acc + (act.distanceKm || 0), 0);
    const totalSec = filteredActivities.reduce((acc, act) => acc + (act.durationSec || 0), 0);
    if (totalDist <= 0) return '0.0';
    const paceMinPerKm = (totalSec / 60) / totalDist;
    const paceMin = Math.floor(paceMinPerKm);
    const paceSec = Math.round((paceMinPerKm - paceMin) * 60);
    return `${paceMin}.${paceSec < 10 ? '0' : ''}${paceSec}`;
  }, [filteredActivities]);

  const challengeProgressPercent = useMemo(() => {
    if (challenges.length === 0) return '0%';
    const joined = challenges.filter((c) => c.isJoined);
    if (joined.length === 0) return '0%';
    const completed = joined.filter((c) => c.currentValue >= c.targetValue);
    return `${Math.round((completed.length / joined.length) * 100)}%`;
  }, [challenges]);

  // Chart data calculation
  const chartData = useMemo(() => {
    if (timeRange === '7d') {
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          dayName: days[d.getDay()],
          dateStr: d.toISOString().split('T')[0],
          totalDist: 0,
          totalSec: 0,
        };
      });

      filteredActivities.forEach((act) => {
        if (!act.createdAt) return;
        const actDate = new Date(act.createdAt).toISOString().split('T')[0];
        const dayObj = last7Days.find((d) => d.dateStr === actDate);
        if (dayObj) {
          dayObj.totalDist += act.distanceKm || 0;
          dayObj.totalSec += act.durationSec || 0;
        }
      });

      return last7Days.map((d) => {
        const pace =
          d.totalDist > 0 ? parseFloat(((d.totalSec / 60) / d.totalDist).toFixed(1)) : 0;
        return {
          day: d.dayName,
          pace: pace > 0 ? pace : 0,
        };
      });
    }

    // Monthly or Yearly fallback aggregation
    return [
      { day: 'Sem 1', pace: filteredActivities.length > 0 ? parseFloat(avgPace) : 0 },
      { day: 'Sem 2', pace: filteredActivities.length > 0 ? parseFloat(avgPace) : 0 },
      { day: 'Sem 3', pace: filteredActivities.length > 0 ? parseFloat(avgPace) : 0 },
      { day: 'Sem 4', pace: filteredActivities.length > 0 ? parseFloat(avgPace) : 0 },
    ];
  }, [filteredActivities, timeRange, avgPace]);

  // Personal Milestones from actual user activity
  const milestones = useMemo(() => {
    if (activities.length === 0) return null;

    let maxDist = 0;
    let maxTimeSec = 0;
    let bestPaceSec = Infinity;

    activities.forEach((act) => {
      if (act.distanceKm > maxDist) maxDist = act.distanceKm;
      if (act.durationSec > maxTimeSec) maxTimeSec = act.durationSec;
      if (act.distanceKm > 0.5) {
        const pace = act.durationSec / act.distanceKm;
        if (pace < bestPaceSec) bestPaceSec = pace;
      }
    });

    return {
      maxDist: maxDist > 0 ? `${maxDist.toFixed(1)} km` : '---',
      maxTime: maxTimeSec > 0 ? `${Math.round(maxTimeSec / 60)} min` : '---',
      bestPace:
        bestPaceSec < Infinity
          ? `${Math.floor(bestPaceSec / 60)}'${Math.round(bestPaceSec % 60)
              .toString()
              .padStart(2, '0')}"/km`
          : '---',
    };
  }, [activities]);

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto px-4">
      {/* Top Header */}
      <div className="flex items-center space-x-3 pt-2">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Evolução Esportiva</h1>
      </div>

      {/* Time Filter Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <button
          onClick={() => setTimeRange('7d')}
          className={`py-2 rounded-xl text-xs font-bold transition-all ${
            timeRange === '7d'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          Últimos 7 dias
        </button>
        <button
          onClick={() => setTimeRange('month')}
          className={`py-2 rounded-xl text-xs font-bold transition-all ${
            timeRange === 'month'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          Último Mês
        </button>
        <button
          onClick={() => setTimeRange('year')}
          className={`py-2 rounded-xl text-xs font-bold transition-all ${
            timeRange === 'year'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          Ano
        </button>
      </div>

      {/* Average Pace Curve Chart */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl space-y-3 shadow-sm dark:shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            PACE MÉDIO (MIN/KM)
          </div>
          <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">{avgPace} min/km</span>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="h-44 w-full flex flex-col items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl p-4 text-center space-y-2 bg-zinc-50 dark:bg-transparent">
            <Activity className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Nenhum treino no período selecionado</p>
            <p className="text-[10px] text-zinc-500">Registre treinos no botão '+' para visualizar o gráfico de evolução.</p>
          </div>
        ) : (
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPace" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} min/km`, 'Pace']}
                />
                <Area
                  type="monotone"
                  dataKey="pace"
                  stroke="#f97316"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPace)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 3 Metric Cards Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Pace Improvement */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl text-center space-y-1 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 dark:text-orange-400 mx-auto flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-bold uppercase text-zinc-600 dark:text-zinc-400 block leading-tight">
            PACE MÉDIO
          </span>
          <div className="text-xs font-black text-zinc-900 dark:text-white flex items-center justify-center gap-0.5 font-mono">
            {avgPace}
          </div>
          <span className="text-[9px] text-zinc-500 uppercase">MIN/KM</span>
        </div>

        {/* Endurance Growth */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl text-center space-y-1 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 dark:text-orange-400 mx-auto flex items-center justify-center">
            <Timer className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-bold uppercase text-zinc-600 dark:text-zinc-400 block leading-tight">
            TEMPO TOTAL
          </span>
          <div className="text-xs font-black text-zinc-900 dark:text-white font-mono">
            {totalHours}
          </div>
          <span className="text-[9px] text-zinc-500 uppercase">HORAS</span>
        </div>

        {/* Achievement Progress */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl text-center space-y-1 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 dark:text-orange-400 mx-auto flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-bold uppercase text-zinc-600 dark:text-zinc-400 block leading-tight">
            DESAFIOS
          </span>
          <div className="text-xs font-black text-zinc-900 dark:text-white font-mono">
            {challengeProgressPercent}
          </div>
          <span className="text-[9px] text-zinc-500 uppercase">CONCLUÍDOS</span>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl space-y-3 shadow-sm">
        <h2 className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-400 tracking-wider">
          MARCOS ALCANÇADOS
        </h2>

        {milestones ? (
          <div className="grid grid-cols-3 gap-3">
            {/* Milestone 1 */}
            <div className="flex flex-col items-center text-center space-y-1">
              <div className="w-14 h-14 rounded-full border-2 border-orange-500 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950">
                <Timer className="w-5 h-5 text-orange-500 dark:text-orange-400" />
              </div>
              <span className="text-[10px] font-bold text-zinc-900 dark:text-white block">{milestones.maxDist}</span>
              <span className="text-[9px] text-zinc-500 uppercase block">MAIOR DISTÂNCIA</span>
            </div>

            {/* Milestone 2 */}
            <div className="flex flex-col items-center text-center space-y-1">
              <div className="w-14 h-14 rounded-full border-2 border-amber-500 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950">
                <Zap className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              </div>
              <span className="text-[10px] font-bold text-zinc-900 dark:text-white block">{milestones.maxTime}</span>
              <span className="text-[9px] text-zinc-500 uppercase block">MAIOR DURAÇÃO</span>
            </div>

            {/* Milestone 3 */}
            <div className="flex flex-col items-center text-center space-y-1">
              <div className="w-14 h-14 rounded-full border-2 border-orange-600 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950">
                <Trophy className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-[10px] font-bold text-zinc-900 dark:text-white block">{milestones.bestPace}</span>
              <span className="text-[9px] text-zinc-500 uppercase block">MELHOR PACE</span>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center space-y-1 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-transparent">
            <Trophy className="w-6 h-6 text-zinc-400 dark:text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Nenhum marco registrado ainda</p>
            <p className="text-[10px] text-zinc-500">
              Inicie um treino para que o ClubSport identifique suas melhores marcas esportivas!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

