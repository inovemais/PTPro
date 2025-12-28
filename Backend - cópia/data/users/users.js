let mongoose = require("mongoose");
let scopes = require("./scopes");
let TicketSchema = require("../tickets/ticket");
let Member = require("../member/member");

let Schema = mongoose.Schema;

let RoleSchema = new Schema({
  name: { type: String, required: true },
  scope: [
    {
      type: String,
      enum: [scopes.Admin, scopes.Member, scopes.NonMember, scopes.Anonimous],
    },
  ],
});

// create a schema
let UserSchema = new Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: RoleSchema },
  age: { type: Number },
  address: { type: String, required: true },
  country: { type: String, required: true },
  taxNumber: { type: Number, required: true, unique: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, required: false, ref: "Member" },
  tickets: [
    { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Ticket" },
  ],
});

// Middleware para criar automaticamente um membro quando um utilizador é criado
UserSchema.pre('save', async function(next) {
  // Se já tem memberId, não criar novo membro
  if (this.memberId) {
    return next();
  }

  try {
    // Verificar se já existe um membro com este taxNumber
    const existingMember = await Member.findOne({ taxNumber: this.taxNumber });
    
    if (existingMember) {
      // Se já existe, associar o utilizador ao membro existente
      this.memberId = existingMember._id;
      return next();
    }

    // Criar um novo membro com o taxNumber do utilizador
    const member = new Member({
      dataCreated: new Date().toISOString(),
      paymentRegular: false,
      cash: 0,
      taxNumber: this.taxNumber, // Usar o taxNumber do utilizador
      photo: `member_${this.taxNumber}.jpg` // Nome baseado no taxNumber
    });
    
    // Salvar o membro
    const savedMember = await member.save();
    
    // Associar o memberId ao utilizador
    this.memberId = savedMember._id;
    
    next();
  } catch (error) {
    console.log('Error in middleware:', error);
    next(error);
  }
});

// the schema is useless so far
// we need to create a model using it
let User = mongoose.model("User", UserSchema);

// make this available to our users in our Node applications
module.exports = User;
