import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceRoleSupabaseClient } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServiceRoleSupabaseClient();

  // GET
  if (req.method === 'GET') {
    const { search, id } = req.query;

    if (typeof id === 'string') {
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return res.status(500).json({ message: 'Erro ao buscar aluno.', error: error.message });
      }
      if (!data) {
        return res.status(404).json({ message: 'Aluno não encontrado.' });
      }
      return res.status(200).json(data);
    }

    let query = supabase.from('alunos').select('*').order('nome', { ascending: true });

    if (typeof search === 'string') {
      query = query.or(`nome.ilike.%${search}%,turma.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ message: 'Erro ao buscar alunos.', error: error.message });
    }
    return res.status(200).json(data);
  }

  // POST
  if (req.method === 'POST') {
    const {
      nome,
      turma,
      codigo,
      limite_diario,
      limite_mensal,
      permite_fiado,
      saldo_baixo_limite,
      ativo
    } = req.body;

    if (!nome || !turma) {
      return res.status(400).json({ message: 'Nome e Turma são campos obrigatórios.' });
    }

    const { data, error } = await supabase
      .from('alunos')
      .insert([{
        nome,
        turma,
        codigo,
        saldo_atual: 0,
        limite_diario: limite_diario || 0,
        limite_mensal: limite_mensal || 0,
        permite_fiado: permite_fiado ?? true,
        saldo_baixo_limite: saldo_baixo_limite || 10,
        ativo: ativo ?? true
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ message: 'Já existe um aluno com este código (RA).' });
      }
      return res.status(500).json({ message: 'Erro ao criar aluno.', error: error.message });
    }

    return res.status(201).json(data);
  }

  // PUT
  if (req.method === 'PUT') {
    const { id } = req.query;

    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'ID do aluno inválido.' });
    }

    const {
