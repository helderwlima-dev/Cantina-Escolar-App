import React, { useState, useEffect } from 'react';
import { Produto } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import { LoadingSpinner } from './LoadingSpinner';
import { formatCurrency } from '../lib/utils';
import { Alert } from './Alert';

interface ProductSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Produto) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({ isOpen, onClose, onSelectProduct }) => {
  const [products, setProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/produtos');
      if (!res.ok) {
        throw new Error('Falha ao buscar produtos');
      }
      const data: Produto[] = await res.json();
      setProducts(data.filter(p => p.ativo));
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar produtos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    } else {
      setSearchTerm(''); // Clear search when modal closes
    }
  }, [isOpen]);

  const filteredProducts = products.filter(product =>
    product.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Selecionar Produto</h2>
          <Button variant="secondary" onClick={onClose} size="sm">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </Button>
        </div>
        <div className="p-4">
          <Input
            id="product-search"
            type="text"
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
        </div>
        <div className="flex-grow overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <Alert type="error" message={error} />
          ) : filteredProducts.length === 0 ? (
            <p className="text-center text-gray-500">Nenhum produto encontrado.</p>
          ) : (
            <ul className="space-y-2">
              {filteredProducts.map((product) => (
                <li
                  key={product.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md shadow-sm cursor-pointer hover:bg-indigo-50 transition-colors"
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                >
                  <span className="font-medium text-gray-800">{product.nome}</span>
                  <span className="text-indigo-600 font-semibold">{formatCurrency(product.preco)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <Button variant="secondary" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  );
};
