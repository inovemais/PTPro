const Tickets = require('./ticket');
const TicketService = require('./service');

const service = TicketService(Tickets);

module.exports = service;