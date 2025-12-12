function GameService(GameModel) {
    let service = {
      create,
      find,
      findAll,
      findTicketsByDate,
      update,
      removeById,
    };
  
    function create(game) {
      let newGame = GameModel(game);
      return save(newGame);
    }
  
    function save(model) {
      return new Promise(function (resolve, reject) {
        // do a thing, possibly async, then…
        model.save(function (err) {
          if (err) reject("There is a problema with register");
  
          resolve({
            message: "Game Created",
            game: model,
          });
        });
      });
    }

    function findAll(pagination) {
      const { limit, skip } = pagination;
  
      return new Promise(function (resolve, reject) {
        GameModel.find({}, {}, { skip, limit })
          .populate('stadiumId')
          .exec(function (err, games) {
            if (err) reject(err);
            resolve(games);
          });
      }).then(async (games) => {
        const totalGames = await GameModel.count();
  
        return Promise.resolve({
          games: games,
          pagination: {
            pageSize: limit,
            page: Math.floor(skip / limit),
            hasMore: skip + limit < totalGames,
            total: totalGames,
          },
        });
      });
    }
  
    function find(id) {
      return new Promise(function (resolve, reject) {
        GameModel.findById(id)
          .populate('stadiumId')
          .exec(function (err, game) {
            if (err) reject(err);
            resolve(game);
          });
      });
    }

    function findTicketsByDate(date) {
      return new Promise(function (resolve, reject) {
        GameModel.find({ date }, function (err, game) {
          if (err) reject(err);
          //object of all users
  
          if (!game) {
            reject("Game does not found");
          }
          resolve(game);
        });
      });
    }
  
    function update(id, ticket) {
      return new Promise(function (resolve, reject) {
        GameModel.findByIdAndUpdate(id, ticket, function (err, gameUpdated) {
          if (err) reject('Dont updated Game');
          resolve(gameUpdated);
        });
      });
    }
  
    function removeById(id) {
      return new Promise(function (resolve, reject) {
        GameModel.findByIdAndRemove(id, function (err) {
          if (err)
            reject({
              message: "Does not possible remove",
            });
  
          resolve();
        });
      });
    }
  
    return service;
  }
  
  module.exports = GameService;
  