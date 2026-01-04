const { sendSuccess, sendError, sendValidationError } = require("../../utils/response");
const path = require("path");

function uploadSingle(req, res) {
  try {
    if (!req.file) {
      return sendValidationError(res, "No file uploaded");
    }

    // Determine upload type and subdirectory
    const uploadType = req.body.type || "general";
    const subDir = uploadType === "workout" ? "workouts" : 
                   uploadType === "profile" ? "profiles" : 
                   uploadType === "document" ? "documents" : "";
    
    const fileUrl = subDir ? `/uploads/${subDir}/${req.file.filename}` : `/uploads/${req.file.filename}`;
    const filePath = req.file.path;

    sendSuccess(
      res,
      {
        url: fileUrl,
        path: filePath,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        type: uploadType,
      },
      {},
      201
    );
  } catch (error) {
    sendError(res, error, 500);
  }
}

function uploadMultiple(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return sendValidationError(res, "No files uploaded");
    }

    // Determine upload type and subdirectory
    const uploadType = req.body.type || "general";
    const subDir = uploadType === "workout" ? "workouts" : 
                   uploadType === "profile" ? "profiles" : 
                   uploadType === "document" ? "documents" : "";

    const files = req.files.map((file) => ({
      url: subDir ? `/uploads/${subDir}/${file.filename}` : `/uploads/${file.filename}`,
      path: file.path,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      type: uploadType,
    }));

    sendSuccess(res, files, {}, 201);
  } catch (error) {
    sendError(res, error, 500);
  }
}

module.exports = {
  uploadSingle,
  uploadMultiple,
};
