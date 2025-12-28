# 🔧 Como Corrigir o Erro de Root Directory no Render

## ❌ Erro Atual
```
npm error path /opt/render/project/src/package.json
npm error enoent Could not read package.json
```

## ✅ Solução: Configurar Root Directory no Dashboard

O Render não está reconhecendo o `rootDir` do `render.yaml`. Você precisa configurar manualmente no dashboard.

### Passo a Passo Detalhado

#### 1. Acesse o Dashboard do Render
- Vá para: **https://dashboard.render.com**
- Faça login na sua conta
- Clique no serviço **`ptpro-backend`** (ou o nome que você deu)

#### 2. Vá para Settings (Configurações)
- No menu lateral esquerdo, clique em **"Settings"**
- Role até a seção **"Build & Deploy"**

#### 3. Configure o Root Directory ⚠️ CRÍTICO
Na seção **"Build & Deploy"**, encontre o campo:

**Root Directory:**
```
Backend
```

**IMPORTANTE:**
- ✅ Digite exatamente: `Backend` (com B maiúsculo)
- ❌ NÃO use: `/Backend` ou `Backend/` ou `./Backend`
- ✅ Sem espaços antes ou depois

#### 4. Configure os Comandos de Build e Start
Na mesma seção **"Build & Deploy"**:

**Build Command:**
```
npm install
```

**Start Command:**
```
npm start
```

**Branch:**
```
backend
```
(ou `main` se estiver usando o branch main)

#### 5. Salvar e Fazer Deploy
- Clique em **"Save Changes"** no final da página
- O Render fará um novo deploy automaticamente
- Aguarde alguns minutos para o build completar

### 📸 Onde Encontrar no Dashboard

```
Dashboard → Seu Serviço → Settings → Build & Deploy
├── Root Directory: Backend
├── Build Command: npm install
├── Start Command: npm start
└── Branch: backend
```

### ✅ Verificar se Funcionou

Após salvar, vá em **"Logs"** e você deve ver:
- ✅ `npm install` executando com sucesso
- ✅ `Server running at http://0.0.0.0:XXXX`
- ✅ Sem erros de `package.json not found`

### 🔄 Se Ainda Não Funcionar

1. **Limpe o cache:**
   - Em Settings → Build & Deploy
   - Clique em **"Clear build cache"**
   - Faça um novo deploy

2. **Verifique o nome da pasta:**
   - Certifique-se de que a pasta se chama exatamente `Backend` (com B maiúsculo)
   - No GitHub, verifique: https://github.com/inovemais/PTPro/tree/backend

3. **Verifique o branch:**
   - Certifique-se de que o branch está correto
   - O Render deve estar apontando para o branch `backend`

4. **Recrie o serviço (última opção):**
   - Delete o serviço atual
   - Crie um novo serviço via **"New" → "Blueprint"**
   - Conecte o repositório GitHub
   - O Render detectará automaticamente o `render.yaml`

### 📝 Checklist Rápido

- [ ] Root Directory = `Backend` (sem barra, sem ponto)
- [ ] Build Command = `npm install`
- [ ] Start Command = `npm start`
- [ ] Branch = `backend` (ou `main`)
- [ ] Salvei as alterações
- [ ] Limpei o cache (se necessário)
- [ ] Verifiquei os logs após o deploy

### 🆘 Ainda com Problemas?

Se após seguir todos os passos ainda não funcionar:
1. Verifique os logs completos no Render
2. Certifique-se de que o arquivo `Backend/package.json` existe no GitHub
3. Verifique se o branch está correto
4. Tente recriar o serviço via Blueprint

