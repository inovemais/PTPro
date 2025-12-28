const config = require("../../config");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

function UserService(UserModel) {
  let service = {
    create,
    createToken,
    verifyToken,
    findUser,
    findUserById,
    autorize,
    update,
    findAll
  };

  function create(user) {
    return createPassword(user).then((hashPassword, err) => {
      if (err) {
        return Promise.reject("Not saved the user");
      }

      let newUserWithPassword = {
        ...user,
        password: hashPassword,
      };

      let newUser = UserModel(newUserWithPassword);
      return save(newUser);
    });
  }

  function createToken(user) {
    // role.scope is defined as an array in the schema; ensure we encode that in the token
    const roleScopes = Array.isArray(user.role && user.role.scope)
      ? user.role.scope
      : [];
    const decoded = { id: user._id.toString(), name: user.name, role: roleScopes };
    let token = jwt.sign(decoded, config.secret, {
      expiresIn: config.expiresPassword,
    });

    return { auth: true, token, decoded, user: { _id: user._id, name: user.name } };
  }


  function verifyToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
          reject();
        }     
        return resolve(decoded);
      });
    });
  }

  function save(model) {
    return new Promise(function (resolve, reject) {
      // do a thing, possibly async, then…
      model.save(function (err) {
        if (err) reject("There is a problema with register");

        resolve({
            message: 'User saved',
            user: model,
        });
      });
    });
  }

  function update(id, user) {
    return new Promise(function (resolve, reject) {
      UserModel.findByIdAndUpdate(id, user, { new: true }, function (err, userUpdated) {
        if (err) reject('Dont updated User');
        resolve(userUpdated);
      });
    });
  }

  function findAll(pagination) {
    return new Promise(function (resolve, reject) {
      UserModel.find({})
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate('memberId')
        .exec(function (err, users) {
          if (err) reject('Error finding users');
          resolve(users);
        });
    });
  }

  function findUser({ name, password }) {
    return new Promise(function (resolve, reject) {
      UserModel.findOne({ name }, function (err, user) {
        if (err) reject(err);
        //object of all users

        if (!user) {
          reject("This data is wrong");
        }
        resolve(user);
      });
    }).then((user) => {
      return comparePassword(password, user.password).then((match) => {
        if (!match) return Promise.reject("User not valid");
        return Promise.resolve(user);
      });
    });
  }

  function findUserById(id) {
    return new Promise(function (resolve, reject) {
      UserModel.findById(id, function (err, user) {
        if (err) reject(err);
        if (!user) {
          reject("User not found");
        }
        resolve(user);
      });
    });
  }

  //devolver a password encryptada
  function createPassword(user) {
    return bcrypt.hash(user.password, config.saltRounds);
  }

  //devolver se a password é ou não a mesma
  function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  function autorize(scopes) {
    return (request, response, next) => {

      const { roleUser } = request; //Este request só tem o roleUser porque o adicionamos no ficheiro players
      const hasAutorization = scopes.some(scope => roleUser.includes(scope));

      if (roleUser && hasAutorization) {
        next();
      } else {
        response.status(403).json({ message: "Forbidden" }); //acesso negado
      }
    };
  }

  return service;
}

module.exports = UserService;
