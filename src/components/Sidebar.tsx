import { Trophy, MapPin, CheckCircle2, Users, ArrowRight, X } from 'lucide-react';
import { UserProfile, WasteReport } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  reports: WasteReport[];
  leaderboard: UserProfile[];
  activeView: 'map' | 'dashboard' | 'tasks';
  onViewChange: (view: 'map' | 'dashboard' | 'tasks') => void;
  onNewReport: () => void;
}

export default function Sidebar({ 
  isOpen,
  onClose,
  userProfile, 
  reports, 
  leaderboard, 
  activeView,
  onViewChange,
  onNewReport, 
}: SidebarProps) {
  const pendingCount = reports.filter(r => r.status === 'Pending').length;
  const cleanedCount = reports.filter(r => r.status === 'Cleaned').length;

  const isAuthority = userProfile?.role === 'authority';

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed inset-y-0 left-0 w-full md:w-80 bg-stone-50 border-r border-stone-100 flex flex-col z-50 transition-transform duration-300 transform lg:translate-x-0 lg:static lg:h-[calc(100vh-64px)] overflow-y-auto font-sans",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between lg:hidden mb-2">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Navigation</h2>
            <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-900">
              <X className="w-5 h-5" />
            </button>
          </div>
        
        {/* Navigation Tabs */}
        <div className="flex p-1 bg-stone-200/50 rounded-2xl">
          <button 
            onClick={() => onViewChange('map')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeView === 'map' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
            )}
          >
            <MapPin className="w-3 h-3" />
            Field Map
          </button>
          <button 
            onClick={() => onViewChange('dashboard')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeView === 'dashboard' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
            )}
          >
            <ArrowRight className="w-3 h-3" />
            Analytics
          </button>
          {isAuthority && (
            <button 
              onClick={() => onViewChange('tasks')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeView === 'tasks' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
              )}
            >
              <CheckCircle2 className="w-3 h-3" />
              Cleanup
            </button>
          )}
        </div>
        {/* User Card */}
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <Trophy className="w-20 h-20 text-orange-600" />
          </div>
          <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Impact Score</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-serif font-black text-stone-900">{userProfile?.ecoKarma || 0}</span>
            <span className="text-xs font-bold text-stone-400 uppercase pb-1.5">Eco-Karma</span>
          </div>
          <div className="mt-4 pt-4 border-t border-stone-100 flex flex-col gap-1">
             <p className="text-[10px] font-bold text-stone-400 uppercase">Current Role</p>
             <div className="flex items-center justify-between">
                <span className={cn(
                  "text-sm font-bold uppercase tracking-tight px-2 py-0.5 rounded-lg",
                  isAuthority ? "bg-stone-900 text-white" : "bg-orange-100 text-orange-700"
                )}>
                  {userProfile?.role || 'Volunteer'}
                </span>
             </div>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <MapPin className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
            </div>
            <p className="text-2xl font-serif font-bold text-red-900">{pendingCount}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Cleaned</span>
            </div>
            <p className="text-2xl font-serif font-bold text-green-900">{cleanedCount}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <button
            onClick={onNewReport}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-2xl font-bold transition-all shadow-lg shadow-orange-200 flex items-center justify-between group"
          >
            Report Blackspot
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Leaderboard */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-serif font-bold text-stone-900">Top Sentinels</h3>
            <Trophy className="w-4 h-4 text-orange-400" />
          </div>
          <div className="space-y-4">
            {leaderboard.map((user, idx) => (
              <div key={user.uid} className="flex items-center gap-3">
                <span className="text-xs font-bold text-stone-300 w-4">{idx + 1}</span>
                <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-100 flex-shrink-0">
                  {user.photoURL ? (
                    <img src={user.photoURL || undefined} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-stone-100" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-stone-800 truncate">{user.displayName}</p>
                  <p className="text-[10px] text-stone-400 uppercase font-medium">{user.role}</p>
                </div>
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  {user.ecoKarma}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>


    </aside>
    </>
  );
}
