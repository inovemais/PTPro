let Message = require("./message");
let MessageService = require("./service");

module.exports = {
  Message,
  MessageService: MessageService(Message),
};


