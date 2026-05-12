import { useState, useEffect } from 'react';
import { auth, db, signInWithGoogle } from './firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  setDoc, 
  increment, 
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { WasteReport, UserProfile, WasteType } from './types';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';
import { useFusedLocation } from './hooks/useFusedLocation';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import ReportModal from './components/ReportModal';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import RestorationTasks from './components/RestorationTasks';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, AlertCircle, Plus, MapPin, X } from 'lucide-react';

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'map' | 'dashboard' | 'tasks'>('map');
  const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; accuracy?: number | null } | null>(null);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  // useFusedLocation provides GPS coordinates with high accuracy mirroring Android's location client
  const { location, error: locationError } = useFusedLocation();

  useEffect(() => {
    if (location) {
      setUserCoords({ lat: location.lat, lng: location.lng, accuracy: location.accuracy });
    }
  }, [location]);

  useEffect(() => {
    if (locationError) {
      setError(locationError);
    }
  }, [locationError]);

  // Listen to reports
  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('reportedAt', 'desc'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const reportsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as WasteReport[];
        setReports(reportsData);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'reports')
    );
    return () => unsubscribe();
  }, []);

  // Listen to leaderboard
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('ecoKarma', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const users = snapshot.docs.map(d => d.data() as UserProfile);
        setLeaderboard(users);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'users')
    );
    return () => unsubscribe();
  }, []);

  // Listen to current user profile
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          const profile = snapshot.data() as UserProfile;
          setUserProfile(profile);
          setShowOnboarding(false);
        } else {
          setShowOnboarding(true);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`)
    );
    return () => unsubscribe();
  }, [user]);

  const handleCompleteOnboarding = async (role: 'volunteer' | 'authority') => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const initialProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || 'Watcher',
        photoURL: user.photoURL || '',
        ecoKarma: 0,
        role: role
      };
      await setDoc(userRef, initialProfile);
      setShowOnboarding(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleNewReport = async (data: { wasteType: WasteType; description: string; imageUrl: string; lat: number; lng: number }) => {
    if (!user) {
      signInWithGoogle();
      return;
    }

    try {
      const reportData = {
        ...data,
        status: 'Pending',
        reportedBy: user.uid,
        reportedByName: user.displayName || 'Watcher',
        reportedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'reports'), reportData);
      
      // Reward points
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ecoKarma: increment(50)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reports');
    }
  };

  const handleMarkAsCleaned = async (report: WasteReport, customCoords?: { lat: number; lng: number }) => {
    if (!user || userProfile?.role !== 'authority') return;

    try {
      const reportRef = doc(db, 'reports', report.id);
      const updateData: any = {
        status: 'Cleaned',
        cleanedBy: user.uid,
        cleanedAt: serverTimestamp()
      };

      if (customCoords) {
        updateData.cleanedLat = customCoords.lat;
        updateData.cleanedLng = customCoords.lng;
      } else if (userCoords) {
        updateData.cleanedLat = userCoords.lat;
        updateData.cleanedLng = userCoords.lng;
      }

      await updateDoc(reportRef, updateData);

      // Reward authority
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ecoKarma: increment(100)
      });
      
      setSelectedReport({ ...report, status: 'Cleaned', ...updateData });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reports/${report.id}`);
    }
  };

  const handleUpdateReport = async (reportId: string, data: Partial<WasteReport>) => {
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, data);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`);
    }
  };

  const handleReportClick = (report: WasteReport) => {
    setSelectedReport(report);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-stone-50 gap-4">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
        <p className="text-stone-500 font-serif font-bold italic">Loading Environment Sentinel...</p>
      </div>
    );
  }

  if (showOnboarding && user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-stone-50 p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-8 rounded-[2.5rem] shadow-2xl border border-stone-100 text-center"
        >
          <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-orange-100">
             <MapPin className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-serif font-black text-stone-900 mb-2">Welcome, Sentinel.</h2>
          <p className="text-stone-500 font-medium text-sm mb-10">Choose your path in the ecosystem management interface.</p>
          
          <div className="space-y-4">
            <button
              onClick={() => handleCompleteOnboarding('volunteer')}
              className="w-full group relative p-6 rounded-2xl border-2 border-stone-100 hover:border-orange-600 transition-all text-left bg-stone-50/50 hover:bg-orange-50"
            >
               <h3 className="text-base font-bold text-stone-900 group-hover:text-orange-700 transition-colors">Citizen Volunteer</h3>
               <p className="text-xs text-stone-400 group-hover:text-stone-500">Report waste and earn Eco-Karma points.</p>
               <Plus className="absolute top-1/2 -translate-y-1/2 right-6 w-5 h-5 text-stone-200 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => handleCompleteOnboarding('authority')}
              className="w-full group relative p-6 rounded-2xl border-2 border-stone-100 hover:border-stone-900 transition-all text-left bg-stone-50/50 hover:bg-stone-100"
            >
               <h3 className="text-base font-bold text-stone-900">Cleaning Authority</h3>
               <p className="text-xs text-stone-400">Verify cleanups and manage city sanitation.</p>
               <AlertCircle className="absolute top-1/2 -translate-y-1/2 right-6 w-5 h-5 text-stone-200 group-hover:text-stone-600 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          <p className="mt-8 text-[10px] font-bold text-stone-300 uppercase tracking-widest text-center">
            Role selection is permanent for this account
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden text-stone-900">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <main className="flex-1 flex overflow-hidden relative">
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          userProfile={userProfile} 
          reports={reports}
          leaderboard={leaderboard}
          activeView={activeView}
          onViewChange={(view) => {
            if (view === 'tasks' && userProfile?.role !== 'authority') return;
            setActiveView(view);
            setIsSidebarOpen(false);
          }}
          onNewReport={() => {
            setIsReportModalOpen(true);
            setIsSidebarOpen(false);
          }}
        />
        
        <section className="flex-1 relative overflow-hidden h-full">
          {activeView === 'map' ? (
            <MapView 
              userProfile={userProfile}
              reports={reports} 
              selectedReport={selectedReport}
              onReportClick={setSelectedReport}
              onMarkAsCleaned={handleMarkAsCleaned}
              userCoords={userCoords}
            />
          ) : activeView === 'tasks' && userProfile?.role === 'authority' ? (
            <RestorationTasks 
              reports={reports}
              userProfile={userProfile}
              onMarkAsCleaned={handleMarkAsCleaned}
            />
          ) : (
            <AnalyticsDashboard 
              reports={reports}
              userProfile={userProfile}
              onUpdateReport={handleUpdateReport}
            />
          )}

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50 overflow-hidden"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-bold">{error}</span>
                <button onClick={() => setError(null)} className="p-1 hover:bg-white/20 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <ReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleNewReport}
        currentCoords={userCoords}
      />

      {/* Floating Action Button (Mobile only) */}
      <div className="lg:hidden fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="w-14 h-14 bg-orange-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
