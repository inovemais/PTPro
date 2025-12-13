// Carregar variáveis de ambiente primeiro
require('dotenv').config();

// Fix: Garantir que todas as importações usam case-sensitive paths

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const path = require("path");
const socketio = require("socket.io");
const cors = require("cors");
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const config = require('./config');

// Configuração de hostname e porta
// Render define PORT automaticamente, garantir que seja um número
const port = parseInt(process.env.PORT) || parseInt(config.port) || 3000;
const hostname = ("RENDER" in process.env) ? "0.0.0.0" : config.hostname; // 0.0.0.0 on Render

console.log('🚀 Starting server...');
console.log(`📌 Port: ${port}`);
console.log(`📌 Hostname: ${hostname}`);
console.log(`📌 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`📌 RENDER: ${"RENDER" in process.env ? 'Yes' : 'No'}`);

// Conectar ao MongoDB (não bloquear o servidor se falhar)
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || config.db;
console.log(`📌 MongoDB URI: ${mongoUri ? 'Set' : 'Not set'}`);

mongoose.connect(mongoUri)
  .then(() => console.log('✅ MongoDB connection successful!'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    // Não bloquear o servidor, mas avisar
  });

console.log('📦 Loading router...');
let router;
try {
  router = require('./router');
  console.log('✅ Router loaded');
} catch (error) {
  console.error('❌ Error loading router:', error);
  throw error; // Se o router não carregar, não podemos continuar
}

const app = express();
console.log('✅ Express app created');

// Configurar CORS com origens permitidas
const customFrontendUrl = process.env.FRONTEND_URL || '';
const allowedOrigins = [
  customFrontendUrl,
  'https://pwa-all-app.vercel.app',
  'http://localhost:5173', // Vite default port
  'http://localhost:3000', // React default port
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  return !origin || allowedOrigins.includes(origin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Servir ficheiros estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configurar Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Estadio API Documentation',
  swaggerOptions: {
    persistAuthorization: true, // Manter autorização após refresh
    displayRequestDuration: true, // Mostrar duração das requisições
    filter: true, // Habilitar filtro de tags
    tryItOutEnabled: true // Habilitar "Try it out" por padrão
  }
}));

// Criar servidor HTTP
const server = http.createServer(app);

// Configurar Socket.IO anexado ao servidor HTTP
const io = socketio(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : "*", // Use allowed origins or allow all
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Tornar io disponível através do app
app.set('io', io);

// Inicializar router passando io
app.use('/api', router.init(io));

// Eventos de conexão Socket.IO
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Iniciar servidor HTTP e WebSocket
// IMPORTANTE: Sempre escutar na porta, mesmo se houver erros anteriores
console.log('🎯 Starting server.listen()...');
console.log(`🎯 Attempting to listen on ${hostname}:${port}`);

try {
  server.listen(port, hostname, () => {
    console.log(`✅✅✅ Server successfully running at http://${hostname}:${port} ✅✅✅`);
    console.log('✅ Socket.IO server initialized');
    console.log(`✅ Swagger UI available at http://${hostname}:${port}/api-docs`);
    console.log(`✅ Allowed CORS origins: ${allowedOrigins.join(', ') || 'All'}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Render detected: ${"RENDER" in process.env ? 'Yes' : 'No'}`);
  }).on('error', (err) => {
    console.error('❌❌❌ Server listen error:', err);
    console.error('❌ Error code:', err.code);
    console.error('❌ Error message:', err.message);
    process.exit(1);
  });
} catch (error) {
  console.error('❌❌❌ Fatal error starting server:', error);
  process.exit(1);
}

// Garantir que o processo não termine silenciosamente
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  // Não terminar o processo, apenas logar
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Não terminar o processo, apenas logar
});
