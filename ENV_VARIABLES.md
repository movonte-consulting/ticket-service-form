# Variables de Entorno Requeridas

## Configuración del servidor
```env
PORT=3000
NODE_ENV=development
```

## Configuración CORS
```env
ALLOWED_ORIGINS=https://chat-grvb.onrender.com,https://movonte.com,https://movonte-consulting.github.io,http://localhost:3000
```

## Configuración de Jira (requeridas para crear tickets)
```env
JIRA_BASE_URL=https://movonte.atlassian.net
JIRA_PROJECT_KEY=IT
JIRA_EMAIL=isaact@movonte.com
JIRA_API_TOKEN=ATATT3xFfGF0yqHHIK8TA_TA39s4MV5FGmf3EwHVDIIuIS4iedLZAoJi3prFyT1zqPVg6sRjVM6qmS_7qCMQwmHnnn7D75jaDIPHNhJ2VaZzs4o_lp0ceO57lNIET7_1xJV7Ul69RDxGE7Qf1CpUi4PzJ-fN4lbEqCv-cp-LQUM8lYy0WOZgsks=0E39EBDA
```

## Campos personalizados de Jira (IDs correctos encontrados)
```env
JIRA_FIELD_EMAIL=customfield_10044
JIRA_FIELD_PHONE=customfield_10088
JIRA_FIELD_FIRST_NAME=customfield_10103
JIRA_FIELD_LAST_NAME=customfield_10104
JIRA_FIELD_CONTACT=customfield_10288
JIRA_FIELD_CUSTOMER=customfield_10155
JIRA_FIELD_ORGANIZATION=customfield_10002
```

## Configuración de OpenAI (opcional, solo para health check)
```env
OPENAI_API_KEY=tu-openai-api-key
OPENAI_ASSISTANT_ID=tu-assistant-id
```

## Configuración de SMTP (opcional, solo para health check)
```env
SMTP_USER=tu-smtp-user
SMTP_PASS=tu-smtp-password
SMTP_HOST=tu-smtp-host
```

## Variables mínimas para funcionar
```env
PORT=3000
NODE_ENV=development
JIRA_BASE_URL=https://movonte.atlassian.net
JIRA_PROJECT_KEY=CONTACT
JIRA_EMAIL=tu-email@movonte.com
JIRA_API_TOKEN=tu-api-token-de-jira
JIRA_FIELD_EMAIL=customfield_10044
JIRA_FIELD_PHONE=customfield_10088
JIRA_FIELD_FIRST_NAME=customfield_10103
JIRA_FIELD_LAST_NAME=customfield_10104
JIRA_FIELD_CONTACT=customfield_10288
JIRA_FIELD_CUSTOMER=customfield_10155
JIRA_FIELD_ORGANIZATION=customfield_10002
```
