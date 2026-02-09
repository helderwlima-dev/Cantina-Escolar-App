import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceRoleSupabaseClient } from '../../../lib/supabaseClient';
import { convertToCSV } from '../../../lib/utils';
import { Aluno } from '../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServiceRoleSupabaseClient();

  if (req.method === 'GET') {
    const { search, format } = req.query; // 'search' can be used for name/turma filtering if needed

    let query = supabase
      .from('alunos')
      .select('*')
      .order('nome', { ascending: true });

    if (search) {
      query = query.or(`nome.ilike.%${search}%,turma.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ message: 'Erro ao buscar saldos.', error: error.message });
    }

    if (format === 'csv') {
      const csv = convertToCSV(data || [], [
        { key: 'nome', header: 'Nome' },
        { key: 'turma', header: 'Turma' },
        { key: 'codigo', header: 'Código (RA)' },
        { key: 'saldo_atual', header: 'Saldo Atual' },
        { key: 'limite_diario', header: 'Limite Diário' },
        { key: 'limite_mensal', header: 'Limite Mensal' },
        { key: 'permite_fiado', header: 'Permite Fiado' },
        { key: 'saldo_baixo_limite', header: 'Limite Saldo Baixo' },
        { key: 'ativo', header: 'Ativo' },
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="saldos-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.status(200).send(csv);
    }

    return res.status(200).json(data);
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
