# FAROL — Formação, Ações e Rede de Oportunidades Locais

Sistema único desenvolvido para o **Hackathon São Luís do Futuro (UNDB / SEMISPE)** — **Desafio 04**, conectando talentos, empresas/startups e capacitação gratuita da SEMISPE (com foco inicial na região Itaqui-Bacanga) por meio de um portal web unificado e da **IA FAROL** via WhatsApp.

---

## 🎯 Desafio 04

> **"Dificuldade de Conexão entre Talentos, Startups e Empresas"**
> *"Como conectar empresas, startups e talentos de forma inteligente, facilitando parcerias, contratações e novas oportunidades de negócios?"*

---

## 🛠️ Stack Tecnológica

* **Aplicação Unificada:** **Next.js (App Router)** + **TypeScript (Strict)** — camadas isoladas para Frontend, Backend/Domínio e Orquestração da IA.
* **Banco de Dados:** **PostgreSQL (Supabase Self-Hosted)** — fonte única da verdade para portal web e WhatsApp.
* **WhatsApp & IA:** **Evolution API** + **Agente FAROL** (LLM desacoplada + motor determinístico de compatibilidade 70/30).
* **Identidade Visual:** Design System baseado no Brandbook do **Parque Tecnológico de São Luís (SEMISPE)**.

---

## 📚 Documentação de Engenharia do Projeto (FAROL)

1. [01. Arquitetura do Sistema, Stack e Estrutura Modular](./docs/01-arquitetura-e-stack.md)
2. [02. Regras de Negócio, Motor de Match e Comportamento da IA FAROL](./docs/02-regras-de-negocio-e-ia.md)
3. [03. Modelagem do Banco de Dados (PostgreSQL / Supabase Self-Hosted)](./docs/03-modelagem-banco-dados.md)
4. [04. Contrato da API REST, Endpoints para IA FAROL e Evolution API](./docs/04-contrato-api-e-integracao-ia.md)
5. [05. Mapeamento de Telas, Design System e Jornadas](./docs/05-mapeamento-telas-e-jornadas.md)
6. [Script SQL Oficial (Supabase / PostgreSQL)](./database/schema.sql)

### Documentos de Referência / Origem
* [Contexto do Hackathon](./docs/contexto/hackathon.md) · [PDF Oficial do Desafio](./docs/contexto/Desafio%204.pdf)
* [Mapeamento Inicial de Frontend](./docs/contexto/GO_Sao_Luis_Mapeamento_Frontend.md)
* [Escopo Original de Comportamento da IA](./docs/contexto/SLZ_Emprega_Comportamento_IA_WhatsApp.pdf)
