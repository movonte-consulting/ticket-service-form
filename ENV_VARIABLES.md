# Required Environment Variables

## Server Configuration
```env
PORT=3000
NODE_ENV=development
```

## CORS Configuration
```env
ALLOWED_ORIGINS=https://chat-grvb.onrender.com,https://movonte.com,https://movonte-consulting.github.io,http://localhost:3000
```

## Jira Configuration (required for creating tickets)
```env
JIRA_BASE_URL=https://movonte.atlassian.net
JIRA_PROJECT_KEY=IT
JIRA_EMAIL=isaact@movonte.com
JIRA_API_TOKEN=ATATT3xFfGF0yqHHIK8TA_TA39s4MV5FGmf3EwHVDIIuIS4iedLZAoJi3prFyT1zqPVg6sRjVM6qmS_7qCMQwmHnnn7D75jaDIPHNhJ2VaZzs4o_lp0ceO57lNIET7_1xJV7Ul69RDxGE7Qf1CpUi4PzJ-fN4lbEqCv-cp-LQUM8lYy0WOZgsks=0E39EBDA
```

## Jira Custom Fields (correct IDs found)
```env
JIRA_FIELD_EMAIL=customfield_10044
JIRA_FIELD_PHONE=customfield_10088
JIRA_FIELD_FIRST_NAME=customfield_10103
JIRA_FIELD_LAST_NAME=customfield_10104
JIRA_FIELD_CONTACT=customfield_10288
JIRA_FIELD_CUSTOMER=customfield_10155
JIRA_FIELD_ORGANIZATION=customfield_10002
```

## OpenAI Configuration (optional, only for health check)
```env
OPENAI_API_KEY=your-openai-api-key
OPENAI_ASSISTANT_ID=your-assistant-id
```

## SMTP Configuration (optional, only for health check)
```env
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_HOST=your-smtp-host
```

## Minimum variables to function
```env
PORT=3000
NODE_ENV=development
JIRA_BASE_URL=https://movonte.atlassian.net
JIRA_PROJECT_KEY=CONTACT
JIRA_EMAIL=your-email@movonte.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_FIELD_EMAIL=customfield_10044
JIRA_FIELD_PHONE=customfield_10088
JIRA_FIELD_FIRST_NAME=customfield_10103
JIRA_FIELD_LAST_NAME=customfield_10104
JIRA_FIELD_CONTACT=customfield_10288
JIRA_FIELD_CUSTOMER=customfield_10155
JIRA_FIELD_ORGANIZATION=customfield_10002
```
