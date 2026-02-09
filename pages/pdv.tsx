import React, { useState, useEffect, useCallback } from 'react';
import { Aluno, Produto, ItemCarrinho, VendaTipo, AlertType, UserSession } from '../types';
import { StudentSearch } from '../components/StudentSearch';
import { Button } from '../components/Button';
import { formatCurrency } from '../lib/utils';
import { ProductSelector } from '../components/ProductSelector';
import { Alert } from '../components/Alert';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const fixedProducts: Produto[] = [
  { id: 'prod_salgado_pequeno', nome: 'Salgado Pequeno', preco: 6.00, ativo: true, created_at: '', updated_at: '' },
  { id: 'prod_salgado_grande', nome: 'Salgado Grande', preco: 10.00, ativo: true, created_at: '', updated_at: '' },
  { id: 'prod_bolo_pote', nome: 'Bolo no Pote', preco: 12.00, ativo: true, created_at: '', updated_at: '' },
  { id: 'prod_suco', nome: 'Suco', preco: 3.00, ativo: true, created_at: '', updated_at: '' },
];

const PDVPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [cartItems, setCartItems] = useState<ItemCarrinho[]>([]);
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  const [loadingSale, setLoadingSale] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: AlertType } | null>(null);
  const [loadingAlunoData, setLoadingAlunoData] = useState(false);

  const totalCartValue = cartItems.reduce((sum, item) => sum + item.preco * item.quantidade, 0);

  const handleSelectAluno = (aluno: Aluno) => {
    setSelectedAluno(aluno);
  };

  const refreshAlunoData = useCallback(async () => {
    if (!selectedAluno) return;
    setLoadingAlunoData(true);
    try {
      const res = await fetch(`/api/alunos?id=${selectedAluno.id}`);
      if (!res.ok) {
        throw new Error('Falha ao recarregar dados do aluno');
      }
      const data: Aluno = await res.json();
      setSelectedAluno(data);
      setAlert({ message: 'Dados do aluno atualizados!', type: 'success' });
    } catch (err: any) {
      setAlert({ message: err.message || 'Erro ao atualizar dados do aluno.', type: 'error' });
    } finally {
      setLoadingAlunoData(false);
    }
  }, [selectedAluno]);

  useEffect(() => {
    if (selectedAluno) {
      refreshAlunoData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAluno?.id]); // Only refresh when selectedAluno.id changes

  const handleAddProduct = (product: Produto) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantidade: 1 }];
    });
  };

  const updateItemQuantity = (productId: string, delta: number) => {
    setCartItems((prevItems) => {
      const updatedItems = prevItems
        .map((item) =>
          item.id === productId ? { ...item, quantidade: Math.max(0, item.quantidade + delta) } : item
        )
        .filter((item) => item.quantidade > 0);
      return updatedItems;
    });
  };

  const removeItem = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const handleLaunchSale = async () => {
    if (!selectedAluno || cartItems.length === 0) {
      setAlert({ message: 'Selecione um aluno e adicione itens ao carrinho para lançar a venda.', type: 'warning' });
      return;
    }

    setLoadingSale(true);
    setAlert(null);

    try {
      const saleItems = cartItems.map((item) => ({
        id_produto: item.id,
        quantidade: item.quantidade,
        valor_unitario: item.preco,
      }));

      const response = await fetch('/api/vendas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_aluno: selectedAluno.id,
          itens: saleItems,
          usuario_criou: user?.email || user?.id || 'unknown',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao lançar venda.');
      }

      // Success
      setCartItems([]);
      setSelectedAluno((prev) => prev ? { ...prev, saldo_atual: data.novo_saldo_aluno } : null);
      let successMessage = `Venda de ${formatCurrency(data.valor_total)} lançada como ${data.tipo === 'credito' ? 'Crédito' : 'Fiado'}!`;
      if (data.saldo_baixo) {
        successMessage += ' Saldo baixo!';
      }
      setAlert({ message: successMessage, type: 'success' });
    } catch (err: any) {
      setAlert({ message: err.message || 'Erro inesperado ao lançar venda.', type: 'error' });
    } finally {
      setLoadingSale(false);
    }
  };

  const isSaldoBaixo = selectedAluno && selectedAluno.saldo_atual < selectedAluno.saldo_baixo_limite;

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full pb-20"> {/* pb-20 to make space for fixed button */}
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}

      {/* Student Selection and Info */}
      <div className="w-full md:w-1/3 bg-white p-4 rounded-lg shadow-md flex flex-col">
        <h2 className="text-xl font-semibold mb-4">Aluno</h2>
        <StudentSearch onSelectAluno={handleSelectAluno} />

        {selectedAluno ? (
          <div className="mt-4 p-4 border border-gray-200 rounded-md flex-grow relative">
            {loadingAlunoData && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-md z-10">
                <LoadingSpinner />
              </div>
            )}
            <p className="text-lg font-bold text-gray-800">{selectedAluno.nome}</p>
            <p className="text-gray-600">Turma: {selectedAluno.turma}</p>
            {selectedAluno.codigo && <p className="text-gray-600">RA: {selectedAluno.codigo}</p>}
            <p className="mt-2 text-md font-medium">
              Saldo Atual: {' '}
              <span className={isSaldoBaixo ? 'text-red-500' : 'text-green-600'}>
                {formatCurrency(selectedAluno.saldo_atual)}
              </span>
            </p>
            {isSaldoBaixo && (
              <p className="text-red-500 text-sm mt-1 animate-pulse">Saldo baixo!</p>
            )}
            <p className="text-gray-600 text-sm">
              Limite Diário: {selectedAluno.limite_diario > 0 ? formatCurrency(selectedAluno.limite_diario) : 'Sem limite'}
            </p>
            <p className="text-gray-600 text-sm">
              Limite Mensal: {selectedAluno.limite_mensal > 0 ? formatCurrency(selectedAluno.limite_mensal) : 'Sem limite'}
            </p>
            <Button
              onClick={refreshAlunoData}
              variant="secondary"
              size="sm"
              className="mt-4 w-full"
              isLoading={loadingAlunoData}
            >
              Recarregar dados do aluno
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-gray-500 italic">Nenhum aluno selecionado.</p>
        )}
      </div>

      {/* Product Buttons and Cart */}
      <div className="w-full md:w-2/3 flex flex-col gap-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Produtos Rápidos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {fixedProducts.map((product) => (
              <Button
                key={product.id}
                onClick={() => handleAddProduct(product)}
                variant="secondary"
                className="flex flex-col h-24 p-2 justify-center items-center text-center"
              >
                <span className="text-base">{product.nome}</span>
                <span className="text-sm font-normal">{formatCurrency(product.preco)}</span>
              </Button>
            ))}
            <Button
              onClick={() => setIsProductSelectorOpen(true)}
              variant="primary"
              className="flex flex-col h-24 p-2 justify-center items-center text-center text-xl"
            >
              + Outro
            </Button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md flex-grow relative">
          <h2 className="text-xl font-semibold mb-4">Carrinho</h2>
          {cartItems.length === 0 ? (
            <p className="text-gray-500 italic">Carrinho vazio.</p>
          ) : (
            <ul className="space-y-3">
              {cartItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex-grow">
                    <p className="font-medium text-gray-800">{item.nome}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(item.preco)} x {item.quantidade}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateItemQuantity(item.id, -1)}
                      className="w-8 h-8 p-0"
                    >
                      -
                    </Button>
                    <span className="text-lg font-bold w-6 text-center">{item.quantidade}</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateItemQuantity(item.id, 1)}
                      className="w-8 h-8 p-0"
                    >
                      +
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="w-8 h-8 p-0 ml-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm1 3a1 1 0 100 2h4a1 1 0 100-2H8z" clipRule="evenodd"></path></svg>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-xl font-bold text-gray-800">Total:</span>
            <span className="text-2xl font-extrabold text-indigo-600">{formatCurrency(totalCartValue)}</span>
          </div>
        </div>
      </div>

      <ProductSelector
        isOpen={isProductSelectorOpen}
        onClose={() => setIsProductSelectorOpen(false)}
        onSelectProduct={handleAddProduct}
      />

      {/* Fixed "LANÇAR VENDA" button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg border-t border-gray-200 md:left-1/3 md:w-2/3 md:ml-auto z-20">
        <Button
          onClick={handleLaunchSale}
          className="w-full text-xl py-3"
          variant="success"
          isLoading={loadingSale}
          disabled={!selectedAluno || cartItems.length === 0}
        >
          {loadingSale ? 'Lançando Venda...' : 'LANÇAR VENDA'}
        </Button>
      </div>
    </div>
  );
};

export default PDVPage;
