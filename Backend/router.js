let AuthAPI = require('./server/auth');
let UsersAPI = require('./server/users');
let MemberRequestsAPI = require('./server/memberRequests');
let TrainersAPI = require('./server/trainers');
let ClientsAPI = require('./server/clients');
let WorkoutsAPI = require('./server/workouts');
let MessagesAPI = require('./server/messages');
let TrainerChangeRequestsAPI = require('./server/trainerChangeRequests');
const express = require('express');

function init (io) {
    let api = express();

    api.use('/auth', AuthAPI());
    api.use('/users', UsersAPI(io));
    api.use('/member-requests', MemberRequestsAPI());
    api.use('/trainers', TrainersAPI());
    api.use('/clients', ClientsAPI());
    api.use('/workouts', WorkoutsAPI());
    api.use('/messages', MessagesAPI(io));
    api.use('/trainer-change-requests', TrainerChangeRequestsAPI());

    return api;
}

module.exports = {
    init: init,
}