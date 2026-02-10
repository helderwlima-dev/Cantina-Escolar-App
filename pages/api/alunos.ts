import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceRoleSupabaseClient } from '../../lib/supabaseClient';
import { Aluno } from '../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServiceRoleSupabaseClient();

  // GET: List all students, search by name/class, or get by ID
  if (req.method === 'GET') {
    const { search, id } = req.query;

    if (id) {
      const { data, error } = await supabase.from('alunos').select('*').eq('id', id).single();
      if (error) {
        return res.status(500).json({ message: 'Erro ao buscar aluno.', error: error.message });
      }
      if (!data) {
        return res.status(404).json({ message: 'Aluno não encontrado.' });
      }
      return res.status(200).json(data);
    }

    let query = supabase.from('alunos').select('*').order('nome', { ascending: true });

    if (search) {
      // Search by name or class (case-insensitive)
      query = query.or(`nome.ilike.%${search}%,turma.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ message: 'Erro ao buscar alunos.', error: error.message });
    }
    return res.status(200).json(data);
  }

  // POST: Create a new student
  if (req.method === 'POST') {
    const { nome
