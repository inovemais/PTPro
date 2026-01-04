function MemberService(MemberModel) {
  const service = {
    create,
    findAll,
    findById,
    findMemberByTaxNumber,
    update,
    removeById,
  };

  /**
   * Create a new member
   * @param {Object} member - Member data
   * @returns {Promise} Created member
   */
  function create(member) {
    return new Promise(function (resolve, reject) {
      // Validate required fields
      if (member.taxNumber === undefined) {
        return reject(new Error("taxNumber is required"));
      }

      // Check if member already exists with this tax number
      MemberModel.findOne({ taxNumber: member.taxNumber })
        .then((existing) => {
          if (existing) {
            return reject(new Error("Member with this tax number already exists"));
          }

          // Create new member
          const model = new MemberModel(member);
          return save(model);
        })
        .then((result) => resolve(result))
        .catch((err) => reject(err));
    });
  }

  /**
   * Save member model to database
   * @param {Object} model - Mongoose model instance
   * @returns {Promise} Saved member
   */
  function save(model) {
    return new Promise(function (resolve, reject) {
      model.save(function (err) {
        if (err) {
          console.error("Error saving member:", err);
          return reject(new Error("There is a problem with register"));
        }

        resolve({
          message: "Member Created",
          member: model,
        });
      });
    });
  }

  /**
   * Find all members with pagination
   * @param {Object} pagination - Pagination { limit, skip }
   * @returns {Promise} Object with members array and pagination info
   */
  function findAll(pagination) {
    const { limit, skip } = pagination;

    return new Promise(function (resolve, reject) {
      // Use Promise.all for parallel execution
      Promise.all([
        MemberModel.find({})
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        MemberModel.countDocuments({}),
      ])
        .then(([members, total]) => {
          resolve({
            members: members,
            pagination: {
              pageSize: limit,
              page: Math.floor(skip / limit) + 1, // 1-indexed page
              hasMore: skip + limit < total,
              total: total,
            },
          });
        })
        .catch((err) => reject(err));
    });
  }

  /**
   * Find member by ID
   * @param {String} id - Member ID
   * @returns {Promise} Member object
   */
  function findById(id) {
    return new Promise(function (resolve, reject) {
      if (!id) {
        return reject(new Error("Member ID is required"));
      }

      MemberModel.findById(id, function (err, member) {
        if (err) {
          return reject(new Error("Error finding member by id"));
        }

        if (!member) {
          return reject(new Error("Member not found"));
        }

        resolve(member);
      });
    });
  }

  /**
   * Find member by tax number
   * @param {Number} taxNumber - Tax number
   * @returns {Promise} Member object with user info
   */
  function findMemberByTaxNumber(taxNumber) {
    return new Promise(function (resolve, reject) {
      if (!taxNumber) {
        return reject(new Error("Tax number is required"));
      }

      MemberModel.findOne({ taxNumber: taxNumber })
        .populate("users")
        .exec(function (err, member) {
          if (err) {
            return reject(new Error("Error finding member by tax number"));
          }

          if (!member) {
            return resolve(null);
          }

          resolve({
            member: member,
            user: member.user,
          });
        });
    });
  }

  /**
   * Update member by ID
   * @param {String} id - Member ID
   * @param {Object} member - Update data
   * @returns {Promise} Updated member
   */
  function update(id, member) {
    return new Promise(function (resolve, reject) {
      if (!id) {
        return reject(new Error("Member ID is required"));
      }

      // Find member first to ensure it exists
      MemberModel.findById(id)
        .then((existing) => {
          if (!existing) {
            return reject(new Error("Member not found"));
          }

          // Clean undefined fields
          const cleanData = {};
          Object.keys(member).forEach((key) => {
            if (member[key] !== undefined) {
              cleanData[key] = member[key];
            }
          });

          // Don't allow updating taxNumber if it would create a duplicate
          if (cleanData.taxNumber && cleanData.taxNumber !== existing.taxNumber) {
            return MemberModel.findOne({ taxNumber: cleanData.taxNumber }).then(
              (duplicate) => {
                if (duplicate) {
                  return reject(
                    new Error("Member with this tax number already exists")
                  );
                }
                return MemberModel.findByIdAndUpdate(
                  id,
                  cleanData,
                  { new: true, runValidators: true }
                );
              }
            );
          }

          return MemberModel.findByIdAndUpdate(
            id,
            cleanData,
            { new: true, runValidators: true }
          );
        })
        .then((updated) => {
          if (!updated) {
            return reject(new Error("Member not found"));
          }
          resolve(updated);
        })
        .catch((err) => {
          console.error("Error updating member:", err);
          reject(err);
        });
    });
  }

  /**
   * Remove member by ID
   * @param {String} id - Member ID
   * @returns {Promise} Success message
   */
  function removeById(id) {
    return new Promise(function (resolve, reject) {
      if (!id) {
        return reject(new Error("Member ID is required"));
      }

      // First check if member exists
      MemberModel.findById(id)
        .then((member) => {
          if (!member) {
            return reject(new Error("Member not found"));
          }

          // Use findByIdAndDelete (modern method)
          return MemberModel.findByIdAndDelete(id);
        })
        .then(() => {
          resolve({ message: "Member deleted successfully" });
        })
        .catch((err) => {
          console.error("Error removing member:", err);
          reject(new Error("Does not possible remove"));
        });
    });
  }

  return service;
}

module.exports = MemberService;
