# Checklist de Configuração do Backend no Render

## ✅ Verificações Realizadas no Código

### 1. ✅ Package.json
- **Script de start**: `"start": "node index.js"` ✓ (correto para produção)
- **Script de dev**: `"dev": "nodemon index.js"` ✓ (correto para desenvolvimento)
- **Nodemon**: Movido para `devDependencies` ✓

### 2. ✅ Index.js
- **Dotenv**: Carregado no início ✓
- **Porta**: Usa `process.env.PORT` (Render define automaticamente) ✓
- **Hostname**: Detecta Render e usa `0.0.0.0` ✓
- **MongoDB**: Agora suporta tanto `MONGODB_URI` quanto `MONGO_URI` ✓
- **CORS**: Configurado com origens permitidas ✓
- **Socket.IO**: Configurado com CORS ✓

### 3. ✅ Config.js
- **Variáveis de ambiente**: Todas com fallbacks adequados ✓
- **MongoDB URI**: Suporta `MONGODB_URI` ✓

### 4. ✅ Render.yaml
- **Root Directory**: `Backend` ✓
- **Build Command**: `cd Backend && npm install` ✓
- **Start Command**: `cd Backend && npm start` ✓
- **Variáveis de ambiente**: Listadas corretamente ✓

## 📋 Checklist para Configurar no Render Dashboard

### Configurações do Serviço

- [ ] **Name**: `estadio-backend` (ou nome escolhido)
- [ ] **Region**: Escolhida (ex: Oregon)
- [ ] **Branch**: `main` (ou branch principal)
- [ ] **Root Directory**: `Backend` ⚠️ **IMPORTANTE**
- [ ] **Runtime**: `Node`
- [ ] **Build Command**: `npm install`
- [ ] **Start Command**: `npm start`
- [ ] **Plan**: `Free` ou plano pago

### Variáveis de Ambiente Obrigatórias

No painel do Render, vá em **"Environment"** e adicione:

- [ ] **RENDER** = `true`
- [ ] **MONGODB_URI** = `mongodb+srv://admin:admin123@cluster0.4knxo.mongodb.net/stadium?retryWrites=true&w=majority`
- [ ] **SECRET** = `89d97b6c2355cf8b6e102d4c00f6c45365e297ce8ae13cdbecbc78f16b5450de273dd4ab0e2497a38fad1363a0dbba146f7a890fbdf523ed2375cdfeec4772e5`

### Variáveis de Ambiente Opcionais

- [ ] **NODE_ENV** = `production` (recomendado)
- [ ] **FRONTEND_URL** = URL do seu frontend (ex: `https://pwa-all-app.vercel.app`)
- [ ] **EXPIRES_PASSWORD** = `86400` (já tem valor padrão)
- [ ] **SALT_ROUNDS** = `10` (já tem valor padrão)
- [ ] **HOSTNAME** = `0.0.0.0` (já configurado automaticamente)

**Nota**: O Render define automaticamente a variável `PORT`, não precisa configurar manualmente.

## ⚠️ Problemas Encontrados e Corrigidos

### 1. ✅ MongoDB URI - CORRIGIDO
**Problema**: O `index.js` estava usando `process.env.MONGO_URI` mas o `config.js` usa `MONGODB_URI`.

**Solução**: Atualizado para aceitar ambas as variáveis:
```javascript
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || config.db)
```

## 🔍 Verificações Adicionais Necessárias

### MongoDB Atlas

1. **Network Access**:
   - [ ] Adicionar `0.0.0.0/0` na whitelist do MongoDB Atlas
   - Ou adicionar o IP específico do Render (mais seguro)

2. **Database User**:
   - [ ] Verificar se o usuário `admin` tem permissões adequadas
   - [ ] Verificar se a senha está correta

### CORS

- [ ] Verificar se a URL do frontend está na lista de `allowedOrigins`
- [ ] Se o frontend estiver em outro domínio, adicionar na variável `FRONTEND_URL`

### Uploads

⚠️ **IMPORTANTE**: A pasta `uploads` no Render é temporária e será perdida quando o serviço reiniciar.

**Soluções recomendadas para produção**:
- [ ] Configurar AWS S3, Cloudinary ou outro serviço de armazenamento
- [ ] Ou usar volumes persistentes (apenas em planos pagos)

## 🧪 Testes Após Deploy

Após fazer o deploy, teste:

1. **Health Check**:
   - [ ] Acessar: `https://seu-servico.onrender.com/api-docs`
   - [ ] Deve carregar a documentação Swagger

2. **API Endpoint**:
   - [ ] Testar: `https://seu-servico.onrender.com/api/auth/login`
   - [ ] Deve retornar resposta (mesmo que erro de validação)

3. **Logs**:
   - [ ] Verificar logs no Render Dashboard
   - [ ] Deve mostrar "Connection successful!" do MongoDB
   - [ ] Deve mostrar "Server running at http://0.0.0.0:PORT"

4. **Socket.IO**:
   - [ ] Testar conexão WebSocket do frontend
   - [ ] Verificar se conecta corretamente

## 🐛 Troubleshooting Comum

### Serviço não inicia
- Verificar logs do build
- Verificar se `Root Directory` está correto (`Backend`)
- Verificar se todas as dependências estão no `package.json`

### Erro de conexão com MongoDB
- Verificar se o IP está na whitelist do MongoDB Atlas
- Verificar se `MONGODB_URI` está correta
- Verificar se o usuário/senha estão corretos

### CORS errors
- Verificar se `FRONTEND_URL` está configurada
- Verificar se a URL do frontend está na lista de `allowedOrigins`

### Serviço dormindo (Free Plan)
- No plano gratuito, o serviço "dorme" após 15 minutos de inatividade
- O primeiro request após dormir pode demorar ~30 segundos
- Considerar usar um serviço de "ping" para manter ativo

## 📝 Notas Finais

- O código está pronto para deploy no Render
- Todas as configurações necessárias estão implementadas
- Apenas configure as variáveis de ambiente no dashboard do Render
- Certifique-se de que o MongoDB Atlas permite conexões do Render
