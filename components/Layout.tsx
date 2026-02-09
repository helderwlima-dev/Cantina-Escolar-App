import React from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { Button } from './Button';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { signOut, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Cantina Escolar</h1>
          <nav className="flex items-center space-x-2 md:space-x-4">
            <Link href="/pdv" className={`text-gray-600 hover:text-indigo-600 ${router.pathname === '/pdv' ? 'font-semibold text-indigo-600' : ''}`}>
              PDV
            </Link>
            <Link href="/alunos" className={`text-gray-600 hover:text-indigo-600 ${router.pathname === '/alunos' ? 'font-semibold text-indigo-600' : ''}`}>
              Alunos
            </Link>
            <Link href="/relatorios" className={`text-gray-600 hover:text-indigo-600 ${router.pathname === '/relatorios' ? 'font-semibold text-indigo-600' : ''}`}>
              Relatórios
            </Link>
            {user && (
              <Button variant="secondary" size="sm" onClick={handleLogout} className="ml-4">
                Sair
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-grow p-4 md:p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};
