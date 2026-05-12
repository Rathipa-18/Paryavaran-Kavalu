import { useMemo } from 'react';
import { WasteReport, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Trash2, 
  Search, 
  Filter, 
  LayoutList,
  AlertTriangle,
  Navigation
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface RestorationTasksProps {
  reports: WasteReport[];
  userProfile: UserProfile | null;
  onMarkAsCleaned: (report: WasteReport) => void;
}

export default function RestorationTasks({ reports, userProfile, onMarkAsCleaned }: RestorationTasksProps) {
  const pendingReports = useMemo(() => 
    reports.filter(r => r.status === 'Pending')
      .sort((a, b) => (b.reportedAt?.seconds || 0) - (a.reportedAt?.seconds || 0)),
    [reports]
  );

  const isAuthority = userProfile?.role === 'authority';

  // Helper to "generate" a descriptive location from coordinates if description is short
  const getDescriptiveLocation = (report: WasteReport) => {
    if (report.description && report.description.length > 15) return report.description;
    
    // Fallback descriptive name
    const latPrefix = report.lat > 0 ? 'North' : 'South';
    const lngPrefix = report.lng > 0 ? 'East' : 'West';
    return `${report.wasteType} site near ${latPrefix} Sector ${Math.abs(Math.floor(report.lat * 100))}, ${lngPrefix} Point ${Math.abs(Math.floor(report.lng * 100))}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafaf9] p-4 md:p-8 lg:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="p-2.5 bg-green-600 rounded-2xl shadow-xl shadow-green-100">
                <LayoutList className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
                Cleanup Management
              </span>
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-serif font-black text-stone-900 tracking-tight leading-[0.9]">
              Field <br /> <span className="text-stone-400">Restoration.</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
             <div className="bg-white px-5 py-3 rounded-2xl border border-stone-100 shadow-sm">
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Open Cases</p>
                <div className="flex items-center gap-2">
                   <span className="text-xl font-black text-stone-900">{pendingReports.length}</span>
                   <AlertTriangle className="w-4 h-4 text-orange-500" />
                </div>
             </div>
          </div>
        </header>

        <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-100/50 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-stone-50 bg-stone-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                <input 
                  type="text" 
                  placeholder="Search by location or waste type..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-stone-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
              <button className="p-3 bg-white border border-stone-100 rounded-2xl text-stone-400 hover:text-stone-900 transition-all">
                <Filter className="w-5 h-5" />
              </button>
            </div>

            {!isAuthority && (
              <div className="px-4 py-2 bg-orange-50 rounded-xl border border-orange-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-[10px] font-black uppercase text-orange-700">Authority Access Required to update</span>
              </div>
            )}
          </div>

          <div className="divide-y divide-stone-50">
            <AnimatePresence mode="popLayout">
              {pendingReports.map((report, idx) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  key={report.id} 
                  className="p-6 md:p-8 flex items-start gap-6 hover:bg-stone-50/50 transition-all group"
                >
                  <div className="pt-1">
                    <button 
                      disabled={!isAuthority}
                      onClick={() => onMarkAsCleaned(report)}
                      className={cn(
                        "w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all",
                        isAuthority 
                          ? "border-stone-200 hover:border-green-500 hover:bg-green-50 text-transparent hover:text-green-600 cursor-pointer" 
                          : "border-stone-100 bg-stone-50 text-transparent cursor-not-allowed"
                      )}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-stone-100 overflow-hidden flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
                    {report.imageUrl ? (
                      <img 
                        src={report.imageUrl} 
                        alt="" 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <MapPin className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                        report.wasteType === 'Plastic' ? "bg-blue-50 text-blue-600" :
                        report.wasteType === 'Organic' ? "bg-green-50 text-green-600" :
                        report.wasteType === 'Electronic' ? "bg-purple-50 text-purple-600" :
                        "bg-stone-100 text-stone-600"
                      )}>
                        {report.wasteType}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                         <Calendar className="w-3.5 h-3.5" />
                         {report.reportedAt ? format(new Date(report.reportedAt.seconds * 1000), 'MMM dd, HH:mm') : 'Just now'}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-serif font-bold text-stone-900 mb-1 group-hover:text-green-700 transition-colors">
                      {getDescriptiveLocation(report)}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-xs font-medium text-stone-500">
                       <span className="flex items-center gap-1.5">
                         <MapPin className="w-3.5 h-3.5 text-stone-300" />
                         {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                       </span>
                       <span className="flex items-center gap-1.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-stone-200" />
                         Reported by {report.reportedByName}
                       </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                       <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">
                         <Navigation className="w-3.5 h-3.5" />
                         Navigate to site
                       </button>
                    </div>
                  </div>

                  <div className="hidden md:block">
                     <button className="p-3 text-stone-300 hover:text-red-500 transition-colors">
                       <Trash2 className="w-5 h-5" />
                     </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {pendingReports.length === 0 && (
              <div className="p-20 text-center">
                 <div className="w-24 h-24 bg-green-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-green-200">
                    <CheckCircle2 className="w-12 h-12" />
                 </div>
                 <h3 className="text-2xl font-serif font-black text-stone-900 mb-2">Ecosystem Restored.</h3>
                 <p className="text-sm font-bold text-stone-400 uppercase tracking-[0.2em]">Zero pending blackspots in queue</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
