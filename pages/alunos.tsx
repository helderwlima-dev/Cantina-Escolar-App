import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Variáveis do Supabase não encontradas');
      return res.status(500).json({ message: 'Configuração do servidor inválida' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // =========================
    // GET → listar alunos
    // =========================
    if (req.method === 'GET') {
      const search = (req.query.search as string) || '';

      let query = supabase
        .from('alunos')
        .select('*')
        .order('nome', { ascending: true });

      if (search) {
        query = query.or(
          `nome.ilike.%${search}%,turma.ilike.%${search}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao buscar alunos' });
      }

      return res.status(200).json(data);
    }

    // =========================
    // POST → criar aluno
    // =========================
    if (req.method === 'POST') {
      const {
        nome,
        turma,
        codigo,
        limite_diario,
        limite_mensal,
        permite_fiado,
        saldo_baixo_limite,
        ativo,
      } = req.body;

      const { data, error } = await supabase
        .from('alunos')
        .insert([
          {
            nome,
            turma,
            codigo,
            limite_diario,
            limite_mensal,
            permite_fiado,
            saldo_baixo_limite,
            ativo,
            saldo_atual: 0,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar aluno' });
      }

      return res.status(201).json(data);
    }

    // =========================
    // PUT → atualizar aluno
    // =========================
    if (req.method === 'PUT') {
      const id = req.query.id as string;

      if (!id) {
        return res.status(400).json({ message: 'ID do aluno é obrigatório' });
      }

      const { error } = await supabase
        .from('alunos')
        .update(req.body)
        .eq('id', id);

      if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar aluno' });
      }

      return res.status(200).json({ message: 'Aluno atualizado com sucesso' });
    }

    // =========================
    // Método não permitido
    // =========================
    return res.status(405).json({ message: 'Método não permitido' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
