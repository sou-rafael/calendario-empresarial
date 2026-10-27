# 📅 KdConta — "Cadê a conta?"

Plataforma moderna de **Gestão Financeira de Contas a Pagar e Fluxo de Caixa Diário** para pequenas empresas, autônomos e microempreendedores.

## ✨ Principais Recursos
- **Leitor Inteligente de Boletos (PDF e Câmera):** Extração de linha digitável (47/48 dígitos FEBRABAN), vencimento e valor com armazenamento privado via URLs assinadas.
- **Lançamento por Comando de Voz:** Fale a despesa naturalmente e agende no calendário com 1 toque.
- **Calendário Financeiro Mensal:** Semáforo visual (Pago, Pendente, Atrasado) e baixa rápida em 1 clique.
- **DRE Gerencial & Dashboard Analítico:** Demonstração do Resultado do Exercício do mês e gráficos interativos.
- **PWA Mobile First ("Modo Bolso"):** Interface adaptada para operação rápida no celular com cópia inteligente de código de barras.

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
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Para gerar o build de produção:
   ```bash
   npm run build
   ```

Consulte o arquivo [`AGENTS.md`](./AGENTS.md) para detalhes de arquitetura, banco de dados e políticas de segurança Multi-Tenant.
