let Client = require("./client");
let ClientService = require("./service");

module.exports = {
  Client,
  ClientService: ClientService(Client),
};


