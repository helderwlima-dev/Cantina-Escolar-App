import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceRoleSupabaseClient } from '../../../lib/supabaseClient';
import { convertToCSV } from '../../../lib/utils';
import { Venda } from '../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServiceRoleSupabaseClient();

  if (req.method === 'GET') {
    const { startDate, endDate, id_aluno, format } = req.query;

    let query = supabase
      .from('vendas')
      .select(`
        id,
        data_hora,
        valor_total,
        tipo,
        status,
        usuario_criou,
        alunos (
          nome,
          turma
        ),
        itens_venda (
          quantidade,
          valor_unitario,
          produtos (
            nome
          )
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
      return res.status(500).json({ message: 'Erro ao buscar vendas.', error: error.message });
    }

    const vendasData = data?.map((venda: any) => ({
      id: venda.id,
      data_hora: venda.data_hora,
      valor_total: venda.valor_total,
      tipo: venda.tipo,
      status: venda.status,
      usuario_criou: venda.usuario_criou,
      aluno_nome: venda.alunos?.nome,
      aluno_turma: venda.alunos?.turma,
      itens: venda.itens_venda.map((item: any) => `${item.quantidade}x ${item.produtos?.nome} (${item.valor_unitario})`).join('; '),
    })) || [];

    if (format === 'csv') {
      const csv = convertToCSV(vendasData, [
        { key: 'data_hora', header: 'Data/Hora' },
        { key: 'aluno_nome', header: 'Nome do Aluno' },
        { key: 'aluno_turma', header: 'Turma do Aluno' },
        { key: 'valor_total', header: 'Valor Total' },
        { key: 'tipo', header: 'Tipo Venda' },
        { key: 'status', header: 'Status' },
        { key: 'usuario_criou', header: 'Usuário' },
        { key: 'itens', header: 'Itens' },
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="vendas-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.status(200).send(csv);
    }

    return res.status(200).json(vendasData);
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
