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
    const { nome, turma, codigo, limite_diario, limite_mensal, permite_fiado, saldo_baixo_limite, ativo } = req.body;

    if (!nome || !turma) {
      return res.status(400).json({ message: 'Nome e Turma são campos obrigatórios.' });
    }

    const { data, error } = await supabase.from('alunos').insert([{
      nome, turma, codigo,
      saldo_atual: 0, // Novo aluno começa com saldo 0
      limite_diario: limite_diario || 0,
      limite_mensal: limite_mensal || 0,
      permite_fiado: permite_fiado ?? true,
      saldo_baixo_limite: saldo_baixo_limite || 10,
      ativo: ativo ?? true,
    }]).select().single(); // Select the inserted row

    if (error) {
      // Handle unique constraint error for 'codigo'
      if (error.code === '23505' && error.constraint === 'alunos_codigo_key') {
        return res.status(409).json({ message: 'Já existe um aluno com este código (RA).' });
      }
      return res.status(500).json({ message: 'Erro ao criar aluno.', error: error.message });
    }
    return res.status(201).json(data);
  }

  // PUT: Update an existing student
  if (req.method === 'PUT') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ message: 'ID do aluno é obrigatório para atualização.' });
    }

    const { saldo_atual, ...updateData } = req.body; // Prevent direct update of saldo_atual

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Nenhum dado para atualizar.' });
    }

    const { data, error } = await supabase.from('alunos').update(updateData).eq('id', id).select().single();

    if (error) {
      // Handle unique constraint error for 'codigo'
      if (error.code === '23505' && error.constraint === 'alunos_codigo_key') {
        return res.status(409).json({ message: 'Já existe outro aluno com este código (RA).' });
      }
      return res.status(500).json({ message: 'Erro ao atualizar aluno.', error: error.message });
    }
    if (!data) {
      return res.status(404).json({ message: 'Aluno não encontrado para atualização.' });
    }
    return res.status(200).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
