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

// Handler CRÍTICO para OPTIONS (preflight) - DEVE SER O PRIMEIRO
// Isso garante que requisições OPTIONS sejam respondidas antes de qualquer outro middleware
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    try {
      const origin = req.headers.origin;
      console.log(`🔄 OPTIONS preflight request from: ${origin || 'none'} to ${req.path}`);
      
      // SEMPRE permitir OPTIONS - o CORS real será verificado na requisição real
      // Isso resolve o problema de 500 no preflight
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400'); // 24 horas
      console.log(`✅ OPTIONS preflight responded with 200 for: ${origin || 'none'}`);
      return res.status(200).end();
    } catch (err) {
      console.error('❌ Error in OPTIONS handler:', err);
      // Mesmo em caso de erro, tentar responder
      try {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(200).end();
      } catch (e) {
        console.error('❌ Failed to send OPTIONS response:', e);
        return res.status(200).end(); // Tentar enviar resposta vazia mesmo assim
      }
    }
  }
  next();
});

// Configurar CORS com origens permitidas
const customFrontendUrl = process.env.FRONTEND_URL || '';
const isDevelopment = process.env.NODE_ENV !== 'production';
const isRender = "RENDER" in process.env;

const allowedOrigins = [
  customFrontendUrl,
  'https://pwa-all-app.vercel.app',
  'https://pwa-app-swart-xi.vercel.app', // Frontend atual
  'http://localhost:5173', // Vite default port
  'http://localhost:3000', // React default port
  'http://127.0.0.1:5173', // Vite alternative
  'http://127.0.0.1:3000', // React alternative
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  // Em desenvolvimento, permitir todas as origens localhost
  if (isDevelopment && origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    return true;
  }
  // Em produção no Render, ser mais permissivo se não houver origem definida
  if (isRender && !origin) {
    return true; // Permitir requisições sem origem (ex: Postman, curl)
  }
  // Se não houver origem, permitir (pode ser requisição do mesmo domínio)
  if (!origin) {
    return true;
  }
  // Verificar se está na lista de origens permitidas
  return allowedOrigins.includes(origin);
};

const corsOptions = {
  origin: (origin, callback) => {
    console.log(`🌐 CORS check - Origin: ${origin || 'none'}`);
    console.log(`🌐 Environment: ${isDevelopment ? 'development' : 'production'}`);
    console.log(`🌐 Render: ${isRender ? 'Yes' : 'No'}`);
    
    try {
      if (isAllowedOrigin(origin)) {
        console.log(`✅ CORS allowed for origin: ${origin || 'none'}`);
        return callback(null, true);
      }
      console.log(`❌ CORS blocked for origin: ${origin || 'none'}`);
      console.log(`📋 Allowed origins: ${allowedOrigins.join(', ') || 'All localhost in dev'}`);
      // Em produção no Render, se a origem não estiver na lista mas for HTTPS, permitir
      if (isRender && origin && origin.startsWith('https://')) {
        console.log(`⚠️  Render production: Allowing HTTPS origin: ${origin}`);
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    } catch (err) {
      console.error('❌ Error in CORS origin check:', err);
      // Em caso de erro, permitir em desenvolvimento
      if (isDevelopment) {
        return callback(null, true);
      }
      return callback(err);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// IMPORTANTE: CORS deve ser aplicado ANTES de qualquer outro middleware
app.use(cors(corsOptions));

// Handler explícito para requisições OPTIONS (preflight)
app.options('*', cors(corsOptions));

// Middleware de logging para debug (antes do router)
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  if (req.method === 'OPTIONS') {
    console.log('🔄 Preflight request detected');
  }
  next();
});

// Servir ficheiros estáticos da pasta uploads (pular OPTIONS)
app.use('/uploads', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  express.static(path.join(__dirname, 'uploads'))(req, res, next);
});

// Configurar Swagger UI (pular OPTIONS)
app.use('/api-docs', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  swaggerUi.serve(req, res, next);
}, swaggerUi.setup(swaggerSpec, {
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
console.log('📦 Initializing router with Socket.IO...');
try {
  app.use('/api', router.init(io));
  console.log('✅ Router initialized');
} catch (error) {
  console.error('❌ Error initializing router:', error);
  throw error;
}

// Middleware de tratamento de erros global (deve ser o último)
app.use((err, req, res, next) => {
  console.error('❌ Error middleware caught:', err);
  console.error('❌ Error name:', err.name);
  console.error('❌ Error message:', err.message);
  console.error('❌ Request method:', req.method);
  console.error('❌ Request path:', req.path);
  console.error('❌ Request origin:', req.headers.origin);
  
  // Se for uma requisição OPTIONS (preflight), sempre responder 200
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS error - returning 200');
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(200).end();
  }
  
  // Se for erro de CORS, retornar 403 em vez de 500
  if (err.message && err.message.includes('CORS')) {
    console.error('❌ CORS error detected');
    res.status(403).json({
      error: 'CORS policy violation',
      message: err.message
    });
    return;
  }
  
  // Para outros erros, retornar erro apropriado
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

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
