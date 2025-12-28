# PTPro Frontend

Aplicação React para gestão de ginásios/boxes de fitness.

Este projeto foi criado com [Vite](https://vitejs.dev/) e utiliza React com TypeScript.

## Scripts Disponíveis

No diretório do projeto, pode executar:

### `npm run dev`

Executa a aplicação em modo de desenvolvimento.\
A aplicação estará disponível em [http://localhost:5173](http://localhost:5173).

A página recarrega automaticamente quando faz alterações.\
Também pode ver erros de lint na consola.

### `npm test`

Executa os testes com Vitest em modo watch interativo.

### `npm run build`

Compila a aplicação para produção na pasta `dist`.\
A aplicação é compilada em modo produção e otimizada para melhor performance.

O build é minificado e os nomes dos ficheiros incluem hashes.\
A aplicação está pronta para ser deployada!

### `npm run vercel-build`

Script específico para build no Vercel (instala dependências com `--legacy-peer-deps` e executa o build).

## Tecnologias

- **React 18** - Biblioteca JavaScript para construção de interfaces
- **TypeScript** - Superset tipado do JavaScript
- **Vite** - Build tool e dev server rápido
- **React Router** - Roteamento para React
- **SCSS** - Pré-processador CSS
- **Socket.IO Client** - Cliente WebSocket para comunicação em tempo real
- **React Hook Form** - Biblioteca para gestão de formulários
- **React Toastify** - Notificações toast
- **HTML5 QRCode** - Leitura de QR Codes

## Estrutura do Projeto

```
Frontend/
├── public/           # Ficheiros públicos estáticos
├── src/
│   ├── components/   # Componentes React
│   ├── config/       # Configurações (API, etc)
│   ├── context/      # Contextos React (Auth, Theme)
│   ├── hooks/        # Custom hooks
│   ├── socket/       # Configuração do Socket.IO
│   ├── styles/       # Estilos globais e variáveis SCSS
│   └── App.jsx       # Componente principal
└── vite.config.js    # Configuração do Vite
```

## Configuração da API

A configuração da API está em `src/config/api.js`. Certifique-se de que está configurada corretamente para apontar para o backend.

## Mais Informações

Para saber mais sobre:
- **Vite**: [Documentação do Vite](https://vitejs.dev/)
- **React**: [Documentação do React](https://react.dev/)
- **React Router**: [Documentação do React Router](https://reactrouter.com/)
