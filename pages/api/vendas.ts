import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceRoleSupabaseClient } from '../../lib/supabaseClient';
import { Aluno, VendaTipo, VendaStatus } from '../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServiceRoleSupabaseClient();

  if (req.method === 'POST') {
    const { id_aluno, itens, usuario_criou } = req.body;

    if (!id_aluno || !itens || itens.length === 0) {
      return res.status(400).json({ message: 'ID do aluno e itens da venda são obrigatórios.' });
    }

    const valor_total = itens.reduce((sum: number, item: { quantidade: number, valor_unitario: number }) => {
      return sum + item.quantidade * item.valor_unitario;
    }, 0);

    try {
      // Start a database transaction
      const { data: transactionData, error: transactionError } = await supabase.rpc('start_transaction');
      if (transactionError) throw new Error(transactionError.message);

      // 1. Fetch student data
      const { data: aluno, error: alunoError } = await supabase
        .from('alunos')
        .select('id, nome, saldo_atual, limite_diario, limite_mensal, permite_fiado, saldo_baixo_limite')
        .eq('id', id_aluno)
        .single();

      if (alunoError || !aluno) {
        throw new Error(alunoError?.message || 'Aluno não encontrado.');
      }

      // 2. Check daily and monthly limits
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      // Sum today's sales for the student
      const { data: dailySales, error: dailySalesError } = await supabase
        .from('vendas')
        .select('valor_total')
        .eq('id_aluno', id_aluno)
        .eq('status', 'normal')
        .gte('data_hora', `${today}T00:00:00.000Z`)
        .lte('data_hora', `${today}T23:59:59.999Z`);

      if (dailySalesError) throw new Error(dailySalesError.message);
      const vendas_dia = dailySales?.reduce((sum, sale) => sum + sale.valor_total, 0) || 0;

      if (aluno.limite_diario > 0 && (vendas_dia + valor_total) > aluno.limite_diario) {
        throw new Error(`Limite diário de ${aluno.nome} excedido. Venda de ${valor_total} R$ + ${vendas_dia} R$ (hoje) > ${aluno.limite_diario} R$.`);
      }

      // Sum monthly sales for the student
      const { data: monthlySales, error: monthlySalesError } = await supabase
        .from('vendas')
        .select('valor_total')
        .eq('id_aluno', id_aluno)
        .eq('status', 'normal')
        .gte('data_hora', `${startOfMonth}T00:00:00.000Z`)
        .lte('data_hora', new Date().toISOString());

      if (monthlySalesError) throw new Error(monthlySalesError.message);
      const vendas_mes = monthlySales?.reduce((sum, sale) => sum + sale.valor_total, 0) || 0;

      if (aluno.limite_mensal > 0 && (vendas_mes + valor_total) > aluno.limite_mensal) {
        throw new Error(`Limite mensal de ${aluno.nome} excedido. Venda de ${valor_total} R$ + ${vendas_mes} R$ (mês) > ${aluno.limite_mensal} R$.`);
      }

      let tipo: VendaTipo;
      let novo_saldo_aluno = aluno.saldo_atual;

      if (aluno.saldo_atual >= valor_total) {
        tipo = 'credito';
        novo_saldo_aluno -= valor_total;
      } else {
        if (aluno.permite_fiado) {
          tipo = 'fiado';
          // Saldo atual não muda para fiado
        } else {
          throw new Error(`Aluno ${aluno.nome} não possui saldo suficiente e não permite fiado.`);
        }
      }

      // 3. Insert into 'vendas'
      const { data: vendaData, error: vendaError } = await supabase.from('vendas').insert([{
        id_aluno,
        data_hora: new Date().toISOString(),
        valor_total,
        tipo,
        status: 'normal' as VendaStatus,
        usuario_criou,
      }]).select().single();

      if (vendaError || !vendaData) {
        throw new Error(vendaError?.message || 'Erro ao criar registro de venda.');
      }

      // 4. Insert into 'itens_venda'
      const itensVendaToInsert = itens.map((item: any) => ({
        id_venda: vendaData.id,
        id_produto: item.id_produto,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
      }));

      const { error: itensError } = await supabase.from('itens_venda').insert(itensVendaToInsert);
      if (itensError) {
        throw new Error(itensError.message);
      }

      // 5. Update student saldo if it was a credit sale
      if (tipo === 'credito') {
        const { error: updateSaldoError } = await supabase
          .from('alunos')
          .update({ saldo_atual: novo_saldo_aluno })
          .eq('id', id_aluno);

        if (updateSaldoError) {
          throw new Error(updateSaldoError.message);
        }
      }

      // Commit the transaction
      const { data: commitData, error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) throw new Error(commitError.message);

      const saldo_baixo = novo_saldo_aluno < aluno.saldo_baixo_limite;

      return res.status(200).json({
        message: 'Venda lançada com sucesso!',
        valor_total,
        tipo,
        novo_saldo_aluno,
        saldo_baixo,
      });

    } catch (error: any) {
      // Rollback transaction in case of error
      await supabase.rpc('rollback_transaction'); // Assuming you have a rollback function
      console.error('Erro na venda:', error.message);
      return res.status(500).json({ message: error.message || 'Erro interno do servidor ao processar venda.' });
    }
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
