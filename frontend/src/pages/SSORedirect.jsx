import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Zap } from 'lucide-react';

export default function SSORedirect() {
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Initializing LokSetu SSO handshake...');
  const [ssoDestination, setSsoDestination] = useState(null);

  useEffect(() => {
    const handleSSO = async () => {
      const returnUrl = searchParams.get('return_url') || `${window.location.origin}/sso`;

      if (!user) {
        setStatus('You are not logged in. Redirecting to LokSetu Login...');
        // Save the sso action in sessionStorage to redirect back after successful login
        sessionStorage.setItem('sso_return_url', returnUrl);
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1500);
        return;
      }

      setStatus('Securely preparing single sign-on parameters...');
      
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

      const destination = `${returnUrl}?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&timestamp=${encodeURIComponent(timestamp)}&hash=${hashHex}`;
      
      // Debug: expose the final destination when requested
      console.log('LokSetu SSO destination ->', destination);
      const debug = searchParams.get('debug_sso');
      if (debug) {
        setStatus(`Debug SSO URL prepared: ${destination}`);
        setSsoDestination(destination);
        // If in debug mode, show the URL and provide a manual proceed button
        return;
      }

      setStatus('Redirecting to Bill Analyzer...');
      setTimeout(() => {
        window.location.replace(destination);
      }, 1000);
    };

    handleSSO();
  }, [user, profile, searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#070B14] flex justify-center items-center px-4 font-sans text-white relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.12)_0%,rgba(15,23,42,0)_70%)]" />
      
      <div className="relative w-full max-w-md p-10 bg-slate-900/60 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl text-center">
        {/* Glowing aura */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative inline-flex p-4 mb-6 bg-primary-500/10 border border-primary-500/30 rounded-2xl animate-pulse">
          <Zap className="text-primary-400" size={32} />
        </div>

        <h2 className="text-3xl font-black mb-2 tracking-tight">LokSetu SSO Gateway</h2>
        <p className="text-slate-400 text-sm mb-6">Secure District Identity Provider</p>

        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary-500" size={32} />
          <p className="text-slate-300 text-sm font-semibold tracking-wide animate-pulse">
            {status}
          </p>
          {ssoDestination && (
            <div className="mt-4 w-full">
              <div className="text-xs text-white/60 break-words mb-2">{ssoDestination}</div>
              <button
                onClick={() => window.location.replace(ssoDestination)}
                className="btn-primary w-full py-2 rounded-lg"
              >
                Proceed to Bill Analyzer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
