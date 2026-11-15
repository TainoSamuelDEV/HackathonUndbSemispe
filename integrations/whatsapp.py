"""Ponto de extensão futuro. Não implementado nesta versão, conforme escopo.

O WhatsApp deve usar a API oficial da Meta via provedor autorizado e webhooks
validados. Não usar automações não autorizadas ou contas pessoais.

Fluxo futuro:
1. WhatsApp Business -> webhook autenticado -> serviço conversacional
2. Identificação com consentimento -> vinculação ao usuário da API
3. Coleta guiada do perfil -> confirmação de cada campo
4. Consulta às vagas e regras de compatibilidade já existentes
5. Registro da candidatura após consentimento explícito
6. Recomendação de cursos e solicitação de novas formações
7. Opt-out, retenção mínima, registro de consentimento e auditoria LGPD

Este módulo deliberadamente NÃO envia mensagens, não armazena tokens e não
faz chamadas a serviços externos.
"""
