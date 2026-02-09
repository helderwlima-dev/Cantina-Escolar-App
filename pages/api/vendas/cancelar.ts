import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceRoleSupabaseClient } from '../../../lib/supabaseClient';
import { VendaStatus } from '../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServiceRoleSupabaseClient();

  if (req.method === 'POST') {
    const { id_venda } = req.body;

    if (!id_venda) {
      return res.status(400).json({ message: 'ID da venda é obrigatório para cancelamento.' });
    }

    try {
      // Start a database transaction
      const { data: transactionData, error: transactionError } = await supabase.rpc('start_transaction');
      if (transactionError) throw new Error(transactionError.message);

      // 1. Fetch sale details
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .select('id, id_aluno, valor_total, tipo, status')
        .eq('id', id_venda)
        .single();

      if (vendaError || !venda) {
        throw new Error(vendaError?.message || 'Venda não encontrada.');
      }

      if (venda.status === 'cancelada') {
        throw new Error('Esta venda já está cancelada.');
      }

      // 2. Update sale status to 'cancelada'
      const { error: updateVendaError } = await supabase
        .from('vendas')
        .update({ status: 'cancelada' as VendaStatus })
        .eq('id', id_venda);

      if (updateVendaError) {
        throw new Error(updateVendaError.message);
      }

      // 3. If sale was 'credito', estornar (refund) the value to the student's balance
      if (venda.tipo === 'credito') {
        const { data: aluno, error: alunoError } = await supabase
          .from('alunos')
          .select('saldo_atual')
          .eq('id', venda.id_aluno)
          .single();

        if (alunoError || !aluno) {
          throw new Error(alunoError?.message || 'Aluno da venda não encontrado para estorno.');
        }

        const novo_saldo = aluno.saldo_atual + venda.valor_total;
        const { error: updateSaldoError } = await supabase
          .from('alunos')
          .update({ saldo_atual: novo_saldo })
          .eq('id', venda.id_aluno);

        if (updateSaldoError) {
          throw new Error(updateSaldoError.message);
        }
      }

      // Commit the transaction
      const { data: commitData, error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) throw new Error(commitError.message);

      return res.status(200).json({ message: 'Venda cancelada com sucesso!', id_venda, tipo: venda.tipo });

    } catch (error: any) {
      // Rollback transaction in case of error
      await supabase.rpc('rollback_transaction');
      console.error('Erro ao cancelar venda:', error.message);
      return res.status(500).json({ message: error.message || 'Erro interno do servidor ao cancelar venda.' });
    }
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
