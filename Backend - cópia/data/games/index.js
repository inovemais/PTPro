const Games = require('./games');
const GamesService = require('./service');

const service = GamesService(Games);

module.exports = service;