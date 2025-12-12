# Guia de Deploy no Render.com

Este guia explica como fazer o deploy do backend no Render.com.

## Pré-requisitos

1. Conta no [Render.com](https://render.com)
2. Repositório no GitHub com o código do projeto
3. MongoDB Atlas configurado (ou outro banco MongoDB)

## Passo a Passo

### 1. Preparar o Repositório

Certifique-se de que o código está no GitHub e atualizado.

### 2. Criar Novo Web Service no Render

1. Acesse o [Dashboard do Render](https://dashboard.render.com)
2. Clique em **"New +"** e selecione **"Web Service"**
3. Conecte seu repositório GitHub (se ainda não estiver conectado)
4. Selecione o repositório `EstadioPWA`

### 3. Configurar o Serviço

Preencha os seguintes campos:

- **Name**: `estadio-backend` (ou o nome que preferir)
- **Region**: Escolha a região mais próxima (ex: `Oregon`)
- **Branch**: `main` (ou a branch principal)
- **Root Directory**: `Backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free` (ou escolha um plano pago)

### 4. Configurar Variáveis de Ambiente

No painel do serviço, vá em **"Environment"** e adicione as seguintes variáveis:

#### Obrigatórias:

```
RENDER=true
MONGODB_URI=mongodb+srv://admin:admin123@cluster0.4knxo.mongodb.net/stadium?retryWrites=true&w=majority
SECRET=89d97b6c2355cf8b6e102d4c00f6c45365e297ce8ae13cdbecbc78f16b5450de273dd4ab0e2497a38fad1363a0dbba146f7a890fbdf523ed2375cdfeec4772e5
```

RENDER=true
MONGODB_URI=mongodb+srv://admin:admin123@cluster0.4knxo.mongodb.net/stadium?retryWrites=true&w=majority
SECRET=T

#### Opcionais (com valores padrão):

```
NODE_ENV=production
FRONTEND_URL=https://seu-frontend.vercel.app
EXPIRES_PASSWORD=86400
SALT_ROUNDS=10
PORT=10000
HOSTNAME=0.0.0.0
```

**Nota**: O Render define automaticamente a variável `PORT`, então você não precisa configurá-la manualmente.

### 5. Deploy

1. Clique em **"Create Web Service"**
2. O Render começará a fazer o build e deploy automaticamente
3. Aguarde alguns minutos até o deploy completar
4. Você verá a URL do seu serviço (ex: `https://estadio-backend.onrender.com`)

### 6. Verificar o Deploy

Após o deploy, você pode:

- Acessar a API: `https://seu-servico.onrender.com/api/...`
- Acessar a documentação Swagger: `https://seu-servico.onrender.com/api-docs`
- Verificar os logs em **"Logs"** no painel do Render

## Configuração de CORS

O backend já está configurado para aceitar requisições do frontend. Certifique-se de:

1. Adicionar a URL do frontend na variável `FRONTEND_URL`
2. O frontend deve fazer requisições para a URL do backend no Render

## Uploads de Arquivos

**Importante**: A pasta `uploads` no Render é temporária e será perdida quando o serviço reiniciar. Para produção, considere:

1. Usar um serviço de armazenamento (AWS S3, Cloudinary, etc.)
2. Configurar volumes persistentes (apenas em planos pagos)

## Monitoramento

- **Logs**: Acesse em tempo real no painel do Render
- **Métricas**: Disponíveis no dashboard do serviço
- **Health Checks**: Configure em **"Settings"** > **"Health Check Path"**

## Troubleshooting

### Erro de Conexão com MongoDB

- Verifique se o IP do Render está na whitelist do MongoDB Atlas
- No MongoDB Atlas, adicione `0.0.0.0/0` na Network Access (ou o IP específico do Render)

### Serviço Dormindo (Free Plan)

- No plano gratuito, o serviço "dorme" após 15 minutos de inatividade
- O primeiro request após dormir pode demorar ~30 segundos
- Considere usar um serviço de "ping" para manter o serviço ativo

### Erro de Build

- Verifique os logs do build no Render
- Certifique-se de que todas as dependências estão no `package.json`
- Verifique se o `Root Directory` está correto (`Backend`)

## Atualizações

Para atualizar o serviço:

1. Faça push das alterações para o GitHub
2. O Render detectará automaticamente e fará um novo deploy
3. Ou clique em **"Manual Deploy"** > **"Deploy latest commit"**

## Suporte

- [Documentação do Render](https://render.com/docs)
- [Render Community](https://community.render.com)
