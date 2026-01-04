function ExerciseService(ExerciseModel) {
  const service = {
    create,
    update,
    findById,
    findAll,
    removeById,
  };

  /**
   * Create a new exercise
   * @param {Object} exercise - Exercise data
   * @returns {Promise} Created exercise
   */
  function create(exercise) {
    return new Promise(function (resolve, reject) {
      // Validate required fields
      if (!exercise.name || exercise.name.trim() === "") {
        return reject(new Error("Exercise name is required"));
      }

      // Check if exercise with same name already exists
      ExerciseModel.findOne({ name: exercise.name.trim() })
        .then((existing) => {
          if (existing) {
            return reject(new Error("Exercise with this name already exists"));
          }

          // Create new exercise
          const model = new ExerciseModel(exercise);
          return save(model);
        })
        .then((result) => resolve(result))
        .catch((err) => reject(err));
    });
  }

  /**
   * Save exercise model to database
   * @param {Object} model - Mongoose model instance
   * @returns {Promise} Saved exercise
   */
  function save(model) {
    return new Promise(function (resolve, reject) {
      model.save(function (err) {
        if (err) {
          return reject(err);
        }

        resolve({
          message: "Exercise created",
          exercise: model,
        });
      });
    });
  }

  /**
   * Update exercise by ID
   * @param {String} id - Exercise ID
   * @param {Object} data - Update data
   * @returns {Promise} Updated exercise
   */
  function update(id, data) {
    return new Promise(function (resolve, reject) {
      if (!id) {
        return reject(new Error("Exercise ID is required"));
      }

      // Find exercise first to ensure it exists
      ExerciseModel.findById(id)
        .then((existing) => {
          if (!existing) {
            return reject(new Error("Exercise not found"));
          }

          // Clean undefined fields
          const cleanData = {};
          Object.keys(data).forEach((key) => {
            if (data[key] !== undefined) {
              cleanData[key] = data[key];
            }
          });

          // If name is being updated, check for duplicates
          if (cleanData.name && cleanData.name.trim() !== existing.name) {
            return ExerciseModel.findOne({ name: cleanData.name.trim() }).then(
              (duplicate) => {
                if (duplicate) {
                  return reject(
                    new Error("Exercise with this name already exists")
                  );
                }
                return ExerciseModel.findByIdAndUpdate(
                  id,
                  cleanData,
                  { new: true, runValidators: true }
                );
              }
            );
          }

          // Update exercise
          return ExerciseModel.findByIdAndUpdate(
            id,
            cleanData,
            { new: true, runValidators: true }
          );
        })
        .then((updated) => {
          if (!updated) {
            return reject(new Error("Exercise not found"));
          }
          resolve(updated);
        })
        .catch((err) => reject(err));
    });
  }

  /**
   * Find exercise by ID
   * @param {String} id - Exercise ID
   * @returns {Promise} Exercise object
   */
  function findById(id) {
    return new Promise(function (resolve, reject) {
      if (!id) {
        return reject(new Error("Exercise ID is required"));
      }

      ExerciseModel.findById(id)
        .populate("createdBy", "name email")
        .exec(function (err, exercise) {
          if (err) return reject(err);
          if (!exercise) {
            return reject(new Error("Exercise not found"));
          }
          resolve(exercise);
        });
    });
  }

  /**
   * Find all exercises with filters and pagination
   * @param {Object} query - Query filters { search, sort, category, muscleGroup, difficulty, isActive }
   * @param {Object} pagination - Pagination { limit, skip }
   * @returns {Promise} Object with exercises array and pagination info
   */
  function findAll(query, pagination) {
    const { search, sort, category, muscleGroup, difficulty, isActive } = query;
    const { limit, skip } = pagination;

    const criteria = {};

    if (category) criteria.category = category;
    if (muscleGroup) criteria.muscleGroup = muscleGroup;
    if (difficulty) criteria.difficulty = difficulty;
    if (typeof isActive !== "undefined") {
      criteria.isActive = isActive === true || isActive === "true";
    }

    if (search) {
      criteria.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { muscleGroup: { $regex: search, $options: "i" } },
      ];
    }

    const sortObj = {};
    if (sort) {
      const fields = sort.split(",");
      fields.forEach((field) => {
        if (!field) return;
        if (field.startsWith("-")) {
          sortObj[field.substring(1)] = -1;
        } else {
          sortObj[field] = 1;
        }
      });
    } else {
      sortObj.createdAt = -1; // Default: newest first
    }

    return new Promise(function (resolve, reject) {
      // Use Promise.all for parallel execution
      Promise.all([
        ExerciseModel.find(criteria)
          .populate("createdBy", "name email")
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .exec(),
        ExerciseModel.countDocuments(criteria),
      ])
        .then(([exercises, total]) => {
          resolve({
            exercises,
            pagination: {
              pageSize: limit,
              page: Math.floor(skip / limit) + 1, // 1-indexed page
              hasMore: skip + limit < total,
              total,
            },
          });
        })
        .catch((err) => reject(err));
    });
  }

  /**
   * Remove exercise by ID
   * @param {String} id - Exercise ID
   * @returns {Promise} Success message
   */
  function removeById(id) {
    return new Promise(function (resolve, reject) {
      if (!id) {
        return reject(new Error("Exercise ID is required"));
      }

      // First check if exercise exists
      ExerciseModel.findById(id)
        .then((exercise) => {
          if (!exercise) {
            return reject(new Error("Exercise not found"));
          }

          // Use findByIdAndDelete (modern method)
          return ExerciseModel.findByIdAndDelete(id);
        })
        .then(() => {
          resolve({ message: "Exercise deleted successfully" });
        })
        .catch((err) => reject(err));
    });
  }

  return service;
}

module.exports = ExerciseService;

