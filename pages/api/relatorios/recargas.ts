import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceRoleSupabaseClient } from '../../../lib/supabaseClient';
import { convertToCSV } from '../../../lib/utils';
import { Recarga } from '../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServiceRoleSupabaseClient();

  if (req.method === 'GET') {
    const { startDate, endDate, id_aluno, format } = req.query;

    let query = supabase
      .from('recargas')
      .select(`
        id,
        data_hora,
        valor,
        forma,
        usuario_criou,
        alunos (
          nome,
          turma
        )
      `)
      .order('data_hora', { ascending: false });

    if (id_aluno) {
      query = query.eq('id_aluno', id_aluno);
    }
    if (startDate) {
      query = query.gte('data_hora', `${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      query = query.lte('data_hora', `${endDate}T23:59:59.999Z`);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ message: 'Erro ao buscar recargas.', error: error.message });
    }

    const recargasData = data?.map((recarga: any) => ({
      id: recarga.id,
      data_hora: recarga.data_hora,
      valor: recarga.valor,
      forma: recarga.forma,
      usuario_criou: recarga.usuario_criou,
      aluno_nome: recarga.alunos?.nome,
      aluno_turma: recarga.alunos?.turma,
    })) || [];

    if (format === 'csv') {
      const csv = convertToCSV(recargasData, [
        { key: 'data_hora', header: 'Data/Hora' },
        { key: 'aluno_nome', header: 'Nome do Aluno' },
        { key: 'aluno_turma', header: 'Turma do Aluno' },
        { key: 'valor', header: 'Valor Recarga' },
        { key: 'forma', header: 'Forma Pgto' },
        { key: 'usuario_criou', header: 'Usuário' },
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="recargas-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.status(200).send(csv);
    }

    return res.status(200).json(recargasData);
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
