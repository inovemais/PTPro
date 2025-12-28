# PTPro

Aplicação PWA (Progressive Web App) para gestão de ginásios/boxes de fitness, treinadores, clientes e planos de treino.

## Estrutura do Projeto

```
PTPro/
├── Backend/          # API Node.js/Express
├── Frontend/         # Aplicação React
└── README.md
```

## Tecnologias

### Backend
- Node.js
- Express
- MongoDB (Mongoose)
- Socket.IO
- Swagger/OpenAPI
- JWT (JSON Web Tokens)
- Bcrypt
- Multer (upload de ficheiros)
- QRCode

### Frontend
- React
- TypeScript
- Vite
- SCSS
- React Router
- Socket.IO Client
- React Hook Form
- React Toastify

## Instalação

### Backend
```bash
cd Backend
npm install
```

### Frontend
```bash
cd Frontend
npm install
```

## Configuração

### Variáveis de Ambiente

1. Copie o arquivo de exemplo de variáveis de ambiente:
   ```bash
   cd Backend
   cp .env.example .env
   ```

2. Edite o arquivo `.env` e configure as seguintes variáveis:
   - `MONGODB_URI`: String de conexão do MongoDB (MongoDB Atlas ou local)
   - `SECRET`: Chave secreta para JWT (use uma string forte em produção)
   - `EXPIRES_PASSWORD`: Tempo de expiração de senha em segundos (padrão: 86400 = 24 horas)
   - `SALT_ROUNDS`: Rounds de salt para bcrypt (padrão: 10)
   - `PORT`: Porta do servidor (padrão: 3000)
   - `HOSTNAME`: Hostname do servidor (padrão: 127.0.0.1)

**Importante:** O arquivo `.env` não será commitado no Git por questões de segurança. Use o `.env.example` como referência.

## Execução

### Backend
```bash
cd Backend
npm start
```

Para desenvolvimento com auto-reload:
```bash
cd Backend
npm run dev
```

O servidor estará disponível em `http://127.0.0.1:3000`
A documentação Swagger estará disponível em `http://127.0.0.1:3000/api-docs`

### Frontend
```bash
cd Frontend
npm run dev
```

A aplicação estará disponível em `http://localhost:5173` (porta padrão do Vite)

## Funcionalidades

- **Gestão de Utilizadores**: Sistema completo de autenticação e autorização
- **Gestão de Treinadores**: CRUD de treinadores
- **Gestão de Clientes**: Gestão de clientes e seus dados
- **Gestão de Planos de Treino**: Criação e gestão de planos de treino (workouts)
- **Pedidos de Mudança de Treinador**: Gestão de pedidos de mudança de treinador
- **Mensagens**: Sistema de mensagens em tempo real
- **Sistema de Autenticação**: Login/registro com JWT e autenticação por QR Code
- **Upload de Imagens**: Sistema de upload de ficheiros
- **API REST**: API documentada com Swagger/OpenAPI
- **WebSocket**: Comunicação em tempo real com Socket.IO
- **Dashboard para Treinadores**: Interface específica para treinadores
- **Página de Administração**: Interface para administradores
- **Página de Utilizador**: Interface para utilizadores/membros

## Estrutura de Rotas da API

- `/auth` - Autenticação e autorização
- `/users` - Gestão de utilizadores
- `/trainers` - Gestão de treinadores
- `/clients` - Gestão de clientes
- `/workouts` - Gestão de planos de treino
- `/trainer-change-requests` - Pedidos de mudança de treinador
- `/messages` - Mensagens em tempo real
