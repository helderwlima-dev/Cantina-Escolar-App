import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceRoleSupabaseClient } from '../../lib/supabaseClient';
import { Aluno } from '../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServiceRoleSupabaseClient();

  if (req.method === 'POST') {
    const { id_aluno, valor, forma, usuario_criou } = req.body;

    if (!id_aluno || !valor || !forma) {
      return res.status(400).json({ message: 'ID do aluno, valor e forma de pagamento são obrigatórios.' });
    }
    if (typeof valor !== 'number' || valor <= 0) {
      return res.status(400).json({ message: 'Valor da recarga deve ser um número positivo.' });
    }

    try {
      // Start a database transaction
      const { data: transactionData, error: transactionError } = await supabase.rpc('start_transaction');
      if (transactionError) throw new Error(transactionError.message);

      // 1. Get current student saldo
      const { data: aluno, error: alunoError } = await supabase
        .from('alunos')
        .select('id, saldo_atual')
        .eq('id', id_aluno)
        .single();

      if (alunoError || !aluno) {
        throw new Error(alunoError?.message || 'Aluno não encontrado.');
      }

      const novo_saldo = aluno.saldo_atual + valor;

      // 2. Update student saldo
      const { error: updateError } = await supabase
        .from('alunos')
        .update({ saldo_atual: novo_saldo })
        .eq('id', id_aluno);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // 3. Insert recharge record
      const { error: recargaError } = await supabase.from('recargas').insert([{
        id_aluno,
        valor,
        forma,
        usuario_criou,
        data_hora: new Date().toISOString(),
      }]);

      if (recargaError) {
        throw new Error(recargaError.message);
      }

      // Commit the transaction
      const { data: commitData, error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) throw new Error(commitError.message);

      return res.status(200).json({ message: 'Recarga realizada com sucesso!', novo_saldo_aluno: novo_saldo });

    } catch (error: any) {
      // Rollback transaction in case of error
      await supabase.rpc('rollback_transaction'); // Assuming you have a rollback function
      console.error('Erro na recarga:', error.message);
      return res.status(500).json({ message: error.message || 'Erro interno do servidor ao processar recarga.' });
    }
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
