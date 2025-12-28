const express = require('express');
const VerifyToken = require('./middleware/token');

// Legacy modules (maintain for compatibility)
let AuthAPI = require('./server/auth');
let UsersAPI = require('./server/users');
let TrainersAPI = require('./server/trainers');
let ClientsAPI = require('./server/clients');
let WorkoutsAPI = require('./server/workouts');
let MessagesAPI = require('./server/messages');
let TrainerChangeRequestsAPI = require('./server/trainerChangeRequests');
let TrainerProfilesAPI = require('./server/trainer-profiles');
let ClientProfilesAPI = require('./server/client-profiles');
let ChatAPI = require('./server/chat');
let TrainingPlansAPI = require('./server/training-plans');
let ComplianceAPI = require('./server/compliance');
let QRCodeAPI = require('./server/qrcode');

// New modular structure
const trainersModule = require('./server/src/modules/trainers');
const clientsModule = require('./server/src/modules/clients');
const changeRequestsModule = require('./server/src/modules/change-requests');
const plansModule = require('./server/src/modules/plans');
const complianceModule = require('./server/src/modules/compliance');
const chatModule = require('./server/src/modules/chat');
const uploadsModule = require('./server/src/modules/uploads');

function init (io) {
    let api = express();

    // Make io available to all routes
    api.set('io', io);

    // Public routes (no auth required)
    api.use('/auth', AuthAPI());
    api.use('/qrcode', QRCodeAPI());

    // Protected routes - Legacy (maintain for compatibility)
    api.use('/users', VerifyToken, UsersAPI(io));
    api.use('/trainers', VerifyToken, TrainersAPI());
    api.use('/clients', VerifyToken, ClientsAPI());
    api.use('/workouts', VerifyToken, WorkoutsAPI());
    api.use('/messages', VerifyToken, MessagesAPI(io));
    api.use('/trainer-change-requests', VerifyToken, TrainerChangeRequestsAPI());
    api.use('/trainer-profiles', VerifyToken, TrainerProfilesAPI());
    api.use('/client-profiles', VerifyToken, ClientProfilesAPI());
    api.use('/chat', VerifyToken, ChatAPI(io));
    api.use('/training-plans', VerifyToken, TrainingPlansAPI());
    api.use('/compliance', VerifyToken, ComplianceAPI(io));

    // New modular routes (with standardized responses)
    api.use('/api/trainers', VerifyToken, trainersModule);
    api.use('/api/clients', VerifyToken, clientsModule);
    api.use('/api/change-requests', VerifyToken, changeRequestsModule);
    api.use('/api/plans', VerifyToken, plansModule);
    api.use('/api/compliance', VerifyToken, complianceModule);
    api.use('/api/chat', VerifyToken, chatModule);
    api.use('/api/uploads', VerifyToken, uploadsModule);

    return api;
}

module.exports = {
    init: init,
}