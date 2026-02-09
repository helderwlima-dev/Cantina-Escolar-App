import React, { useState, useEffect, useCallback } from 'react';
import { Aluno, FormaPagamento, AlertType } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface StudentFormProps {
  student?: Aluno | null;
  onSave: (studentData: Partial<Aluno>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}

const StudentForm: React.FC<StudentFormProps> = ({ student, onSave, onCancel, isLoading, error }) => {
  const [formData, setFormData] = useState<Partial<Aluno>>({
    nome: '',
    turma: '',
    codigo: '',
    limite_diario: 0,
    limite_mensal: 0,
    permite_fiado: true,
    saldo_baixo_limite: 10,
    ativo: true,
  });

  useEffect(() => {
    if (student) {
      setFormData({
        id: student.id,
        nome: student.nome,
        turma: student.turma,
        codigo: student.codigo || '',
        saldo_atual: student.saldo_atual,
        limite_diario: student.limite_diario,
        limite_mensal: student.limite_mensal,
        permite_fiado: student.permite_fiado,
        saldo_baixo_limite: student.saldo_baixo_limite,
        ativo: student.ativo,
      });
    } else {
      setFormData({
        nome: '',
        turma: '',
        codigo: '',
        limite_diario: 0,
        limite_mensal: 0,
        permite_fiado: true,
        saldo_baixo_limite: 10,
        ativo: true,
      });
    }
  }, [student]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-semibold mb-4">{student ? 'Editar Aluno' : 'Novo Aluno'}</h3>
      {error && <Alert type="error" message={error} className="mb-4" />}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input id="nome" label="Nome" name="nome" value={formData.nome || ''} onChange={handleChange} required />
        <Input id="turma" label="Turma" name="turma" value={formData.turma || ''} onChange={handleChange} required />
        <Input id="codigo" label="Código (RA)" name="codigo" value={formData.codigo || ''} onChange={handleChange} />
        <Input
          id="limite_diario"
          label="Limite Diário"
          name="limite_diario"
          type="number"
          step="0.01"
          value={formData.limite_diario || 0}
          onChange={handleChange}
        />
        <Input
          id="limite_mensal"
          label="Limite Mensal"
          name="limite_mensal"
          type="number"
          step="0.01"
          value={formData.limite_mensal || 0}
          onChange={handleChange}
        />
        <Input
          id="saldo_baixo_limite"
          label="Limite Saldo Baixo"
          name="saldo_baixo_limite"
          type="number"
          step="0.01"
          value={formData.saldo_baixo_limite || 0}
          onChange={handleChange}
        />
        <div className="flex items-center gap-2">
          <input
            id="permite_fiado"
            type="checkbox"
            name="permite_fiado"
            checked={formData.permite_fiado || false}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="permite_fiado" className="text-sm font-medium text-gray-700">
            Permite Fiado
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="ativo"
            type="checkbox"
            name="ativo"
            checked={formData.ativo || false}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
            Ativo
          </label>
        </div>
        <div className="md:col-span-2 flex justify-end space-x-2 mt-4">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading} variant="primary">
            Salvar
          </Button>
        </div>
      </form>
    </div>
  );
};

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  aluno: Aluno;
  onRechargeSuccess: (newSaldo: number) => void;
}

const RechargeModal: React.FC<RechargeModalProps> = ({ isOpen, onClose, aluno, onRechargeSuccess }) => {
  const { user } = useAuth();
  const [valor, setValor] = useState<number | ''>('');
  const [forma, setForma] = useState<FormaPagamento>('pix');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValor('');
      setForma('pix');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (valor === '' || valor <= 0) {
      setError('Por favor, insira um valor válido para a recarga.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/recargas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_aluno: aluno.id,
          valor: valor,
          forma: forma,
          usuario_criou: user?.email || user?.id || 'unknown',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao realizar recarga.');
      }

      setSuccess(`Recarga de ${formatCurrency(valor)} realizada com sucesso! Novo saldo: ${formatCurrency(data.novo_saldo_aluno)}`);
      onRechargeSuccess(data.novo_saldo_aluno);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado na recarga.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Recarregar Saldo para {aluno.nome}</h2>
          <Button variant="secondary" onClick={onClose} size="sm">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </Button>
        </div>
        <form onSubmit={handleRecharge} className="p-4 space-y-4">
          {error && <Alert type="error" message={error} className="mb-4" onClose={() => setError(null)} />}
          {success && <Alert type="success" message={success} className="mb-4" onClose={() => setSuccess(null)} />}
          <Input
            id="recharge-valor"
            label="Valor da Recarga"
            type="number"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(parseFloat(e.target.value))}
            required
            min="0.01"
          />
          <div>
            <label htmlFor="recharge-forma" className="block text-sm font-medium text-gray-700 mb-1">
              Forma de Pagamento
            </label>
            <select
              id="recharge-forma"
              name="forma"
              value={forma}
              onChange={(e) => setForma(e.target.value as FormaPagamento)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="pix">Pix</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao">Cartão</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
              Fechar
            </Button>
            <Button type="submit" isLoading={isLoading} variant="primary">
              Confirmar Recarga
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AlunosPage: React.FC = () => {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [rechargeAluno, setRechargeAluno] = useState<Aluno | null>(null);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: AlertType } | null>(null);


  const fetchAlunos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/alunos?search=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) {
        throw new Error('Falha ao buscar alunos');
      }
      const data: Aluno[] = await res.json();
      setAlunos(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar alunos.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchAlunos();
  }, [fetchAlunos]);

  const handleNewAluno = () => {
    setEditingAluno(null);
    setIsFormOpen(true);
  };

  const handleEditAluno = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingAluno(null);
    setFormError(null);
  };

  const handleSaveAluno = async (studentData: Partial<Aluno>) => {
    setFormLoading(true);
    setFormError(null);
    try {
      const method = studentData.id ? 'PUT' : 'POST';
      const endpoint = studentData.id ? `/api/alunos?id=${studentData.id}` : '/api/alunos';

      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao salvar aluno.');
      }

      setAlert({ message: `Aluno ${studentData.id ? 'atualizado' : 'criado'} com sucesso!`, type: 'success' });
      setIsFormOpen(false);
      fetchAlunos(); // Refresh the list
    } catch (err: any) {
      setFormError(err.message || 'Erro inesperado ao salvar aluno.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenRecharge = (aluno: Aluno) => {
    setRechargeAluno(aluno);
    setIsRechargeModalOpen(true);
  };

  const handleRechargeSuccess = (newSaldo: number) => {
    if (rechargeAluno) {
      setAlunos(prev => prev.map(a => a.id === rechargeAluno.id ? { ...a, saldo_atual: newSaldo } : a));
      setEditingAluno(prev => prev && prev.id === rechargeAluno.id ? { ...prev, saldo_atual: newSaldo } : prev);
      setRechargeAluno(prev => prev ? { ...prev, saldo_atual: newSaldo } : prev);
    }
    setIsRechargeModalOpen(false);
    setAlert({ message: 'Recarga concluída e saldo atualizado!', type: 'success' });
  };


  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-full">
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestão de Alunos</h1>

      <div className="flex justify-between items-center mb-6">
        <Input
          id="aluno-search"
          type="text"
          placeholder="Buscar por nome ou turma..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={handleNewAluno} variant="primary">
          Novo Aluno
        </Button>
      </div>

      {isFormOpen && (
        <StudentForm
          student={editingAluno}
          onSave={handleSaveAluno}
          onCancel={handleCancelForm}
          isLoading={formLoading}
          error={formError}
        />
      )}

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <Alert type="error" message={error} />
      ) : alunos.length === 0 ? (
        <p className="text-center text-gray-500">Nenhum aluno cadastrado.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Turma
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saldo Atual
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alunos.map((aluno) => (
                <tr key={aluno.id} className={!aluno.ativo ? 'bg-gray-50 text-gray-400 italic' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {aluno.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {aluno.turma}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={aluno.saldo_atual < aluno.saldo_baixo_limite ? 'text-red-500 font-semibold' : 'text-green-600'}>
                      {formatCurrency(aluno.saldo_atual)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${aluno.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {aluno.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button onClick={() => handleEditAluno(aluno)} variant="secondary" size="sm" className="mr-2">
                      Editar
                    </Button>
                    <Button onClick={() => handleOpenRecharge(aluno)} variant="primary" size="sm">
                      Recarregar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rechargeAluno && (
        <RechargeModal
          isOpen={isRechargeModalOpen}
          onClose={() => setIsRechargeModalOpen(false)}
          aluno={rechargeAluno}
          onRechargeSuccess={handleRechargeSuccess}
        />
      )}
    </div>
  );
};

export default AlunosPage;
