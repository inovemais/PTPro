// Carregar variáveis de ambiente primeiro
require('dotenv').config();

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
const port = process.env.PORT || config.port;
const hostname = ("RENDER" in process.env) ? "0.0.0.0" : config.hostname; // 0.0.0.0 on Render

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI || config.db)
  .then(() => console.log('Connection successful!'))
  .catch((err) => console.error(err));

const router = require('./router');
const app = express();

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
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}`);
  console.log('Socket.IO server initialized');
  console.log(`Swagger UI available at http://${hostname}:${port}/api-docs`);
  console.log(`Allowed CORS origins: ${allowedOrigins.join(', ') || 'All'}`);
});
