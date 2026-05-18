import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function SSOSilent() {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    // If the auth system is still loading, wait
    if (loading) return;

    const performSilentSSO = async () => {
      const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.');
      const targetOrigin = isLocalHost
        ? `http://${window.location.hostname}:5174`
        : 'http://localhost:5174';

      if (!user) {
        // Send a postMessage notifying the parent that no active session was found
        window.parent.postMessage({ type: 'LOKSETU_SSO_NO_SESSION' }, targetOrigin);
        return;
      }

      try {
        const email = profile?.email || user?.email;
        const name = profile?.name || user?.displayName || 'Citizen';
        const phone = profile?.phone || user?.phoneNumber || '';
        const timestamp = new Date().toISOString();
        const secret = "loksetu-shared-secret-key-2026";

        // Cryptographic signature hash
        const msg = `${email}:${name}:${phone}:${timestamp}:${secret}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(msg);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Dispatch credentials securely to the verified parent origin
        window.parent.postMessage({
          type: 'LOKSETU_SSO_SESSION',
          email,
          name,
          phone,
          timestamp,
          hash: hashHex
        }, targetOrigin);
      } catch (err) {
        console.error('Silent SSO generation error:', err);
        window.parent.postMessage({ type: 'LOKSETU_SSO_ERROR', detail: err.message }, targetOrigin);
      }
    };

    performSilentSSO();
  }, [user, profile, loading]);

  // Completely silent component inside the background iframe
  return null;
}
