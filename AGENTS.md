# 🤖 AGENTS.md — Documentação Técnica & de Arquitetura: KdConta

> **Sobre este documento:** Guia de referência técnica obrigatório para agentes de IA e desenvolvedores que operam ou estendem o ecossistema do **KdConta** ("Cadê a conta?"). Contém o inventário completo de funcionalidades ativas, arquitetura de software, blindagem de segurança Multi-Tenant, stack tecnológica detalhada, convenções de código, regras de negócio e histórico de evolução.

---

## 1. Visão Geral do Produto

* **Nome do Produto:** KdConta
* **Mote / Tagline:** *"Cadê a conta?"*
* **Domínios Planejados:**
  * `kdconta.com.br` e `www.kdconta.com.br`: Landing Page pública de conversão e captação.
  * `app.kdconta.com.br`: Aplicação SaaS (Web Desktop + PWA Mobile).
* **Proposta de Valor:** Plataforma financeira ágil de **Contas a Pagar e Fluxo de Caixa Diário** para PMEs, microempreendedores e autônomos. Elimina planilhas lentas e multas por esquecimento com **leitura inteligente de boletos por câmera/PDF**, **lançamento por comando de voz** e **calendário visual com baixa em 1 clique**.

---

## 2. Stack Tecnológica em Detalhes

### Frontend & Aplicação Cliente
| Tecnologia | Versão | Função no Projeto |
| :--- | :--- | :--- |
| **React** | `^19.2.6` | Biblioteca core para renderização declarativa, componentização reativa e Code Splitting (`React.lazy` + `Suspense`). |
| **Vite** | `^8.0.12` | Bundler e build tool ultra rápido com suporte a Hot Module Replacement (HMR) e geração de chunks otimizados. |
| **React Router DOM** | `^7.18.0` | Roteamento dinâmico SPA com suporte a subdomínios, rotas protegidas e detecção de viewport. |
| **pdfjs-dist** | `^6.4.299` | Extração local de texto de PDFs no navegador com worker empacotado via Vite e `isEvalSupported: false` (mitigação CVE-2024-4367). |
| **Recharts** | `^3.10.1` | Renderização de gráficos vetoriais (barras e pizza) no Dashboard analítico. |
| **Lucide React** | `^1.21.0` | Conjunto iconográfico consistente e moderno em formato SVG. |
| **date-fns** | `^4.4.0` | Manipulação precisa de datas com suporte a fuso horário e localização `pt-BR`. |
| **Web Speech API** | Nativa | Reconhecimento de fala contínuo no navegador para transcrição de comandos de despesa. |
| **Web Push / Service Worker** | Nativa (`public/sw.js`) | PWA nativo instalável com disparo de notificações locais no dispositivo. |

### Backend, Banco de Dados & Armazenamento (BaaS)
| Tecnologia | Função no Projeto |
| :--- | :--- |
| **Supabase (PostgreSQL 15+)** | Banco de dados relacional na nuvem com autenticação JWT, `DEFAULT auth.uid()` e Row Level Security (RLS) restritivo. |
| **@supabase/supabase-js** (`^2.108.2`) | Cliente SDK oficial para queries parametrizadas, mutações e manipulação de sessão/auth. |
| **Supabase Storage (Bucket Privado: `boletos`)** | Repositório privado (`public: false`) para PDFs de boletos e fotos de comprovantes, isolado por pasta `user_id/*` e acessado via URLs assinadas de 60 segundos. |
| **Vercel (`vercel.json`)** | Plataforma de hospedagem serverless com deploy contínuo integrado à branch `main` e cabeçalhos HTTP de segurança (HSTS, X-Frame-Options, CSP Report-Only). |

### Tipografia & Design System
* **Tipografia Global:** `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');`
  * Foco em **Plus Jakarta Sans** para números e títulos modernos de fintech.
  * **Inter** como suporte para parágrafos e textos longos de alta legibilidade.
* **Paleta de Cores & Variáveis CSS (`src/index.css`):**
  * **Brand Accent:** `#6366f1` / `#818cf8` (Índigo vibrante).
  * **Semáforo de Status:**
    * 🟢 **Pago (Sucesso):** `#10b981` (Verde Esmeralda).
    * 🔴 **Atrasado (Urgência):** `#ef4444` (Vermelho Coral).
    * 🟡 **Pendente (Atenção):** `#f59e0b` (Âmbar).
  * **Dark Mode:** Base ardósia minimalista `#0f172a`, superfícies flutuantes `#1e293b`, divisórias sutis `#334155`.
  * **Light Mode:** Fundo limpo `#f8fafc`, superfícies brancas `#ffffff`, textos em chumbo `#0f172a` e `#475569`.

---

## 3. Inventário Detalhado de Funcionalidades Ativas

### 1. Ingestão Ultrarrápida de Despesas (Zero Digitação)
* **Scanner de Boletos (Câmera & Upload PDF):**
  * Componente: [`BoletoImportModal.jsx`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/components/BoletoImportModal.jsx) + Leitores: [`pdfReader.js`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/utils/pdfReader.js) e [`boletoParser.js`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/utils/boletoParser.js).
  * Suporta arrastar e soltar PDFs ou tirar foto pelo celular.
  * Parser nativo e regex inteligente para extrair:
    * Linha digitável / Código de barras de 47 ou 48 dígitos.
    * Data de vencimento corrigindo fatores de data bancários (padrão FEBRABAN, incluindo o novo ciclo pós-fev/2025).
    * Valor monetário formatado.
    * Beneficiário / Fornecedor.
  * Upload seguro via [`src/lib/storage.js`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/lib/storage.js) diretamente para o bucket privado do Supabase Storage (`user_id/uuid.ext`).
* **Lançamento por Comando de Voz:**
  * Hook: [`useSpeechRecognition.js`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/hooks/useSpeechRecognition.js) + Utilitário: [`voiceParser.js`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/utils/voiceParser.js).
  * Transcreve a fala do usuário (ex: *"Paguei 350 reais da Copel dia 15"*) com limite defensivo de 500 caracteres contra ReDoS.
  * O parser extrai valor numérico, detecta palavras-chave de data (*hoje, amanhã, dia X, sexta-feira*) e faz o match automático com as categorias cadastradas do usuário.
  * Exibe o modal de confirmação rápida ([`VoiceConfirmModal.jsx`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/components/VoiceConfirmModal.jsx)) para salvar com 1 toque.
* **Cadastro Manual Intuitivo:**
  * Componente: [`BillModal.jsx`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/components/BillModal.jsx).
  * Suporte a despesas e receitas, formatação de moeda R$ em tempo real, colagem de linha digitável, confirmação antes de excluir e remoção automática do anexo no Storage ao excluir a conta.

### 2. Gestão Visual do Calendário & Operações Rápidas
* **Calendário Mensal Financeiro:**
  * Página: [`CalendarView.jsx`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/pages/CalendarView.jsx).
  * Navegação entre meses, agrupamento diário de contas e badges de status colorido.
  * Células clicáveis que abrem pop-up detalhado do dia com subtotais somados.
* **Baixa Rápida em 1 Clique (`Dar Baixa` / `Reabrir`):**
  * Presente no Calendário, no Mobile Pocket, na Lista e no Mini-Dashboard.
  * Permite alternar o status da conta entre `Pago` e `Pendente` diretamente, recalculando os saldos sem necessidade de abrir telas de edição.
* **Mini-Dashboard Lateral (Desktop):**
  * Componente: [`MiniDashboard.jsx`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/components/MiniDashboard.jsx).
  * Indicadores de Total a Pagar, Total Já Pago, Saldo do Mês e alertas de contas críticas nos próximos 7 dias com botão direto para baixar ou copiar código.

### 3. Visão Gerencial & Relatórios
* **DRE Gerencial Mensal:**
  * Página: [`DreView.jsx`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/pages/DreView.jsx).
  * Filtra estritamente as contas pertencentes ao mês de competência selecionado (`yyyy-MM` com `useMemo`), ignorando dias adjacentes da grade visual do calendário.
  * Estrutura contábil simplificada: Receitas Brutas, Deduções/Despesas Operacionais agrupadas por categoria e Resultado Líquido do Exercício (Lucro ou Prejuízo).
* **Dashboard com Gráficos Analíticos:**
  * Página: [`DashboardView.jsx`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/pages/DashboardView.jsx).
  * Gráfico de barras (Entradas vs. Saídas) e gráfico de pizza (Distribuição de gastos por categoria) utilizando Recharts.
* **Visualização em Lista:**
  * Página: [`ListView.jsx`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/pages/ListView.jsx).
  * Tabela completa com busca textual por fornecedor/descrição, ordenação por data ou valor e filtros avançados por status e categoria.

### 4. PWA Mobile First ("Modo Bolso")
* **PWA Instalável:**
  * Página: [`MobilePocket.jsx`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/pages/MobilePocket.jsx).
  * Manifesto nativo (`public/manifest.json`), service worker (`public/sw.js`) e meta-tags iOS para rodar em tela cheia (standalone).
  * Carregamento otimizado por janela operacional de datas (`-60 dias` a `+180 dias`) para alta velocidade em redes móveis.
* **Cópia Inteligente para Banco:**
  * Botão de cópia da linha digitável em 1 toque com feedback tátil e visual.
  * Lembrete inteligente pós-cópia: pergunta se a conta foi paga ao retornar para o app.
* **Notificações Locais no Dispositivo:**
  * Hook: [`useWebPush.js`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/hooks/useWebPush.js).
  * Dispara alertas locais no navegador/PWA para contas que vencem no dia atual quando o aplicativo é aberto.

### 5. UI/UX & Componentes Personalizados
* **CustomSelect:**
  * Componente: [`CustomSelect.jsx`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/components/CustomSelect.jsx).
  * Seletor customizado com glassmorphism, indicador de foco, chevron animado, suporte a ícones/cores e fechamento por clique fora ou tecla `Esc`.
* **Menu Retrátil de Usuário (Header Desktop):**
  * Componente: [`Layout.jsx`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/components/Layout.jsx).
  * Menu dropdown compacto com avatar, alternador de tema (Dark/Light) e logout, mantendo o cabeçalho em linha única sem quebras.
* **Landing Page de Captação & Vendas:**
  * Página: [`LandingPage.jsx`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/pages/LandingPage.jsx) (rota `/landing` e raiz pública).
  * Inclui alternador de tema Dark/Light sincronizado via `localStorage`, seção de preços "Lote de Membros Fundadores" e carregamento isolado via `React.lazy` (~10 kB gzip).

---

## 4. Estrutura de Diretórios do Projeto

```text
calendario_empresarial/
├── public/
│   ├── favicon.svg             # Logotipo oficial em SVG vetorial
│   ├── manifest.json           # Configuração PWA (standalone, ícones, tema)
│   └── sw.js                   # Service Worker (Notificações & PWA)
├── src/
│   ├── components/
│   │   ├── AuthProvider.jsx    # Contexto global de autenticação Supabase
│   │   ├── BillModal.jsx       # Modal de cadastro/edição manual de contas
│   │   ├── BoletoImportModal.jsx # Leitor de boletos (PDF/Câmera OCR)
│   │   ├── CategoryModal.jsx   # Gestor de categorias e cores
│   │   ├── CustomSelect.jsx    # Combobox moderna customizada
│   │   ├── ErrorBoundary.jsx   # Tratamento global de erros React
│   │   ├── Layout.jsx          # Shell Desktop (Header, Menu Retrátil, Barra)
│   │   ├── MiniDashboard.jsx   # Painel lateral com próximos vencimentos (7 dias)
│   │   ├── MobileChatView.jsx  # Chat do Assistente KdConta (Em breve)
│   │   ├── ProtectedRoute.jsx  # Guarda de rotas autenticadas
│   │   ├── Sidebar.jsx         # Menu lateral de navegação desktop
│   │   └── VoiceConfirmModal.jsx # Modal de confirmação do comando de voz
│   ├── hooks/
│   │   ├── useSpeechRecognition.js # Hook para Web Speech API
│   │   └── useWebPush.js       # Hook para notificações locais PWA
│   ├── lib/
│   │   ├── storage.js          # Upload validado, URLs assinadas (60s) e exclusão no bucket 'boletos'
│   │   └── supabase.js         # Instância inicializada do Supabase Client
│   ├── pages/
│   │   ├── CalendarView.jsx    # Calendário financeiro principal
│   │   ├── DashboardView.jsx   # Dashboard com gráficos Recharts
│   │   ├── DreView.jsx         # DRE Gerencial do Mês (filtrado por competência)
│   │   ├── LandingPage.jsx     # Landing Page pública de captação e preços
│   │   ├── ListView.jsx        # Visão em tabela com filtros e busca
│   │   ├── Login.jsx           # Tela de autenticação e criação de conta (mín. 8 caracteres)
│   │   └── MobilePocket.jsx    # Experiência PWA Mobile First
│   ├── utils/
│   │   ├── boletoParser.js     # Decodificador de linhas digitáveis e códigos FEBRABAN
│   │   ├── consultorEngine.js  # Motor determinístico de consultas financeiras
│   │   ├── pdfReader.js        # Extrator local de PDF (pdfjs-dist com isEvalSupported: false)
│   │   └── voiceParser.js      # Parser heurístico de transcrição de voz
│   ├── App.jsx                 # Rotas com Code Splitting (React.lazy) e multi-domínio
│   ├── index.css               # Design System, variáveis CSS Dark/Light e reset
│   └── main.jsx                # Ponto de montagem React DOM
├── supabase/
│   └── migrations/
│       └── 20261027000000_security_hardening.sql # Migration oficial de tabelas, índices, RLS e Storage privado
├── AGENTS.md                   # Este documento de referência
├── README.md                   # Guia rápido do repositório
├── package.json
├── vercel.json                 # Rewrites SPA + Security Headers HTTP (HSTS, XFO, CSP Report-Only)
└── vite.config.js
```

---

## 5. Esquema do Banco de Dados (Supabase PostgreSQL)

> **Fonte da verdade:** [`supabase/migrations/20261027000000_security_hardening.sql`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/supabase/migrations/20261027000000_security_hardening.sql)

### Tabela `bills` (Contas a Pagar / Receber)
* `id` (`uuid`, Primary Key, default `uuid_generate_v4()`)
* `user_id` (`uuid`, Foreign Key `auth.users(id)` ON DELETE CASCADE, default `auth.uid()`, Not Null)
* `description` (`text`, Not Null, `char_length <= 255`) — Descrição ou razão social do fornecedor.
* `amount` (`numeric(12,2)`, Not Null, `amount >= 0`) — Valor nominal do título.
* `date` (`date`, Not Null) — Data de vencimento.
* `type` (`text`, check `type in ('despesa', 'receita')`) — Padrão `'despesa'`.
* `context` (`text`, check `context in ('empresarial', 'pessoal')`) — Padrão `'empresarial'`.
* `category_id` (`uuid`, Foreign Key `categories(id)` ON DELETE SET NULL, Nullable) — Validado por RLS para pertencer obrigatoriamente ao mesmo `user_id`.
* `status` (`text`, check `status in ('Pendente', 'Pago')`) — Padrão `'Pendente'`.
* `barcode` (`text`, Nullable, `char_length <= 60`) — Linha digitável ou código de barras de 47/48 dígitos.
* `file_url` (`text`, Nullable) — Caminho relativo do objeto no bucket privado `boletos` (ex: `user_id/uuid.pdf`), aberto sob demanda via URL assinada de 60s.
* `file_name` (`text`, Nullable) — Nome original do documento enviado.
* `person` (`text`, Nullable) — Responsável ou beneficiário associado.
* `created_at` (`timestamp with time zone`, default `timezone('utc', now())`)

### Tabela `categories` (Categorias de Despesa/Receita)
* `id` (`uuid`, Primary Key, default `uuid_generate_v4()`)
* `user_id` (`uuid`, Foreign Key `auth.users(id)` ON DELETE CASCADE, default `auth.uid()`, Not Null)
* `name` (`text`, Not Null, `char_length <= 100`)
* `color` (`text`, default `'#6366f1'`) — Cor hexadecimal para chips visuais.
* `context` (`text`, check `context in ('empresarial', 'pessoal')`, default `'empresarial'`)
* `created_at` (`timestamp with time zone`, default `timezone('utc', now())`)

### Índices de Performance
* `idx_categories_user` em `categories(user_id, context)`
* `idx_bills_user` em `bills(user_id, context, date)`
* `idx_bills_category` em `bills(category_id)`

---

## 6. Arquitetura de Segurança, Isolamento Multi-Tenant & Performance

1. **Row Level Security (RLS) Estrito & Validação Cruzada de Tenant:**
   * Todas as tabelas possuem RLS ativo (`SELECT`, `INSERT`, `UPDATE`, `DELETE` restritos a `auth.uid() = user_id`).
   * As políticas `bills_insert_own` e `bills_update_own` verificam via `EXISTS` que qualquer `category_id` vinculado pertence ao mesmo `auth.uid()`, impedindo referência cruzada entre inquilinos (cross-tenant IDOR).
   * Defesa em profundidade no cliente: queries no [`Layout.jsx`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/components/Layout.jsx), [`DashboardView.jsx`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/pages/DashboardView.jsx) e [`MobilePocket.jsx`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/pages/MobilePocket.jsx) incluem explicitamente `.eq('user_id', user.id)`.
2. **Armazenamento Privado de Boletos (`src/lib/storage.js`):**
   * O bucket `boletos` opera em modo privado (`public = false`), com limite de **10 MB** por arquivo e whitelist de MIME types (`application/pdf`, `image/jpeg`, `image/png`, `image/webp`).
   * As políticas em `storage.objects` exigem que o primeiro segmento do caminho (`(storage.foldername(name))[1]`) seja idêntico a `auth.uid()::text`.
   * **Nunca utilize `getPublicUrl` para boletos.** Todo upload, abertura (via `createSignedUrl` com expiração de 60 segundos) e remoção de anexo deve passar por [`src/lib/storage.js`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/lib/storage.js).
3. **Blindagem contra XSS por PDF (CVE-2024-4367) & Supply Chain:**
   * A leitura de PDFs em [`src/utils/pdfReader.js`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/utils/pdfReader.js) utiliza `pdfjs-dist` empacotado localmente (sem scripts externos de CDN) com `isEvalSupported: false` e teto de leitura de 15 páginas por documento.
4. **Cabeçalhos HTTP de Segurança (`vercel.json`):**
   * Configurados `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(self), microphone=(self), geolocation=()`, `Strict-Transport-Security` e `Content-Security-Policy-Report-Only`.
5. **Code Splitting (`src/App.jsx`):**
   * Páginas carregadas sob demanda via `React.lazy` e `Suspense`, isolando bibliotecas pesadas (como `recharts` e `pdfjs-dist`) da Landing Page pública.

---

## 7. Roadmap Comercial & Estratégia de Precificação (Execução em Produção)

> **Diretriz de Negócio (Aprovada pelo Fundador):** O produto opera no lançamento com a estratégia de **Lote de Membros Fundadores** e migrará para uma **Escada em 3 Tiers** conforme a maturação dos recursos.

### Fase Atual (Lançamento / Early Access):
* **Posicionamento:** Membro Fundador com Preço Congelado.
* **Mensal:** De ~~R$ 39,90~~ por **R$ 19,90/mês** (7 dias grátis).
* **Anual:** **R$ 190,00/ano à vista** (ou 12x de R$ 15,80/mês via Cartão ou Pix).

### Próxima Fase (Escada de 3 Tiers para Produção Madura — 6 a 12 Meses):
1. **Tier 1 — KdConta Solo (R$ 29,90/mês ou R$ 290/ano):** 1 usuário, 1 CNPJ/CPF, scanner até 40 boletos/mês, voz, calendário, DRE e mobile.
2. **Tier 2 — KdConta Pro (R$ 59,90 a R$ 69,90/mês ou R$ 590/ano):** Scanner ilimitado, **Consultor IA Conversacional**, **Alertas no WhatsApp às 08h**, contas recorrentes, exportação contábil para o contador e 2 usuários.
3. **Tier 3 — KdConta Business (R$ 119,90 a R$ 149,90/mês ou R$ 1.190/ano):** Multi-CNPJ/Multi-Empresa, até 5 usuários com níveis de permissão, login gratuito do contador e conciliação bancária OFX/Open Finance.

### Política de Grandfathering (Retenção e Up-sell):
* Quem assinou a R$ 19,90/mês mantém R$ 19,90 vitalício no plano Solo.
* Up-sell com 50% de desconto para o Plano Pro com IA (R$ 29,90/mês em vez de R$ 59,90) aumentando o ARPU sem atrito.

---

## 8. Histórico de Evolução & Changelog Técnico

* **Fase 1 — Rebranding Oficial (`FiscalZap` → `KdConta`):**
  * Nova identidade visual e verbal ("Cadê a conta?"), tipografia Plus Jakarta Sans + Inter e paleta ardósia/índigo (`src/index.css`).
  * Atualização do PWA (`manifest.json`, `sw.js`, `index.html`) e unificação na branch `main`.
* **Fase 2 — Landing Page de Alta Conversão & Estratégia de Preços:**
  * Criação da [`LandingPage.jsx`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/pages/LandingPage.jsx) fiel às funcionalidades já implementadas (Scanner de Boletos, Voz, Calendário, DRE, Modo Bolso) e Consultor IA sinalizado como *"Em Breve"*.
  * Seletor de tema Dark/Light nativo na Landing Page e seção de preços "Membro Fundador" (R$ 19,90/mês ou R$ 190/ano com 7 dias grátis).
* **Fase 3 — Auditoria de Segurança Multi-Tenant, Limpeza & Performance (Ondas 1 a 3):**
  * Remoção de 26 binários rastreados em `node_env/` e código legado morto (`src/pages/Calendar.jsx`, `src/App.css`, `src/hooks/useDevice.js`).
  * Migração do leitor de PDF de CDN externo vulnerável para `pdfjs-dist` local com `isEvalSupported: false`.
  * Criação da migration [`20261027000000_security_hardening.sql`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/supabase/migrations/20261027000000_security_hardening.sql) e do módulo [`src/lib/storage.js`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/lib/storage.js) com bucket privado e URLs assinadas de 60s.
  * Correção do cálculo do DRE ([`DreView.jsx`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/pages/DreView.jsx)) para filtrar estritamente os lançamentos do mês selecionado.
  * Implementação de Code Splitting com `React.lazy` em [`src/App.jsx`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/App.jsx) e cabeçalhos HTTP de segurança em [`vercel.json`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/vercel.json).

---

## 9. Diretrizes e Regras de Ouro para Agentes

1. **Integridade Visual & Estabilidade:** Não altere estruturas de layout consolidadas ou rotas sem solicitação explícita do usuário.
2. **Tema Dark & Light First:** Todo novo componente, modal ou card **deve** usar as variáveis CSS dinâmicas (`var(--bg-primary)`, `var(--text-primary)`, `var(--border-color)`, `var(--modal-bg)`), garantindo coerência visual imediata em ambos os temas.
3. **Segurança Multi-Tenant Inegociável:**
   * Nunca exponha o bucket `boletos` como público; use sempre [`src/lib/storage.js`](file:///c:/Users/rsf_o/OneDrive/Documentos/PROJETOS_WEB/calendario_empresarial/src/lib/storage.js) (`uploadBoletoAttachment`, `openBoletoAttachment`, `deleteBoletoAttachment`).
   * Toda nova tabela ou coluna no Supabase deve ser registrada em `supabase/migrations/` com RLS ativo e `user_id DEFAULT auth.uid()`.
4. **Escopo do Consultor IA:** O assistente conversacional inteligente está posicionado no roadmap como entrega posterior ("Em Breve"). O foco atual prioritário é usabilidade, estabilidade operacional e ferramentas de retenção (contas recorrentes, exportações contábeis, conformidade LGPD e monetização).
5. **Deploy Automático:** Todo commit na branch `main` gera deploy automático em produção no Vercel. Certifique-se de validar o build com `npm run build` antes de finalizar entregas.
