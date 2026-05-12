import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { WasteReport, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { CheckCircle2, Clock, MapPin, Trash2, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';

interface AnalyticsDashboardProps {
  reports: WasteReport[];
  userProfile: UserProfile | null;
  onUpdateReport: (id: string, data: Partial<WasteReport>) => void;
}

const COLORS = ['#ea580c', '#16a34a', '#8b5cf6', '#3b82f6', '#ec4899'];

export default function AnalyticsDashboard({ reports, userProfile, onUpdateReport }: AnalyticsDashboardProps) {
  const stats = useMemo(() => {
    const total = reports.length;
    const cleaned = reports.filter(r => r.status === 'Cleaned').length;
    const pending = total - cleaned;
    return { total, cleaned, pending };
  }, [reports]);

  const wasteTypeData = useMemo(() => {
    const types: Record<string, number> = {};
    reports.forEach(r => {
      types[r.wasteType] = (types[r.wasteType] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [reports]);

  const recentReports = useMemo(() => reports.slice(0, 10), [reports]);

  return (
    <div className="flex-1 overflow-y-auto bg-white p-4 md:p-6 lg:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-10">
        
        <header className="px-2">
          <h1 className="text-3xl md:text-4xl font-serif font-black text-stone-900 mb-2">Analytics Overview</h1>
          <p className="text-sm text-stone-500 font-medium italic">Environmental impact monitoring</p>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-stone-50 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-stone-100 flex flex-col justify-between">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Total Reports</p>
            <div className="flex items-end justify-between gap-2">
              <span className="text-4xl md:text-5xl font-serif font-black text-stone-900">{stats.total}</span>
              <span className="text-stone-300 mb-2"><BarChart2 className="w-5 h-5 md:w-6 h-6" /></span>
            </div>
          </div>
          <div className="bg-orange-50 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-orange-100 flex flex-col justify-between">
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-4">Pending Response</p>
            <div className="flex items-end justify-between gap-2">
              <span className="text-4xl md:text-5xl font-serif font-black text-orange-700">{stats.pending}</span>
              <span className="text-orange-300 mb-2"><Clock className="w-5 h-5 md:w-6 h-6" /></span>
            </div>
          </div>
          <div className="bg-green-50 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-green-100 flex flex-col justify-between">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-4">Successful Cleanups</p>
            <div className="flex items-end justify-between gap-2">
              <span className="text-4xl md:text-5xl font-serif font-black text-green-700">{stats.cleaned}</span>
              <span className="text-green-300 mb-2"><CheckCircle2 className="w-5 h-5 md:w-6 h-6" /></span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
          {/* Waste Composition */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.50rem] border border-stone-100 shadow-xl shadow-stone-100/50">
            <h3 className="text-lg md:text-xl font-serif font-bold text-stone-900 mb-6 md:mb-8">Waste Composition</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wasteTypeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a8a29e' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a8a29e' }} />
                  <Tooltip cursor={{ fill: '#fafaf9' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {wasteTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-[2.50rem] border border-stone-100 shadow-xl shadow-stone-100/50 overflow-hidden">
            <div className="p-8 border-b border-stone-50">
              <h3 className="text-xl font-serif font-bold text-stone-900">Recent Activity</h3>
            </div>
            <div className="divide-y divide-stone-50 max-h-[400px] overflow-y-auto">
              {recentReports.map((report) => (
                <div key={report.id} className="p-6 flex items-center gap-6 hover:bg-stone-50 transition-colors group">
                  <div className="w-16 h-16 rounded-2xl bg-stone-100 overflow-hidden flex-shrink-0">
                    {report.imageUrl ? (
                      <img 
                        src={report.imageUrl || undefined} 
                        alt="" 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <MapPin className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                        report.status === 'Cleaned' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                      )}>
                        {report.status}
                      </span>
                      <h4 className="text-sm font-bold text-stone-800 truncate">{report.wasteType} Case</h4>
                    </div>
                    <p className="text-xs text-stone-500 truncate mb-1">{report.description}</p>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-stone-300 uppercase tracking-widest">
                       <span>{report.reportedByName}</span>
                       <span className="w-1 h-1 bg-stone-200 rounded-full" />
                       <span>{report.reportedAt ? format(new Date(report.reportedAt.seconds * 1000), 'MMM dd') : 'Just now'}</span>
                    </div>
                  </div>
                </div>
              ))}
              {recentReports.length === 0 && (
                <div className="p-20 text-center text-stone-400">
                  <Trash2 className="w-10 h-10 mx-auto mb-4 opacity-10" />
                  <p className="text-xs font-bold uppercase tracking-widest">No reports found</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
