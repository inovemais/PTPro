# Troubleshooting: Erro "Cannot find module '../middleware/Token'"

## Problema

O Render está mostrando o erro:
```
Error: Cannot find module '../middleware/Token'
```

Mas o código no repositório está correto (usa `token` minúsculo).

## Soluções

### 1. Forçar Rebuild Manual no Render

1. Acesse o **Render Dashboard**
2. Vá para o seu serviço `estadio-backend`
3. Clique em **"Manual Deploy"**
4. Selecione **"Deploy latest commit"**
5. Aguarde o deploy completar

### 2. Limpar Cache do Build

No Render Dashboard:
1. Vá em **Settings** do serviço
2. Role até **"Clear build cache"**
3. Clique em **"Clear build cache"**
4. Faça um novo deploy

### 3. Verificar Branch no Render

Certifique-se de que o Render está usando a branch correta:
1. Vá em **Settings** do serviço
2. Verifique o campo **"Branch"**
3. Deve estar como `main` (ou sua branch principal)
4. Se estiver diferente, altere e faça um novo deploy

### 4. Verificar Root Directory

Certifique-se de que o **Root Directory** está correto:
1. Vá em **Settings** do serviço
2. Verifique o campo **"Root Directory"**
3. Deve estar como `Backend`
4. Se estiver diferente, altere e faça um novo deploy

### 5. Verificar Arquivos no Repositório

Execute localmente para verificar:
```bash
cd Backend
grep -r "middleware/Token" server/
```

**Resultado esperado**: Nenhum resultado (todos devem usar `middleware/token`)

### 6. Deletar e Recriar o Serviço (Último Recurso)

Se nada funcionar:
1. No Render Dashboard, delete o serviço atual
2. Crie um novo Web Service
3. Configure tudo novamente
4. Isso forçará um build completamente novo

## Verificação do Código

Todos os arquivos devem ter:
```javascript
const VerifyToken = require("../middleware/token");
```

**NÃO** deve ter:
```javascript
const VerifyToken = require("../middleware/Token"); // ❌ ERRADO
```

## Arquivos que devem estar corretos

- ✅ `Backend/server/auth.js`
- ✅ `Backend/server/games.js`
- ✅ `Backend/server/memberRequests.js`
- ✅ `Backend/server/stadium.js`
- ✅ `Backend/server/tickets.js`
- ✅ `Backend/server/users.js`

## Status Atual

- ✅ Código local: Correto
- ✅ Código no GitHub: Correto
- ⚠️ Render: Pode estar usando cache antigo

## Próximos Passos

1. **Forçar rebuild manual** no Render (solução mais rápida)
2. **Limpar cache** do build
3. Se persistir, **deletar e recriar** o serviço
