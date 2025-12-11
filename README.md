# CaloryIA - Fitness AI

Este é um aplicativo React moderno movido a Inteligência Artificial (Google Gemini e Imagen).

## 🚀 Como rodar no seu computador

1.  **Baixe os arquivos** deste projeto.
2.  Instale o [Node.js](https://nodejs.org/) (versão 18 ou superior).
3.  Abra o terminal na pasta do projeto e instale as dependências:
    ```bash
    npm install
    ```
4.  Crie um arquivo chamado `.env.local` na raiz do projeto e adicione sua chave da Gemini:
    ```env
    VITE_API_KEY=Sua_Chave_Aqui_AQ...
    ```
5.  Rode o projeto:
    ```bash
    npm run dev
    ```

## 🗄️ Configuração do Supabase (Banco de Dados)

Para que o login e o salvamento de dados funcionem, vá até o **SQL Editor** do seu projeto no Supabase e rode o seguinte código (Otimizado para performance):

```sql
-- 1. Tabela de Perfis
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  data jsonb
);
alter table profiles enable row level security;

-- Políticas com (SELECT auth.uid()) para melhor performance
create policy "Usuários podem ver o próprio perfil" on profiles for select using (id = (select auth.uid()));
create policy "Usuários podem atualizar o próprio perfil" on profiles for update using (id = (select auth.uid()));
create policy "Usuários podem inserir o próprio perfil" on profiles for insert with check (id = (select auth.uid()));

-- 2. Tabela de Planos
create table if not exists plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  active boolean default true,
  created_at timestamp with time zone default now(),
  data jsonb
);
alter table plans enable row level security;

create policy "Usuários veem seus planos" on plans for select using (user_id = (select auth.uid()));
create policy "Usuários criam planos" on plans for insert with check (user_id = (select auth.uid()));
create policy "Usuários atualizam planos" on plans for update using (user_id = (select auth.uid()));

-- 3. Tabela de Histórico
create table if not exists history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text,
  date timestamp with time zone,
  data jsonb
);
alter table history enable row level security;

create policy "Usuários veem seu histórico" on history for select using (user_id = (select auth.uid()));
create policy "Usuários criam histórico" on history for insert with check (user_id = (select auth.uid()));
```

## 🌐 Como hospedar (Colocar no ar)

A maneira mais fácil é usar **Vercel** ou **Netlify**.

### Opção 1: Vercel (Recomendado)

1.  Crie um repositório no **GitHub** e suba estes arquivos.
2.  Crie uma conta no [Vercel](https://vercel.com/).
3.  Clique em **"Add New Project"** e selecione seu repositório do GitHub.
4.  Nas configurações de **"Environment Variables"** (Variáveis de Ambiente), adicione:
    *   **Name:** `VITE_API_KEY`
    *   **Value:** (Sua chave da API do Google Gemini)
5.  Clique em **Deploy**.

### Configuração de Pagamento

Atualmente, o app está em **Modo de Simulação** (pagamentos falsos para teste).
Para vender de verdade:
1.  Abra `services/paymentService.ts`.
2.  Mude `SIMULATION_MODE: true` para `false`.
3.  Adicione seu Link de Pagamento do Mercado Pago em `STATIC_CHECKOUT_URL`.