import type { NextApiRequest, NextApiResponse } from 'next';

// This is a placeholder API route for future integration with the Gemini model.
// It is not implemented to call the Gemini API yet.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { prompt, id_usuario_autenticado } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'O prompt é obrigatório.' });
    }

    // --- FUTURE GEMINI INTEGRATION LOGIC WILL GO HERE ---
    // Example conceptual flow:
    // 1. Initialize Gemini client with process.env.API_KEY.
    //    const { GoogleGenAI } = require("@google/genai"); // Or ES module import
    //    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    //
    // 2. Use Gemini model (e.g., 'gemini-2.5-flash') to interpret the natural language prompt.
    //    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' }); // OLD API, use ai.models.generateContent
    //
    // 3. Potentially use function calling (tools) to query the Supabase database
    //    for student information (e.g., saldo, recent sales).
    //    For example:
    //    const { data: studentData, error: studentError } = await supabase.from('alunos').select('*').ilike('nome', `%${studentName}%`).single();
    //    const { data: salesData, error: salesError } = await supabase.from('vendas').select('*').eq('id_aluno', studentId).order('data_hora', { ascending: false }).limit(3);
    //
    // 4. Construct a response based on Gemini's output and any retrieved database info.
    // ---------------------------------------------------

    // Mock response for now
    const mockAluno = {
      id: 'mock-student-id-123',
      nome: 'João da Silva',
      turma: '7A',
      saldo_atual: 75.20,
    };
    const mockResumoConsumo = 'João da Silva possui um saldo atual de R$ 75,20. Ele comprou um salgado grande e um suco hoje.';

    return res.status(200).json({
      success: true,
      message: 'Informações processadas com sucesso pelo assistente de IA.',
      data: {
        aluno_encontrado: mockAluno,
        resumo_consumo: mockResumoConsumo,
      },
      debug: 'Esta rota será implementada futuramente com a API Gemini para processamento de linguagem natural.',
    });
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
