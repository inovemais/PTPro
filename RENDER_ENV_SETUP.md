# Guia de Configuração de Variáveis de Ambiente no Render

## Variáveis Obrigatórias

### 1. MONGODB_URI
**Descrição:** String de conexão do MongoDB (MongoDB Atlas ou local)  
**Valor:** `mongodb+srv://admin:admin123@cluster0.4knxo.mongodb.net/ptpro?retryWrites=true&w=majority`  
**Importante:** ⚠️ Use a sua própria string de conexão do MongoDB Atlas

### 2. SECRET
**Descrição:** Chave secreta para assinar tokens JWT  
**Valor:** Gere uma string aleatória forte (ex: use `openssl rand -base64 32`)  
**Exemplo:** `sua-chave-secreta-super-forte-aqui-123456789`

### 3. RENDER
**Descrição:** Indica que está rodando no Render (já configurado no render.yaml)  
**Valor:** `true`

### 4. NODE_ENV
**Descrição:** Ambiente de execução (já configurado no render.yaml)  
**Valor:** `production`

## Variáveis Opcionais (mas recomendadas)

### 5. FRONTEND_URL
**Descrição:** URL do frontend para configuração de CORS  
**Valor:** URL do seu frontend (ex: `https://seu-frontend.vercel.app`)  
**Exemplo:** `https://pwa-app-swart-xi.vercel.app`

### 6. EXPIRES_PASSWORD
**Descrição:** Tempo de expiração do token JWT em segundos  
**Valor padrão:** `86400` (24 horas)  
**Já configurado no render.yaml**

### 7. SALT_ROUNDS
**Descrição:** Número de rounds para hash de senhas (bcrypt)  
**Valor padrão:** `10`  
**Já configurado no render.yaml**

### 8. HOSTNAME
**Descrição:** Hostname do servidor  
**Valor padrão:** `0.0.0.0` (necessário no Render)  
**Já configurado no render.yaml**

### 9. FORCE_SECURE_COOKIE (Opcional)
**Descrição:** Forçar cookies seguros mesmo em desenvolvimento  
**Valor:** `true` ou deixe vazio

## Como Configurar no Render

### Método 1: Via Dashboard do Render (Recomendado)

1. **Acesse o Dashboard do Render:**
   - Vá para https://dashboard.render.com
   - Selecione o seu serviço `ptpro-backend`

2. **Vá para Environment:**
   - No menu lateral, clique em **"Environment"**

3. **Adicione as variáveis:**
   - Clique em **"Add Environment Variable"**
   - Adicione cada variável uma por uma:

   ```
   Key: MONGODB_URI
   Value: mongodb+srv://admin:admin123@cluster0.4knxo.mongodb.net/ptpro?retryWrites=true&w=majority
   ```

   ```
   Key: SECRET
   Value: [gere uma chave secreta forte]
   ```

   ```
   Key: FRONTEND_URL
   Value: https://seu-frontend.vercel.app
   ```

4. **Salve e faça redeploy:**
   - Após adicionar todas as variáveis, clique em **"Save Changes"**
   - O Render fará um redeploy automático

### Método 2: Via render.yaml (Já configurado parcialmente)

O arquivo `render.yaml` já tem algumas variáveis configuradas. Você pode adicionar mais lá, mas variáveis sensíveis (como SECRET e MONGODB_URI) devem ser configuradas no dashboard para segurança.

## Gerar uma Chave Secreta Segura

Execute no terminal:
```bash
openssl rand -base64 32
```

Ou use um gerador online: https://randomkeygen.com/

## Checklist de Configuração

- [ ] MONGODB_URI configurada
- [ ] SECRET configurada (chave forte gerada)
- [ ] FRONTEND_URL configurada (se tiver frontend)
- [ ] RENDER = true (já no render.yaml)
- [ ] NODE_ENV = production (já no render.yaml)
- [ ] EXPIRES_PASSWORD = 86400 (já no render.yaml)
- [ ] SALT_ROUNDS = 10 (já no render.yaml)
- [ ] HOSTNAME = 0.0.0.0 (já no render.yaml)

## Verificar se está funcionando

Após configurar, verifique os logs do deploy no Render. Você deve ver:
- ✅ "Server running at http://0.0.0.0:XXXX"
- ✅ Conexão com MongoDB bem-sucedida
- ✅ Sem erros de variáveis de ambiente

## Notas Importantes

⚠️ **NUNCA** commite o arquivo `.env` no Git!  
✅ Use o `.env.example` como template  
✅ Variáveis sensíveis devem ser configuradas apenas no dashboard do Render  
✅ O Render define automaticamente a variável `PORT`

