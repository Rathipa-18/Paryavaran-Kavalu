import { auth, signInWithGoogle } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { LogIn, LogOut, User as UserIcon, Leaf, Menu } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface HeaderProps {
  onMenuClick: () => void;
  onSignInClick: () => void;
}

export default function Header({ onMenuClick, onSignInClick }: HeaderProps) {
  const [user] = useAuthState(auth);

  return (
    <header className="h-16 bg-white border-b border-stone-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 shadow-sm font-sans">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-stone-500 hover:bg-stone-50 rounded-xl transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 flex-shrink-0">
          <Leaf className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-lg md:text-xl font-serif font-black text-stone-900 leading-none">Paryavaran-Kavalu</h1>
          <p className="text-[9px] md:text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-0.5 whitespace-nowrap">Environment Sentinel</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3 bg-stone-50 pl-1 pr-1 py-1 rounded-full border border-stone-200">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white shadow-sm">
              {user.photoURL ? (
                <img src={user.photoURL || undefined} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-stone-200 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-stone-500" />
                </div>
              )}
            </div>
            <span className="text-sm font-bold text-stone-700 pr-3 hidden md:inline">
              {user.displayName?.split(' ')[0]}
            </span>
            <button 
              onClick={() => auth.signOut()}
              className="p-2 text-stone-400 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onSignInClick}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-all shadow-md"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
