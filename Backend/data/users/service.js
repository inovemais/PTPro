const config = require("../../config");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

function UserService(UserModel) {
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
        .exec(function (err, users) {
          if (err) reject('Error finding users');
          resolve(users);
        });
    });
  }

  // Buscar utilizador por email ou name e validar password
  function findUser(userData) {
    return new Promise(function (resolve, reject) {
      const query = {};
      
      // Buscar por email ou name
      if (userData.email) {
        query.email = userData.email;
      } else if (userData.name) {
        query.name = userData.name;
      } else {
        return reject("Email or name is required");
      }

      UserModel.findOne(query, function (err, user) {
        if (err) {
          return reject("Error finding user");
        }
        
        if (!user) {
          return reject("This data is wrong");
        }

        // Validar password
        if (!userData.password) {
          return reject("Password is required");
        }

        comparePassword(userData.password, user.password)
          .then((isMatch) => {
            if (!isMatch) {
              return reject("This data is wrong");
            }
            
            // Verificar se o utilizador é válido
            if (!user.role || !user.role.scope || user.role.scope.length === 0) {
              return reject("User not valid");
            }
            
            resolve(user);
          })
          .catch((err) => {
            reject("This data is wrong");
          });
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

  // Retornar objeto service com todas as funções
  return {
    create,
    createToken,
    verifyToken,
    findUser,
    findUserById,
    autorize,
    update,
    findAll
  };
}

module.exports = UserService;
