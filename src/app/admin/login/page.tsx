'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import HeliosLogo from '@/components/layout/HeliosLogo';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-2xl text-white">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <HeliosLogo />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Administrator Portal</h2>
          <p className="mt-2 text-xs text-gray-300">
            Sign in with your Helios Towers admin credentials to manage handbook content.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs font-semibold text-red-200 text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="admin-email" className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
              Email Address
            </label>
            <input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@heliostowers.com"
              className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder-gray-400 focus:border-[#00A8E8] focus:outline-none focus:ring-1 focus:ring-[#00A8E8]"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder-gray-400 focus:border-[#00A8E8] focus:outline-none focus:ring-1 focus:ring-[#00A8E8]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#005B94] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#004B87] focus:outline-none focus:ring-2 focus:ring-[#00A8E8] disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="border-t border-white/10 pt-4 text-center">
          <p className="text-[11px] text-gray-400">
            Protected Administrator Area • Internal Use Only
          </p>
        </div>
      </div>
    </div>
  );
}
