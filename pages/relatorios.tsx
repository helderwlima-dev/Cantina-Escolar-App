import React, { useState, useEffect, useCallback } from 'react';
import { Aluno, Venda, Recarga } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { formatCurrency, convertToCSV } from '../lib/utils';
import { StudentSearch } from '../components/StudentSearch';

type ReportTab = 'vendas' | 'recargas' | 'saldos';

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('vendas');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vendas, setVendas] = useState<Venda[]>([]);
  const [recargas, setRecargas] = useState<Recarga[]>([]);
  const [saldos, setSaldos] = useState<Aluno[]>([]);

  // Set default dates for the current month
  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDayOfMonth.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (selectedAluno) queryParams.append('id_aluno', selectedAluno.id);

    try {
      let endpoint = `/api/relatorios/${activeTab}`;
      const res = await fetch(`${endpoint}?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error(`Falha ao carregar ${activeTab}`);
      }
      const data = await res.json();

      switch (activeTab) {
        case 'vendas':
          setVendas(data);
          break;
        case 'recargas':
          setRecargas(data);
          break;
        case 'saldos':
          setSaldos(data);
          break;
      }
    } catch (err: any) {
      setError(err.message || `Erro ao carregar dados de ${activeTab}.`);
    } finally {
      setLoading(false);
    }
  }, [activeTab, startDate, endDate, selectedAluno]);

  useEffect(() => {
    fetchData();
  }, [fetchData, activeTab]); // Re-fetch when tab or filters change

  const handleExportCSV = async () => {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (selectedAluno) queryParams.append('id_aluno', selectedAluno.id);
    queryParams.append('format', 'csv');

    try {
      const res = await fetch(`/api/relatorios/${activeTab}?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error(`Falha ao exportar ${activeTab}`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || `Erro ao exportar CSV de ${activeTab}.`);
    } finally {
      setLoading(false);
    }
  };

  const commonTableClasses = "min-w-full divide-y divide-gray-200";
  const commonHeaderClasses = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
  const commonCellClasses = "px-6 py-4 whitespace-nowrap text-sm text-gray-900";

  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-48">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (error) {
      return <Alert type="error" message={error} />;
    }

    switch (activeTab) {
      case 'vendas':
        if (vendas.length === 0) return <p className="text-center text-gray-500">Nenhuma venda encontrada.</p>;
        return (
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className={commonTableClasses}>
              <thead className="bg-gray-50">
                <tr>
                  <th className={commonHeaderClasses}>Data/Hora</th>
                  <th className={commonHeaderClasses}>Aluno</th>
                  <th className={commonHeaderClasses}>Valor Total</th>
                  <th className={commonHeaderClasses}>Tipo</th>
                  <th className={commonHeaderClasses}>Status</th>
                  <th className={commonHeaderClasses}>Criador</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendas.map((venda) => (
                  <tr key={venda.id} className={venda.status === 'cancelada' ? 'bg-red-50 text-gray-400 italic' : ''}>
                    <td className={commonCellClasses}>{new Date(venda.data_hora).toLocaleString()}</td>
                    <td className={commonCellClasses}>{venda.id_aluno}</td> {/* Placeholder, ideally join with aluno.nome */}
                    <td className={commonCellClasses}>{formatCurrency(venda.valor_total)}</td>
                    <td className={commonCellClasses}>{venda.tipo === 'credito' ? 'Crédito' : 'Fiado'}</td>
                    <td className={commonCellClasses}>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${venda.status === 'normal' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {venda.status === 'normal' ? 'Normal' : 'Cancelada'}
                      </span>
                    </td>
                    <td className={commonCellClasses}>{venda.usuario_criou}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'recargas':
        if (recargas.length === 0) return <p className="text-center text-gray-500">Nenhuma recarga encontrada.</p>;
        return (
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className={commonTableClasses}>
              <thead className="bg-gray-50">
                <tr>
                  <th className={commonHeaderClasses}>Data/Hora</th>
                  <th className={commonHeaderClasses}>Aluno</th>
                  <th className={commonHeaderClasses}>Valor</th>
                  <th className={commonHeaderClasses}>Forma</th>
                  <th className={commonHeaderClasses}>Criador</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recargas.map((recarga) => (
                  <tr key={recarga.id}>
                    <td className={commonCellClasses}>{new Date(recarga.data_hora).toLocaleString()}</td>
                    <td className={commonCellClasses}>{recarga.id_aluno}</td> {/* Placeholder, ideally join with aluno.nome */}
                    <td className={commonCellClasses}>{formatCurrency(recarga.valor)}</td>
                    <td className={commonCellClasses}>{recarga.forma}</td>
                    <td className={commonCellClasses}>{recarga.usuario_criou}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'saldos':
        if (saldos.length === 0) return <p className="text-center text-gray-500">Nenhum saldo encontrado.</p>;
        return (
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className={commonTableClasses}>
              <thead className="bg-gray-50">
                <tr>
                  <th className={commonHeaderClasses}>Nome Aluno</th>
                  <th className={commonHeaderClasses}>Turma</th>
                  <th className={commonHeaderClasses}>Saldo Atual</th>
                  <th className={commonHeaderClasses}>Limite Diário</th>
                  <th className={commonHeaderClasses}>Limite Mensal</th>
                  <th className={commonHeaderClasses}>Fiado Permitido</th>
                  <th className={commonHeaderClasses}>Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {saldos.map((aluno) => (
                  <tr key={aluno.id} className={!aluno.ativo ? 'bg-gray-50 text-gray-400 italic' : ''}>
                    <td className={commonCellClasses}>{aluno.nome}</td>
                    <td className={commonCellClasses}>{aluno.turma}</td>
                    <td className={commonCellClasses}>
                      <span className={aluno.saldo_atual < aluno.saldo_baixo_limite ? 'text-red-500 font-semibold' : 'text-green-600'}>
                        {formatCurrency(aluno.saldo_atual)}
                      </span>
                    </td>
                    <td className={commonCellClasses}>
                      {aluno.limite_diario > 0 ? formatCurrency(aluno.limite_diario) : 'Sem limite'}
                    </td>
                    <td className={commonCellClasses}>
                      {aluno.limite_mensal > 0 ? formatCurrency(aluno.limite_mensal) : 'Sem limite'}
                    </td>
                    <td className={commonCellClasses}>{aluno.permite_fiado ? 'Sim' : 'Não'}</td>
                    <td className={commonCellClasses}>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${aluno.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {aluno.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Relatórios</h1>

      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input
            id="start-date"
            label="Data Início"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            id="end-date"
            label="Data Fim"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aluno (Opcional)</label>
            <StudentSearch onSelectAluno={setSelectedAluno} />
            {selectedAluno && (
              <p className="text-sm text-gray-500 mt-1">Selecionado: {selectedAluno.nome} ({selectedAluno.turma})</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={() => { setSelectedAluno(null); setStartDate(''); setEndDate(''); }} variant="secondary">
            Limpar Filtros
          </Button>
          <Button onClick={fetchData} variant="primary" isLoading={loading}>
            Aplicar Filtros
          </Button>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 text-sm font-medium ${activeTab === 'vendas' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('vendas')}
        >
          Vendas
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium ${activeTab === 'recargas' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('recargas')}
        >
          Recargas
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium ${activeTab === 'saldos' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('saldos')}
        >
          Saldos
        </button>
      </div>

      <div className="mb-4 flex justify-end">
        <Button onClick={handleExportCSV} variant="secondary" isLoading={loading} disabled={loading}>
          Exportar CSV
        </Button>
      </div>

      {renderTable()}
    </div>
  );
};

export default ReportsPage;
