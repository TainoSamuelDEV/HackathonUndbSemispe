# 04. Contrato da API REST, Endpoints para IA FAROL e Evolution API

> **Projeto:** **FAROL** — *Formação, Ações e Rede de Oportunidades Locais*  
> **Arquitetura:** Next.js App Router (`src/app/api/**`) + Camada de Aplicação (`src/server/application/`)

Este documento define o contrato oficial da API REST do **FAROL**, contemplando os fluxos do portal web (Público, Candidato, Empresa, SEMISPE), os **endpoints dedicados de consulta e ação da IA FAROL (`/api/ai/*`)** e o receptor de webhooks da **Evolution API**.

---

## 1. Convenções Gerais da API

* **Base URL:** `/api`
* **Autenticação Portal:** JWT em cookie `HttpOnly` (ou header `Authorization: Bearer <token>`).
* **Autenticação IA / Interna (`/api/ai/*`):** Header `x-ai-api-key: <AI_INTERNAL_API_KEY>` (uso exclusivo do orquestrador servidor-para-servidor).
* **Autenticação Webhook Evolution:** Header `apikey` / segredo validado contra `EVOLUTION_WEBHOOK_SECRET`.
* **Envelope de Sucesso:**
  ```json
  { "data": {}, "meta": { "page": 1, "limit": 20, "total": 42 } }
  ```
* **Envelope de Erro:**
  ```json
  { "error": { "code": "REGRA_NEGOCIO", "message": "Mensagem clara para o usuário.", "details": {} } }
  ```

---

## 2. Endpoints do Portal Web

### 2.1 Autenticação e Vinculação WhatsApp
| Método | Rota | Acesso | Descrição |
| :---: | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Público | Autentica por `email` e `senha`. |
| `POST` | `/api/auth/cadastro/pessoa` | Público | Cria `Usuario` (`CANDIDATO`) + `Candidato` (sem exigir CPF). |
| `POST` | `/api/auth/cadastro/empresa` | Público | Cria `Usuario` (`EMPRESA`) + `Empresa` com validação básica de CNPJ/MEI. |
| `GET` | `/api/auth/me` | Autenticado | Retorna dados da sessão, papel e status de vinculação WhatsApp. |
| `POST` | `/api/whatsapp/vincular/solicitar` | `CANDIDATO` | Gera código temporário (`vinculos_whatsapp_tokens`) para vincular conta ao WhatsApp sem senha no chat. |
| `POST` | `/api/whatsapp/vincular/confirmar` | Público/IA | Confirma o código enviado pelo usuário no WhatsApp e vincula `telefone_whatsapp`. |

### 2.2 Vagas, Match e Candidaturas
| Método | Rota | Acesso | Descrição |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/vagas` | Público | Lista vagas `PUBLICADA` com filtros (`busca`, `bairro`, `modalidade`, `area`, `escolaridade`, `pcd`). **Nunca retorna score.** |
| `GET` | `/api/vagas/[id]` | Público | Detalhes da vaga (requisitos obrigatórios/desejáveis, origem, `seloSimulado`). |
| `GET` | `/api/vagas/[id]/match` | `CANDIDATO` | Executa motor determinístico **70/30** para o candidato logado. Retorna `percentual`, `atendidos[]`, `naoIdentificados[]` e `obrigatoriosPendentes[]`. |
| `POST` | `/api/vagas/[id]/candidatar` | `CANDIDATO` | Registra candidatura única (`origem_canal: 'WEB'`), cria 1º evento em `candidatura_eventos`. |
| `GET` | `/api/candidato/candidaturas` | `CANDIDATO` | Lista candidaturas próprias com linha do tempo de eventos. |

### 2.3 Currículo Estruturado (Candidato)
| Método | Rota | Acesso | Descrição |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/candidato/curriculo` | `CANDIDATO` | Retorna perfil estruturado completo (objetivo, experiências, formações, competências, arquivos). |
| `PUT` | `/api/candidato/curriculo` | `CANDIDATO` | Atualiza o perfil estruturado (fonte oficial do match). |
| `POST` | `/api/candidato/curriculo/extrair` | `CANDIDATO` | Recebe PDF/imagem, extrai dados via LLM e retorna prévia para confirmação (não salva automaticamente). |
| `POST` | `/api/candidato/curriculo/pdf` | `CANDIDATO` | Gera o PDF oficial derivado do perfil estruturado e salva em `curriculos_arquivos`. |

### 2.4 Cursos, Turmas e Pedidos
| Método | Rota | Acesso | Descrição |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/cursos` | Público | Catálogo de cursos (`PROGRAMADO` com turmas abertas e `SOB_DEMANDA`). |
| `GET` | `/api/cursos/[id]` | Público | Detalhe do curso e suas turmas programadas. |
| `POST` | `/api/cursos/[id]/solicitar-inscricao` | `CANDIDATO` | Solicita inscrição em turma programada (`AGUARDANDO_CONFIRMACAO`). |
| `POST` | `/api/cursos/pedidos` | `CANDIDATO` | Registra interesse em curso sob demanda ou pedido de novo tema (`pedidos_cursos`). |
| `GET` | `/api/candidato/cursos` | `CANDIDATO` | Lista inscrições em turmas (frequência/certificado) e pedidos sob demanda. |

### 2.5 Painel da Empresa (`/api/empresa/*`)
| Método | Rota | Acesso | Descrição |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/empresa/dashboard` | `EMPRESA` | Contadores exclusivos da organização (vagas ativas, encerradas, candidaturas recebidas). |
| `GET` | `/api/empresa/vagas` | `EMPRESA` | Lista vagas da própria empresa. |
| `POST` | `/api/empresa/vagas` | `EMPRESA` | Cria vaga com requisitos obrigatórios e desejáveis estruturados. |
| `PATCH` | `/api/empresa/vagas/[id]` | `EMPRESA` | Edita ou encerra vaga da própria empresa. |
| `GET` | `/api/empresa/vagas/[id]/candidatos` | `EMPRESA` | Lista inscritos na vaga da empresa. **Regra rígida: omite `score_calculado` e histórico de outras empresas.** |
| `PATCH` | `/api/empresa/candidaturas/[id]/status` | `EMPRESA` | Avança etapa permitida (`EM_ANALISE`, `ENTREVISTA`, `CONTRATADO`, `NAO_APROVADO`) gravando `candidatura_eventos`. |
| `GET` | `/api/empresa/servicos` | `EMPRESA` | Diretório de profissionais filtrável por categoria/bairro (`visivel_servicos = true` obrigatório). |

### 2.6 Painel Administrativo SEMISPE (`/api/admin/*`)
| Método | Rota | Acesso | Descrição |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | `ADMIN_SEMISPE` | Indicadores consolidados do programa (cadastros, vagas, candidaturas, turmas, demandas). |
| `GET` | `/api/admin/empresas` | `ADMIN_SEMISPE` | Listagem e gestão cadastral de empresas. |
| `GET` | `/api/admin/candidatos` | `ADMIN_SEMISPE` | Listagem gerencial de candidatos (com proteção LGPD). |
| `GET` | `/api/admin/vagas` | `ADMIN_SEMISPE` | Monitoramento global de vagas. |
| `POST` | `/api/admin/cursos` | `ADMIN_SEMISPE` | Cadastra curso (`PROGRAMADO` ou `SOB_DEMANDA`) e turmas. |
| `PATCH` | `/api/admin/turmas/[id]/inscricoes/[inscricaoId]` | `ADMIN_SEMISPE` | Confirma/recusa inscrição, atualiza frequência, conclusão e URL de certificado. |
| `GET` | `/api/admin/pedidos-cursos/ranking` | `ADMIN_SEMISPE` | Consulta `vw_ranking_pedidos_cursos` (demandas do portal + WhatsApp). |
| `GET` | `/api/admin/atendimentos-whatsapp` | `ADMIN_SEMISPE` | Fila de conversas em estado `ATENDIMENTO_HUMANO` aguardando equipe SEMISPE. |

---

## 3. API Dedicada para Consulta e Ação da IA FAROL (`/api/ai/*`)

Para que a IA FAROL consulte o sistema com rapidez, baixo consumo de tokens e zero alucinação, todos os endpoints `/api/ai/*` retornam **payloads compactos (máximo 3 itens por lista)** e já trazem textos estruturados prontos para explicação.

| Método | Rota | Finalidade para a IA FAROL |
| :---: | :--- | :--- |
| `GET` | `/api/ai/contexto/[telefone]` | Busca ou inicializa `conversas_whatsapp`, retorna `estado_atual`, `contexto_json`, `consentimento_lgpd` e resumo do candidato vinculado. |
| `POST` | `/api/ai/consentimento` | Registra aceite ou recusa LGPD (`consentimento_lgpd`, `consentimento_em`) vinculado ao telefone/candidato. |
| `PATCH` | `/api/ai/candidatos/[id]/perfil` | Grava dados confirmados na triagem/currículo (nome, bairro, escolaridade, experiências, competências, área de interesse). **Rejeita campos sensíveis como CPF/saúde.** |
| `GET` | `/api/ai/vagas/match` | Parâmetros: `candidatoId`, `area`, `limit=3`. Executa motor 70/30 e devolve top 3 vagas compatíveis com `atende[]`, `falta[]`, `origemUrl` e `seloSimulado`. |
| `POST` | `/api/ai/candidaturas` | Registra candidatura (`origem_canal: 'WHATSAPP'`) após confirmação explícita do cidadão. |
| `GET` | `/api/ai/candidaturas` | Parâmetro: `candidatoId`. Retorna status atual das candidaturas e motivos de não aprovação (para feedback construtivo). |
| `GET` | `/api/ai/cursos/recomendados` | Parâmetros: `lacunas[]`, `area`, `limit=3`. Filtra lista oficial de cursos gratuitos da SEMISPE que cobrem as lacunas. |
| `POST` | `/api/ai/cursos/pedidos` | Registra pedido de curso inexistente (`tema_desejado`, `motivo`, `turno_preferido`, `origem_canal: 'WHATSAPP'`). |
| `POST` | `/api/ai/atendimento-humano` | Marca `atendimento_humano = true` e muda estado para `ATENDIMENTO_HUMANO` no painel SEMISPE. |
| `DELETE` | `/api/ai/candidatos/[id]/dados` | Aciona o fluxo de exclusão de dados solicitado pelo cidadão (LGPD). |

### Exemplo de Resposta Enxuta para IA (`GET /api/ai/vagas/match?candidatoId=...&limit=3`)

```json
{
  "data": {
    "vagas": [
      {
        "vagaId": "e9a1c3f0-...",
        "titulo": "Ajudante de Manutenção",
        "empresa": "Empresa X",
        "bairro": "Itaqui-Bacanga",
        "score": 82,
        "atende": ["Ensino Médio completo", "Experiência em oficina"],
        "falta": [
          { "item": "Curso de NR-12", "tipo": "CERTIFICACAO", "obrigatorio": false }
        ],
        "origemTipo": "INTERNA",
        "origemUrl": "https://farol.slz.br/vagas/e9a1c3f0",
        "seloSimulado": true
      }
    ],
    "totalDisponiveis": 5
  }
}
```

---

## 4. Integração Evolution API (`POST /api/webhooks/evolution`)

Fluxo oficial de recebimento e resposta de mensagens no WhatsApp:

1. **Recebimento:** A Evolution API envia evento `messages.upsert` para `POST /api/webhooks/evolution`.
2. **Validação:** O handler valida o segredo do webhook, ignora mensagens enviadas pelo próprio bot (`fromMe: true`) e normaliza o telefone (`5598...`).
3. **Tratamento de Mídia:**
   * **Áudio (`audioMessage`):** Baixa a mídia via endpoint da Evolution API, envia para transcrição e aciona a regra de **confirmação antes de gravar**.
   * **Documento / Imagem (`documentMessage` / `imageMessage`):** Baixa o currículo enviado, extrai os campos via LLM e devolve resumo curto para confirmação.
4. **Orquestração:** O `FarolOrchestrator` (`src/server/ai/`) carrega o estado da conversa, invoca a LLM com as ferramentas mapeadas para `/api/ai/*`, aplica os guardrails (máx 4 linhas, 1 pergunta por vez, sem CPF/promessas) e salva o novo estado.
5. **Envio:** O `EvolutionClient` envia a resposta via `POST /message/sendText/{instance}` (ou `sendMedia` para enviar o PDF do currículo gerado).
