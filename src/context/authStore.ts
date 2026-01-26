import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  signIn: async (email: string, password: string) => {
    try {
      set({ error: null, loading: true });
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Obtener el rol del usuario desde Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();
      
      set({
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email!,
          role: (userData?.role as UserRole) || 'viewer',
        },
        loading: false,
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al iniciar sesión', 
        loading: false 
      });
      throw error;
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      set({ user: null, error: null });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  initAuth: () => {
    onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();
        
        set({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            role: (userData?.role as UserRole) || 'viewer',
          },
          loading: false,
        });
      } else {
        set({ user: null, loading: false });
      }
    });
  },
}));
