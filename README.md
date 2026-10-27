# 📅 KdConta — "Cadê a conta?"

Plataforma moderna de **Gestão Financeira de Contas a Pagar e Fluxo de Caixa Diário** para pequenas empresas, autônomos e microempreendedores.

## ✨ Principais Recursos
- **Leitor Inteligente de Boletos (PDF e Câmera):** Extração local de linha digitável (47/48 dígitos FEBRABAN), vencimento e valor via `pdfjs-dist` (`isEvalSupported: false`) com armazenamento privado no Supabase Storage via URLs assinadas de 60 segundos.
- **Lançamento por Comando de Voz:** Fale a despesa naturalmente e agende no calendário com 1 toque.
- **Calendário Financeiro Mensal:** Semáforo visual (Pago, Pendente, Atrasado) e baixa rápida em 1 clique.
- **DRE Gerencial & Dashboard Analítico:** Demonstração do Resultado do Exercício estritamente filtrada por competência mensal e gráficos interativos em Recharts.
- **PWA Mobile First ("Modo Bolso"):** Interface adaptada para operação rápida no celular com cópia inteligente de código de barras e janela operacional otimizada.

## 🔒 Segurança & Arquitetura Multi-Tenant
- **Row Level Security (RLS):** Isolamento por `auth.uid() = user_id` nas tabelas `bills` e `categories`, incluindo validação cruzada de `category_id` por tenant.
- **Bucket Privado (`boletos`):** Limite de 10 MB, whitelist de tipos MIME (`PDF`, `JPEG`, `PNG`, `WEBP`), isolamento por pasta `user_id/*` e acesso exclusivo via URL assinada temporária (`src/lib/storage.js`).
- **Headers HTTP & Code Splitting:** Configurados em `vercel.json` (HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, CSP Report-Only) e rotas carregadas sob demanda com `React.lazy`.

## 🚀 Como Rodar Localmente

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure o arquivo `.env.local` com as chaves do projeto Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_anon_key_do_supabase
   ```
3. Aplique a migration de banco de dados e políticas de segurança no SQL Editor do Supabase:
   - Arquivo: [`supabase/migrations/20261027000000_security_hardening.sql`](./supabase/migrations/20261027000000_security_hardening.sql)
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Para gerar o build de produção:
   ```bash
   npm run build
   ```

Consulte o arquivo [`AGENTS.md`](./AGENTS.md) para a documentação completa de arquitetura, banco de dados, roadmap comercial e políticas de segurança Multi-Tenant.
