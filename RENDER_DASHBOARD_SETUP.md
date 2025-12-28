# Configuração Manual no Dashboard do Render

## ⚠️ Problema: Root Directory não reconhecido

Se o Render está dando erro `Could not read package.json`, você precisa configurar o **Root Directory** manualmente no dashboard.

## Passo a Passo para Configurar no Dashboard

### 1. Acesse o Dashboard do Render
- Vá para: https://dashboard.render.com
- Faça login na sua conta
- Selecione o serviço `ptpro-backend` (ou o nome que você deu)

### 2. Vá para Settings (Configurações)
- No menu lateral esquerdo, clique em **"Settings"**

### 3. Configure o Root Directory
- Role até a seção **"Build & Deploy"**
- Encontre o campo **"Root Directory"**
- Digite: `Backend` (sem barra no final)
- Clique em **"Save Changes"**

### 4. Configure os Comandos de Build e Start
Na mesma seção **"Build & Deploy"**, configure:

**Build Command:**
```
npm install
```

**Start Command:**
```
npm start
```

### 5. Configure as Variáveis de Ambiente
- Vá para **"Environment"** no menu lateral
- Adicione as seguintes variáveis:

| Key | Value | Obrigatório |
|-----|-------|--------------|
| `MONGODB_URI` | `mongodb+srv://admin:admin123@cluster0.4knxo.mongodb.net/ptpro?retryWrites=true&w=majority` | ✅ Sim |
| `SECRET` | [Gere uma chave forte - veja abaixo] | ✅ Sim |
| `FRONTEND_URL` | URL do seu frontend (ex: `https://pwa-app-swart-xi.vercel.app`) | ⚠️ Recomendado |
| `NODE_ENV` | `production` | ✅ Sim |
| `RENDER` | `true` | ✅ Sim |
| `EXPIRES_PASSWORD` | `86400` | Opcional |
| `SALT_ROUNDS` | `10` | Opcional |
| `HOSTNAME` | `0.0.0.0` | Opcional |

### 6. Gerar Chave SECRET
Execute no terminal:
```bash
openssl rand -base64 32
```

Ou use: https://randomkeygen.com/

### 7. Salvar e Fazer Deploy
- Após configurar tudo, clique em **"Save Changes"**
- Vá para **"Events"** ou **"Logs"** para ver o deploy
- O Render fará um novo deploy automaticamente

## Resumo das Configurações

```
Root Directory: Backend
Build Command: npm install
Start Command: npm start
```

## Verificar se Funcionou

Após o deploy, verifique os logs. Você deve ver:
- ✅ `npm install` executando com sucesso
- ✅ `Server running at http://0.0.0.0:XXXX`
- ✅ Conexão com MongoDB bem-sucedida

## Se Ainda Não Funcionar

1. **Verifique se o branch está correto:**
   - Em Settings → Build & Deploy
   - Branch: `backend` (ou `main`)

2. **Limpe o cache:**
   - Em Settings → Build & Deploy
   - Clique em "Clear build cache"
   - Faça um novo deploy

3. **Verifique os logs completos:**
   - Vá em "Logs" para ver o erro completo
   - Procure por mensagens de erro específicas

## Alternativa: Criar Serviço via Blueprint

Se preferir usar o `render.yaml` automaticamente:

1. No dashboard do Render, clique em **"New"** → **"Blueprint"**
2. Conecte o repositório GitHub
3. O Render detectará automaticamente o `render.yaml`
4. Configure apenas as variáveis de ambiente sensíveis no dashboard

