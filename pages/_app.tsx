import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Define an explicit interface for AuthWrapperProps to ensure correct type inference for `children` prop.
interface AuthWrapperProps {
  children: React.ReactNode;
}

function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth state to be determined

    if (!user && router.pathname !== '/') {
      router.push('/');
    } else if (user && router.pathname === '/') {
      router.push('/pdv');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  // If on login page and not authenticated, render login form without layout
  if (!user && router.pathname === '/') {
    return <>{children}</>;
  }

  // For authenticated routes, render with layout
  if (user) {
    return <Layout>{children}</Layout>;
  }

  // Fallback for cases where user is null but not on '/' (should redirect above)
  return null;
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AuthWrapper>
        <Component {...pageProps} />
      </AuthWrapper>
    </AuthProvider>
  );
}

export default MyApp;