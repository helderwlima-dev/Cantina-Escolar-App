# Cantina Escolar App

Um sistema de gestão de contas de alunos para cantina escolar, focado em rapidez no caixa e uso em celular, substituindo o caderno de fiado.

## Visão Geral

Este projeto é uma aplicação full-stack construída com Next.js, React e Tailwind CSS para o frontend, Next.js API Routes para o backend e Supabase (PostgreSQL) para o banco de dados. Ele foi projetado para ser responsivo e otimizado para dispositivos móveis, ideal para uso em um ambiente de cantina escolar.

O sistema gerencia contas de alunos, permitindo vendas por crédito ou fiado, recargas de saldo, e relatórios de transações.

## Tecnologias Utilizadas

- **Frontend**: Next.js 14+, React 18+, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth (simples email/senha)
- **Deployment**: Vercel

## Como Instalar e Rodar Localmente

1.  **Clone o repositório:**
    ```bash
    git clone [seu-repositorio-github]
    cd cantina-escolar-app
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Variáveis de Ambiente:**
    Crie um arquivo `.env.local` na raiz do projeto e adicione as seguintes variáveis:

    ```
    NEXT_PUBLIC_SUPABASE_URL="SUA_URL_SUPABASE"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="SUA_ANON_KEY_SUPABASE"
    SUPABASE_SERVICE_ROLE_KEY="SUA_SERVICE_ROLE_KEY_SUPABASE" # Apenas para rotas de API no backend
    ```
    -   `NEXT_PUBLIC_SUPABASE_URL`: Encontrado no seu painel do Supabase, `Project Settings` > `API`.
    -   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: A "public anon key", encontrada no mesmo local. Esta chave é segura para ser exposta no frontend.
    -   `SUPABASE_SERVICE_ROLE_KEY`: A "service role key" (ou `anon key` se estiver usando para admin, mas preferencialmente a service role key para operações de escrita mais seguras no backend). **ATENÇÃO:** Esta chave deve ser usada APENAS em rotas de API do Next.js (no backend) e NUNCA exposta diretamente no código do frontend ou em variáveis `NEXT_PUBLIC_`.

4.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    A aplicação estará disponível em `http://localhost:3000`.

## Database Schema (Supabase)

Você precisará criar as seguintes tabelas no seu projeto Supabase. Use o SQL Editor no painel do Supabase para criar ou o Table Editor.

### `alunos`

Gerencia os dados dos alunos.

```sql
CREATE TABLE alunos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  turma text NOT NULL,
  codigo text UNIQUE, -- Opcional (RA do aluno)
  saldo_atual numeric DEFAULT 0 NOT NULL,
  limite_diario numeric DEFAULT 0 NOT NULL, -- 0 = sem limite
  limite_mensal numeric DEFAULT 0 NOT NULL, -- 0 = sem limite
  permite_fiado boolean DEFAULT TRUE NOT NULL,
  saldo_baixo_limite numeric DEFAULT 10 NOT NULL,
  ativo boolean DEFAULT TRUE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Adicionar RLS (Row Level Security) conforme necessário para sua aplicação.
-- Ex: Permitir que apenas usuários autenticados possam ver os alunos.
-- ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read access for all users" ON "public"."alunos" FOR SELECT USING (true);
-- CREATE POLICY "Enable insert for authenticated users only" ON "public"."alunos" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Enable update for authenticated users only" ON "public"."alunos" FOR UPDATE USING (auth.role() = 'authenticated');
```

### `produtos`

Armazena os produtos disponíveis na cantina.

```sql
CREATE TABLE produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  preco numeric NOT NULL,
  ativo boolean DEFAULT TRUE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS para produtos
-- ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read access for all users" ON "public"."produtos" FOR SELECT USING (true);
-- CREATE POLICY "Enable insert for authenticated users only" ON "public"."produtos" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Enable update for authenticated users only" ON "public"."produtos" FOR UPDATE USING (auth.role() = 'authenticated');

-- Exemplos de dados iniciais para produtos (opcional)
INSERT INTO produtos (nome, preco) VALUES
('Salgado Pequeno', 6.00),
('Salgado Grande', 10.00),
('Bolo no Pote', 12.00),
('Suco', 3.00),
('Refrigerante', 5.00),
('Barra de Cereal', 4.00);
```

### `vendas`

Registra cada transação de venda.

```sql
CREATE TYPE venda_tipo AS ENUM ('credito', 'fiado');
CREATE TYPE venda_status AS ENUM ('normal', 'cancelada');

CREATE TABLE vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_aluno uuid NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  data_hora timestamp with time zone DEFAULT now() NOT NULL,
  valor_total numeric NOT NULL,
  tipo venda_tipo NOT NULL,
  status venda_status DEFAULT 'normal' NOT NULL,
  usuario_criou text, -- Pode ser o email do usuário ou id do Auth
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS para vendas
-- ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read for authenticated users" ON "public"."vendas" FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Enable insert for authenticated users" ON "public"."vendas" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Enable update for authenticated users" ON "public"."vendas" FOR UPDATE USING (auth.role() = 'authenticated');
```

### `itens_venda`

Detalhes dos produtos em cada venda.

```sql
CREATE TABLE itens_venda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_venda uuid NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  id_produto uuid NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
  quantidade integer NOT NULL,
  valor_unitario numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(id_venda, id_produto) -- Para evitar duplicidade de um produto na mesma venda
);

-- RLS para itens_venda
-- ALTER TABLE itens_venda ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read for authenticated users" ON "public"."itens_venda" FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Enable insert for authenticated users" ON "public"."itens_venda" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Enable update for authenticated users" ON "public"."itens_venda" FOR UPDATE USING (auth.role() = 'authenticated');
```

### `recargas`

Registra todas as recargas de saldo.

```sql
CREATE TABLE recargas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_aluno uuid NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  data_hora timestamp with time zone DEFAULT now() NOT NULL,
  valor numeric NOT NULL,
  forma text NOT NULL, -- Ex: "pix", "dinheiro", "cartao"
  usuario_criou text, -- Pode ser o email do usuário ou id do Auth
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS para recargas
-- ALTER TABLE recargas ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read for authenticated users" ON "public"."recargas" FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Enable insert for authenticated users" ON "public"."recargas" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Enable update for authenticated users" ON "public"."recargas" FOR UPDATE USING (auth.role() = 'authenticated');
```

## Como Fazer Deploy na Vercel

1.  **Crie um repositório GitHub:**
    Inicialize um repositório Git local e faça o push do seu código para o GitHub.
    ```bash
    git init
    git add .
    git commit -m "Initial commit: Cantina Escolar App"
    git branch -M main
    git remote add origin [URL_DO_SEU_REPOSITORIO_GITHUB]
    git push -u origin main
    ```

2.  **Conecte seu projeto à Vercel:**
    -   Vá para [Vercel](https://vercel.com/) e faça login.
    -   Clique em "Add New..." > "Project".
    -   Selecione o repositório GitHub que você acabou de criar.
    -   A Vercel deve detectar automaticamente que é um projeto Next.js.

3.  **Configure as Variáveis de Ambiente:**
    -   Antes de fazer o deploy, vá para `Settings` > `Environment Variables` no painel do seu projeto na Vercel.
    -   Adicione as mesmas variáveis de ambiente que você configurou em `.env.local`:
        -   `NEXT_PUBLIC_SUPABASE_URL`
        -   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        -   `SUPABASE_SERVICE_ROLE_KEY`
    -   Certifique-se de que `NEXT_PUBLIC_` variáveis estão configuradas para `Edge Functions`, `Serverless Functions` e `Browser`. `SUPABASE_SERVICE_ROLE_KEY` deve ser configurada apenas para `Serverless Functions`.

4.  **Faça o Deploy:**
    -   Clique em "Deploy".
    -   A Vercel irá construir e implantar sua aplicação. Cada push para a branch `main` (ou a branch configurada para produção) acionará um novo deploy.

## Integração Futura com Gemini (Placeholder)

Uma rota placeholder foi criada em `/api/chat-assistente` para futuras integrações com modelos de IA, como o `gemini-2.5-flash`.

### `/api/chat-assistente` (POST)

**Propósito:** Interagir com um modelo Gemini para buscar informações sobre alunos ou seu histórico de consumo usando linguagem natural.

**Parâmetros (Body):**

```json
{
  "prompt": "Qual o saldo da Maria Silva e o que ela comprou nas últimas 3 vendas?",
  "id_usuario_autenticado": "uuid-do-usuario-logado"
}
```

**Resposta (Exemplo):**

```json
{
  "success": true,
  "message": "Informações processadas com sucesso pelo assistente de IA.",
  "data": {
    "aluno_encontrado": {
      "id": "uuid-do-aluno",
      "nome": "Maria Silva",
      "turma": "8B",
      "saldo_atual": 45.50
    },
    "resumo_consumo": "Maria Silva possui um saldo de R$ 45,50. Suas últimas compras foram: 1 Salgado Pequeno em 10/05/2024 (R$ 6,00), 2 Sucos em 09/05/2024 (R$ 6,00), e 1 Bolo no Pote em 08/05/2024 (R$ 12,00)."
  },
  "debug": "Esta rota será implementada futuramente com a API Gemini para processamento de linguagem natural."
}
```
No futuro, a lógica aqui envolveria:
1.  Receber o `prompt` do frontend.
2.  Chamar a API Gemini (`ai.models.generateContent`) com o `prompt` e possibly `tools` para buscar dados do Supabase.
3.  Processar a resposta do Gemini e formatar para o frontend.

---
**Nota sobre `index.html` e `App.tsx`:**
No contexto de um projeto Next.js, os arquivos `index.html` (no root) e `App.tsx` (no root) não são os pontos de entrada típicos como em uma aplicação React pura. O Next.js gerencia a geração do HTML via `pages/_document.tsx` (se existir uma customização) e a componentização principal via `pages/_app.tsx`. O `index.html` gerado aqui é apenas para atender à estrutura de saída solicitada, mas não é o arquivo servido diretamente pelo Next.js. O `pages/_app.tsx` serve ao propósito de um `App.tsx` para o Next.js.
