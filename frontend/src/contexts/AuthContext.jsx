import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithCustomToken,
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebaseClient';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() });
      } else {
        // Self-provisioning profile fallback to prevent user lockout!
        const defaultProfile = {
          name: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Citizen',
          phone: auth.currentUser?.phoneNumber || '9999999999',
          area: 'Other',
          role: 'citizen',
          created_at: new Date().toISOString(),
        };
        await setDoc(docRef, defaultProfile);
        setProfile({ id: userId, ...defaultProfile });
        console.log('Successfully self-provisioned profile for missing Firestore user record');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        toast.error(
          '🔥 Firestore Access Denied! Please go to your Firebase Console -> Firestore Database -> Rules, set them to allow read/write, and save.',
          { duration: 10000 }
        );
      } else {
        toast.error(`Database Error: ${error.message || 'Failed to fetch user profile'}`);
      }
      setProfile(null);
    }
  };

  useEffect(() => {
    // Enforce an extended minimum display time for the cinematic splash screen animation (4.5 seconds)
    const minLoadTime = new Promise(resolve => setTimeout(resolve, 4500));

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid);
      } else {
        setProfile(null);
      }
      
      // Wait for the cinematic splash screen to finish
      await minLoadTime;
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    try {
      // First attempt standard email/password login
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      // If it fails, fallback to check if we can authenticate via the admin code override endpoint
      try {
        const { data } = await api.post('/auth/admin-login', { email, password });
        if (data.customToken) {
          return await signInWithCustomToken(auth, data.customToken);
        }
      } catch (adminError) {
        // If the admin code override also fails, throw the original email/password login error
      }
      throw error;
    }
  };

  const signOut = () => {
    return firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
