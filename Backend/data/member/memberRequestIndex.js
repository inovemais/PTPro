const MemberRequest = require('./memberRequest');
const MemberRequestService = require('./memberRequestService');

const service = MemberRequestService(MemberRequest);

module.exports = service;

