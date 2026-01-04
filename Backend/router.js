const express = require('express');
const VerifyToken = require('./middleware/token');

// Legacy modules (maintain for compatibility - some will be deprecated)
let AuthAPI = require('./server/auth');
let UsersAPI = require('./server/users');
// TrainersAPI, ClientsAPI, ChatAPI, ComplianceAPI (now workout-logs), WorkoutsAPI removed - using new modules instead
let MessagesAPI = require('./server/messages');
// TrainerChangeRequestsAPI removed - using changeRequestsModule instead
// TrainingPlansAPI removed - using plansModule instead
let TrainerProfilesAPI = require('./server/trainer-profiles');
let ClientProfilesAPI = require('./server/client-profiles');
let QRCodeAPI = require('./server/qrcode');
let ExercisesAPI = require('./server/exercises');

// New modular structure
const trainersModule = require('./server/src/modules/trainers');
const clientsModule = require('./server/src/modules/clients');
const changeRequestsModule = require('./server/src/modules/change-requests');
const plansModule = require('./server/src/modules/plans');
const workoutLogsModule = require('./server/src/modules/workout-logs');
const chatModule = require('./server/src/modules/chat');
const uploadsModule = require('./server/src/modules/uploads');

function init (io) {
    let api = express();

    // Make io available to all routes
    api.set('io', io);

    // Public routes (no auth required)
    api.use('/auth', AuthAPI());
    api.use('/qrcode', QRCodeAPI());

    // Protected routes - New modular routes (with standardized responses)
    // Note: These routes are mounted at /api in index.js, so we don't need /api prefix here
    api.use('/trainers', VerifyToken, trainersModule);
    api.use('/clients', VerifyToken, clientsModule);
    api.use('/change-requests', VerifyToken, changeRequestsModule);
    api.use('/plans', VerifyToken, plansModule);
    api.use('/workout-logs', VerifyToken, workoutLogsModule);
    api.use('/chat', VerifyToken, chatModule);
    api.use('/uploads', VerifyToken, uploadsModule);

    // Protected routes - Legacy (no new module equivalent yet, but will be standardized)
    api.use('/users', VerifyToken, UsersAPI(io));
    api.use('/messages', VerifyToken, MessagesAPI(io));
    api.use('/exercises', VerifyToken, ExercisesAPI());
    api.use('/trainer-profiles', VerifyToken, TrainerProfilesAPI());
    api.use('/client-profiles', VerifyToken, ClientProfilesAPI());

    return api;
}

module.exports = {
    init: init,
}