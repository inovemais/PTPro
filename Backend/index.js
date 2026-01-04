// Carregar variáveis de ambiente primeiro
require('dotenv').config();

// Fix: Garantir que todas as importações usam case-sensitive paths

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const path = require("path");
const socketio = require("socket.io");
const cors = require("cors");

// Carregar Swagger com proteção contra erros
let swaggerUi, swaggerSpec;
try {
  swaggerUi = require('swagger-ui-express');
  swaggerSpec = require('./swagger');
} catch (swaggerError) {
  console.error('Error loading Swagger:', swaggerError.message);
  // Não bloquear o servidor se Swagger falhar
  swaggerUi = null;
  swaggerSpec = null;
}

const config = require('./config');

// Configuração de hostname e porta
// Render define PORT automaticamente, garantir que seja um número
const port = parseInt(process.env.PORT) || parseInt(config.port) || 3000;
const hostname = ("RENDER" in process.env) ? "0.0.0.0" : config.hostname; // 0.0.0.0 on Render

// Conectar ao MongoDB (não bloquear o servidor se falhar)
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || config.db;

console.log('🔗 Connecting to MongoDB...');
console.log('📍 MongoDB URI:', mongoUri ? (mongoUri.includes('@') ? mongoUri.split('@')[0].replace(/mongodb\+srv:\/\/([^:]+):([^@]+)/, 'mongodb+srv://***:***') : mongoUri) : 'Not configured');

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('⚠️  Server will start but database operations may fail');
  });

// Log connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  Mongoose disconnected from MongoDB');
});

let router;
try {
  router = require('./router');
} catch (error) {
  console.error('Error loading router:', error);
  throw error; // Se o router não carregar, não podemos continuar
}

const app = express();

// Body parser no nível principal (antes de qualquer rota)
const bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

// Handler CRÍTICO para OPTIONS (preflight) - DEVE SER O ABSOLUTAMENTE PRIMEIRO
// Este handler deve responder a TODAS as requisições OPTIONS antes de qualquer outro middleware
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    try {
      const origin = req.headers.origin || '*';

      // SEMPRE permitir OPTIONS - o CORS real será verificado na requisição real
      // Usar writeHead para garantir que os headers sejam definidos antes de qualquer resposta
      res.writeHead(200, {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
        'Content-Length': '0'
      });
      
      return res.end();
    } catch (err) {
      // Mesmo em caso de erro, tentar enviar resposta
      try {
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Length': '0'
        });
        return res.end();
      } catch (e) {
        return res.status(200).end();
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
  'https://pt-pro.vercel.app', // Frontend atual
  'https://pwa-all-app.vercel.app',
  'https://pwa-app-swart-xi.vercel.app',
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
    try {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      // Em produção no Render, se a origem não estiver na lista mas for HTTPS, permitir
      if (isRender && origin && origin.startsWith('https://')) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    } catch (err) {
      console.error('Error in CORS origin check:', err);
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

// Middleware sem logs (antes do router) - pular OPTIONS já tratadas
app.use((req, res, next) => {
  next();
});

// Servir ficheiros estáticos da pasta uploads (pular OPTIONS)
app.use('/uploads', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  express.static(path.join(__dirname, 'uploads'))(req, res, next);
});

// Configurar Swagger UI (pular OPTIONS e proteger contra erros)
if (swaggerUi && swaggerSpec) {
  try {
    const swaggerUiOptions = {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'PTPro API Documentation',
      swaggerOptions: {
        persistAuthorization: true, // Manter autorização após refresh
        displayRequestDuration: true, // Mostrar duração das requisições
        filter: true, // Habilitar filtro de tags
        tryItOutEnabled: true // Habilitar "Try it out" por padrão
      }
    };
    
    // Na versão 5.x, swaggerUi.serve é um array de middlewares
    // Primeiro servir os ficheiros estáticos, depois configurar o setup
    app.use('/api-docs', (req, res, next) => {
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
      next();
    });
    
    // swaggerUi.serve serve os ficheiros estáticos (CSS, JS)
    // swaggerUi.setup configura a UI com o spec
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  } catch (swaggerError) {
    console.error('Error configuring Swagger UI:', swaggerError);
    // Não bloquear o servidor se Swagger falhar
  }
} else {
  // Swagger UI não disponível, seguir sem documentação interativa
}

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
try {
  const apiRouter = router.init(io);
  app.use('/api', apiRouter);
} catch (error) {
  console.error('Error initializing router:', error);
  console.error('Error stack:', error.stack);
  // Não bloquear o servidor, mas criar um router de fallback
  app.use('/api', (req, res, next) => {
    console.error(`Router not available for ${req.method} ${req.path}`);
    res.status(503).json({ 
      error: 'Service temporarily unavailable',
      message: 'Router initialization failed'
    });
  });
}

// Handler para rotas não encontradas (antes do middleware de erros)
app.use((req, res, next) => {
  // Se os headers já foram enviados, não fazer nada
  if (res.headersSent) {
    return;
  }
  
  // Se for OPTIONS, já foi tratado antes, mas garantir resposta
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin || '*';
    res.writeHead(200, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Content-Length': '0'
    });
    return res.end();
  }
  // Para outras rotas não encontradas
  res.status(404).json({ error: 'Route not found' });
});

// Middleware de tratamento de erros global (deve ser o último)
app.use((err, req, res, next) => {
  console.error('Error middleware caught:', err);
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Request method:', req.method);
  console.error('Request path:', req.path);
  console.error('Request origin:', req.headers.origin);
  
  // Se a resposta já foi enviada, não fazer nada
  if (res.headersSent) {
    return next(err);
  }
  
  // Se for uma requisição OPTIONS (preflight), sempre responder 200
  if (req.method === 'OPTIONS') {
    try {
      const origin = req.headers.origin || '*';
      res.writeHead(200, {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Length': '0'
      });
      return res.end();
    } catch (e) {
      console.error('Error sending OPTIONS response:', e);
      return res.status(200).end();
    }
  }
  
  // Se for erro de CORS, retornar 403 em vez de 500
  if (err.message && err.message.includes('CORS')) {
    console.error('CORS error detected');
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
  // Permitir que clientes se juntem a rooms baseados no userId
  socket.on('join', (userId) => {
    if (userId) {
      const roomId = String(userId);
      socket.join(roomId);
    }
  });
});

// Iniciar servidor HTTP e WebSocket
// IMPORTANTE: Sempre escutar na porta, mesmo se houver erros anteriores
try {
  server.listen(port, hostname, () => {
  }).on('error', (err) => {
    console.error('Server listen error:', err);
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    process.exit(1);
  });
} catch (error) {
  console.error('Fatal error starting server:', error);
  process.exit(1);
}

// Garantir que o processo não termine silenciosamente
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Não terminar o processo, apenas logar
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Não terminar o processo, apenas logar
});
