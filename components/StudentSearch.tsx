import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Aluno } from '../types';
import { Input } from './Input';
import { LoadingSpinner } from './LoadingSpinner';

interface StudentSearchProps {
  onSelectAluno: (aluno: Aluno) => void;
}

export const StudentSearch: React.FC<StudentSearchProps> = ({ onSelectAluno }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/alunos?search=${encodeURIComponent(query)}`);
      if (!res.ok) {
        throw new Error('Falha ao buscar alunos');
      }
      const data: Aluno[] = await res.json();
      setSuggestions(data.slice(0, 5)); // Limit to 5 suggestions
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar sugestões.');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce effect for search term
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSuggestions(searchTerm);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, fetchSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (aluno: Aluno) => {
    onSelectAluno(aluno);
    setSearchTerm(aluno.nome); // Set input to selected student's name
    setSuggestions([]); // Clear suggestions
  };

  return (
    <div className="relative" ref={searchRef}>
      <Input
        id="student-search-input"
        type="text"
        placeholder="Buscar aluno por nome ou turma..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {loading && (
        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 p-2 flex justify-center items-center z-10">
          <LoadingSpinner />
        </div>
      )}
      {error && !loading && searchTerm.length >= 2 && (
        <div className="absolute top-full left-0 w-full bg-red-100 text-red-700 border border-red-400 rounded-md shadow-lg mt-1 p-2 z-10">
          {error}
        </div>
      )}
      {suggestions.length > 0 && !loading && (
        <ul className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 z-10">
          {suggestions.map((aluno) => (
            <li
              key={aluno.id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
              onClick={() => handleSelect(aluno)}
            >
              <span className="font-medium text-gray-800">{aluno.nome}</span>
              <span className="text-gray-500 text-sm">Turma: {aluno.turma}</span>
            </li>
          ))}
        </ul>
      )}
      {!loading && suggestions.length === 0 && searchTerm.length >= 2 && !error && (
        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 p-2 text-center text-gray-500 z-10">
          Nenhum aluno encontrado.
        </div>
      )}
    </div>
  );
};
