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

1. Configure as variáveis de ambiente no `Backend/config.js`
2. Certifique-se de que o MongoDB está em execução

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

## Licença

[Adicione a licença aqui]
