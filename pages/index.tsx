import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Alert } from '../components/Alert';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const { user, error } = await signIn(email, password);

    if (error) {
      setErrorMessage(error);
    } else if (user) {
      router.push('/pdv');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">Cantina Escolar</h1>
        <h2 className="text-xl text-center text-gray-700 mb-8">Login</h2>
        {errorMessage && <Alert type="error" message={errorMessage} className="mb-4" onClose={() => setErrorMessage(null)} />}
        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            id="email"
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            id="password"
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Button type="submit" className="w-full" isLoading={loading} size="lg">
            Entrar
          </Button>
        </form>
        <p className="mt-6 text-center text-gray-500 text-sm">
          Use suas credenciais Supabase para fazer login.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
