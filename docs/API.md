# API e pontos de alteração

Com o sistema iniciado, abra http://localhost:8000/docs para explorar o OpenAPI interativo do FastAPI.

## Endpoints principais

| Método | Endpoint | Uso | Perfil |
|---|---|---|---|
| GET | `/api/bootstrap` | Estatísticas e sessão atual | Público |
| POST | `/api/auth/register` | Cadastro | Público |
| POST | `/api/auth/login` | Login | Público |
| POST | `/api/auth/logout` | Finalizar sessão | Autenticado |
| GET/PUT | `/api/profile` | Currículo e perfil | Trabalhador |
| GET | `/api/jobs` | Vagas, filtros | Público |
| GET | `/api/jobs/{id}` | Detalhes, match individual | Público/autenticado |
| GET | `/api/matches` | Vagas por compatibilidade | Trabalhador |
| POST | `/api/applications` | Candidatura | Trabalhador |
| GET | `/api/applications/my` | Acompanhamento | Trabalhador |
| GET | `/api/courses` | Catálogo | Público |
| GET | `/api/courses/{id}` | Detalhes | Público |
| POST | `/api/courses/{id}/enroll` | Inscrição | Trabalhador |
| GET | `/api/courses/my` | Minhas inscrições | Trabalhador |
| POST | `/api/course-requests` | Pedido de capacitação | Trabalhador |
| GET | `/api/course-requests/my` | Minhas sugestões | Trabalhador |
| GET/POST | `/api/services` | Vitrine de serviços | Público / Trabalhador |
| POST | `/api/services/{id}/inquire` | Solicitar profissional | Autenticado |
| GET | `/api/company/overview` | Painel e candidaturas | Empresa |
| POST | `/api/company/jobs` | Criar vaga | Empresa validada |
| PUT | `/api/company/jobs/{id}` | Editar vaga | Empresa proprietária |
| GET | `/api/company/candidates/{id}` | Perfil de candidato inscrito | Empresa proprietária |
| PATCH | `/api/company/applications/{id}` | Atualizar seleção e feedback | Empresa proprietária |
| GET | `/api/admin/overview` | Indicadores e pedidos de cursos | SEMISPE |
| POST | `/api/admin/courses` | Cadastrar novo curso | SEMISPE |
| PATCH | `/api/admin/requests/{id}` | Atualizar demanda | SEMISPE |
| PATCH | `/api/admin/companies/{id}` | Validar empresa | SEMISPE |

**Autenticação:** `Authorization: Bearer TOKEN`. Corpo JSON.

## Contas demonstrativas

- Trabalhador: `morador@demo.slz` / `Demo123!`
- Empresa: `empresa@demo.slz` / `Demo123!`
- SEMISPE: `semispe@demo.slz` / `Demo123!`

Não usar essas contas em produção. Remova dados de teste, troque credenciais e implante controles adicionais antes de qualquer piloto real.

## Score de matching

`score = 100 * (0,7 * skills + 0,2 * escolaridade + 0,1 * experiência)`.

- `skills`: proporção de requisitos presentes no perfil, com normalização de caixa e acentos.
- `escolaridade`: 1 se cumpre nível mínimo, 0 caso contrário.
- `experiência`: proporção de meses atendidos, limitada a 1.

A fórmula serve para demonstração, requer validação com recrutadores e não deve ser utilizada para recusar vagas automaticamente.
