const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const path = require("path");
const socketio = require("socket.io");
const cors = require("cors");
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const config = require('./config');

const hostname = "127.0.0.1";
const port = 3000;

mongoose.connect(config.db)
.then(() => console.log('Conection successful!'))
.catch((err) => console.error(err));

const router = require('./router');
const app = express();

// Configurar CORS
app.use(cors({
  origin: true, // Permitir todas as origens em desenvolvimento
  credentials: true, // Permitir cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
    origin: "*", // Allow all origins (para desenvolvimento)
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
});