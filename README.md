<div align="center">

  <img src="public/mascote.png" alt="Mascote PlayDrop" width="200"/>

  # 🐦‍⬛ PlayDrop

  ### by Korvo Ecossistema

  **Plataforma SaaS de dropshipping de camisetas estampadas DTF.**
  Revenda sem estoque: o revendedor escolhe no catálogo, define seu preço, anuncia
  e a PlayDrop produz e envia direto ao cliente final.

  ![Next.js](https://img.shields.io/badge/Next.js-13.5-black?style=for-the-badge&logo=next.js)
  ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)
  ![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)
  ![Tailwind](https://img.shields.io/badge/TailwindCSS-3-38BDF8?style=for-the-badge&logo=tailwindcss)
  ![License](https://img.shields.io/badge/Licen%C3%A7a-Propriet%C3%A1ria-red?style=for-the-badge)

</div>

---

## 📖 Sobre o projeto

O **PlayDrop** conecta revendedores de moda a uma operação de produção e logística
sem estoque. O revendedor acessa o catálogo, copia o material de divulgação pronto
(título, descrição, ficha técnica e fotos), faz o pedido em segundos e acompanha
todo o pipeline até a entrega. O administrador controla catálogo, pedidos,
relatórios, avisos e banners em um painel exclusivo e separado.

## ✨ Funcionalidades

### 👤 Área do Revendedor
- 🛍️ **Catálogo visual** — cards com fotos, custos, preço sugerido e **lucro estimado em tempo real**
- ⚡ **Pedido Rápido** — grade de **cores × tamanhos** com quantidades, preenchimento em massa e adição ao carrinho de uma vez só
- 🛒 **Carrinho** — múltiplos produtos/variantes em um único pedido
- 📋 **Material de divulgação** — copiar título, ficha, descrição e anúncio completo + download das fotos do produto
- 📈 **Vendas e Financeiro** — histórico de pedidos, métricas por período (7/30/90 dias) e acompanhamento de lucro
- 🔔 **Central de avisos** — sininho no topo com avisos recentes e histórico
- 🖼️ **Banners** — campanhas na dashboard e na sidebar

### 🛡️ Área do Administrador (painel 100% separado)
- 📊 **Dashboard de operação** — pipeline de pedidos, catálogo resumido e atalhos de gestão
- 📦 **Gestão de pedidos** — mudança de status (novo → produção → enviado → entregue)
- 📉 **Relatórios** — vendas de hoje, 7, 30 e 90 dias + produtos mais vendidos + exportação CSV
- 📢 **Avisos & Banners** — criação e publicação de comunicados e campanhas visuais
- ⚙️ **Configurações** — catálogo, custos, cores e tamanhos

### 🔐 Segurança
- Autenticação por sessão com **Supabase Auth**
- **Row Level Security (RLS)** no banco de dados
- Redirecionamento automático por perfil: admin e revendedor jamais se cruzam
- Área admin protegida por verificação de `role`

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Front-end | Next.js 13 (App Router) + React |
| Estilo | Tailwind CSS + Lucide Icons |
| Banco & Auth | Supabase (PostgreSQL + RLS + Storage) |
| Deploy | Vercel |
| Versionamento | Git & GitHub |

## 🚀 Rodando o projeto

```bash
# Clone o repositório (ajuste o nome do repo)
git clone https://github.com/SEU-USUARIO/SEU-REPO.git
cd SEU-REPO

# Instale as dependências
npm install

# Configure as variáveis de ambiente (.env.local)
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Rode em desenvolvimento
npm run dev
