import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Timer, Award, Zap, ChevronLeft } from 'lucide-react';

interface AnalyticsViewProps {
  onBack?: () => void;
}

const paceData = [
  { day: 'MON', pace: 5.4 },
  { day: 'TUE', pace: 5.2 },
  { day: 'WED', pace: 4.8 },
  { day: 'THU', pace: 5.1 },
  { day: 'FRI', pace: 4.9 },
  { day: 'SAT', pace: 5.6 },
  { day: 'SUN', pace: 4.6 },
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onBack }) => {
  const [timeRange, setTimeRange] = useState<'7d' | 'month' | 'year'>('7d');

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto px-4">
      {/* Top Header */}
      <div className="flex items-center space-x-3 pt-2">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-2xl font-black text-white tracking-tight">Sports Evolution</h1>
      </div>

      {/* Time Filter Tabs: Last 7 days | Last Month | Year (Image 5) */}
      <div className="grid grid-cols-3 gap-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
        <button
          onClick={() => setTimeRange('7d')}
          className={`py-2 rounded-xl text-xs font-bold transition-all ${
            timeRange === '7d'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Last 7 days
        </button>
        <button
          onClick={() => setTimeRange('month')}
          className={`py-2 rounded-xl text-xs font-bold transition-all ${
            timeRange === 'month'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Last Month
        </button>
        <button
          onClick={() => setTimeRange('year')}
          className={`py-2 rounded-xl text-xs font-bold transition-all ${
            timeRange === 'year'
              ? 'bg-orange-500 text-zinc-950 shadow-md shadow-orange-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Year
        </button>
      </div>

      {/* Average Pace Curve Chart (Image 5) */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3 shadow-xl">
        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          AVERAGE PACE (MIN/KM)
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={paceData}>
              <defs>
                <linearGradient id="colorPace" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#71717a" fontSize={10} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} domain={[4, 6]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                formatter={(val: any) => [`${val} min/km`, 'Pace']}
              />
              <Area type="monotone" dataKey="pace" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorPace)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3 Metric Cards Grid (Image 5 center) */}
      <div className="grid grid-cols-3 gap-3">
        {/* Pace Improvement */}
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl text-center space-y-1">
          <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-400 mx-auto flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-bold uppercase text-zinc-400 block leading-tight">
            PACE IMPROVEMENT
          </span>
          <div className="text-sm font-black text-white flex items-center justify-center gap-0.5 text-emerald-400 font-mono">
            <ArrowUpRight className="w-4 h-4" /> 4.5%
          </div>
          <span className="text-[9px] text-zinc-400 uppercase">INCREASE</span>
        </div>

        {/* Endurance Growth */}
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl text-center space-y-1">
          <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-400 mx-auto flex items-center justify-center">
            <Timer className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-bold uppercase text-zinc-400 block leading-tight">
            ENDURANCE GROWTH
          </span>
          <div className="text-base font-black text-white font-mono">
            25.5
          </div>
          <span className="text-[9px] text-zinc-400 uppercase">HOURS</span>
        </div>

        {/* Achievement Progress */}
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl text-center space-y-1">
          <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-400 mx-auto flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-bold uppercase text-zinc-400 block leading-tight">
            ACHIEVEMENT PROGRESS
          </span>
          <div className="text-base font-black text-white font-mono">
            85%
          </div>
          <span className="text-[9px] text-zinc-400 uppercase">COMPLETED</span>
        </div>
      </div>

      {/* Milestones (Image 5 bottom) */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3">
        <h2 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
          MILESTONES
        </h2>

        <div className="grid grid-cols-3 gap-3">
          {/* Milestone 1 */}
          <div className="flex flex-col items-center text-center space-y-1">
            <div className="w-16 h-16 rounded-full border-4 border-orange-500 flex items-center justify-center bg-zinc-950">
              <Timer className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-[10px] font-bold text-zinc-300">FASTEST 10K</span>
          </div>

          {/* Milestone 2 */}
          <div className="flex flex-col items-center text-center space-y-1">
            <div className="w-16 h-16 rounded-full border-4 border-amber-500/50 flex items-center justify-center bg-zinc-950">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-[10px] font-bold text-zinc-300">LONGEST RIDE</span>
          </div>

          {/* Milestone 3 */}
          <div className="flex flex-col items-center text-center space-y-1">
            <div className="w-16 h-16 rounded-full border-4 border-orange-600 flex items-center justify-center bg-zinc-950">
              <Award className="w-6 h-6 text-orange-500" />
            </div>
            <span className="text-[10px] font-bold text-zinc-300">NEW MARATHON PB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
