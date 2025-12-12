# EstadioPWA

Aplicação PWA (Progressive Web App) para gestão de estádios, jogos, bilhetes e membros.

## Estrutura do Projeto

```
EstadioPWA/
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

### Frontend
- React
- TypeScript
- Vite
- SCSS

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

O servidor estará disponível em `http://127.0.0.1:3000`
A documentação Swagger estará disponível em `http://127.0.0.1:3000/api-docs`

### Frontend
```bash
cd Frontend
npm run dev
```



## Funcionalidades

- Gestão de utilizadores
- Gestão de jogos
- Gestão de bilhetes
- Gestão de membros
- Gestão de estádio e secções
- Sistema de autenticação
- Upload de imagens
- API REST documentada com Swagger
- WebSocket para comunicação em tempo real

