const Members = require('./member');
const MembersService = require('./service');

const service = MembersService(Members);

module.exports = service;