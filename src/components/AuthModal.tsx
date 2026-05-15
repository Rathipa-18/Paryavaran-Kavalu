import { useState } from 'react';
import { 
  signInWithGoogle, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, LogIn, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in with Google');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(email, password);
        if (displayName) {
          await updateProfile(userCredential.user, { displayName });
        }
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || `Failed to ${mode}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-100"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-serif font-black text-stone-900 mb-2">
              {mode === 'login' ? 'Welcome Back' : 'Join the Sentinel'}
            </h2>
            <p className="text-stone-500 font-medium text-sm">
              {mode === 'login' 
                ? 'Sign in to access your ecosystem profile.' 
                : 'Create an account to start reporting blackspots.'}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-xs font-bold leading-tight">{error}</p>
            </motion.div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-stone-100 hover:border-orange-600 hover:bg-orange-50 transition-all font-bold text-stone-700"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black text-stone-300">
                <span className="bg-white px-4">Or use email</span>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'register' && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-600 focus:bg-white transition-all"
                    required={mode === 'register'}
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-600 focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-600 focus:bg-white transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-stone-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-800 disabled:opacity-50 transition-all shadow-lg"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="w-full text-center py-2 text-xs font-bold text-stone-400 hover:text-orange-600 transition-colors"
            >
              {mode === 'login' 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
