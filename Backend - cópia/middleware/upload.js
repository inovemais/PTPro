const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Criar diretório de uploads se não existir
const uploadDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadDir);

// Configuração do storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Gerar nome único para o ficheiro
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filtro de tipos de ficheiro permitidos
const fileFilter = (req, file, cb) => {
  // Permitir apenas imagens por padrão
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Tipo de ficheiro não permitido! Apenas imagens e documentos são aceites.'));
  }
};

// Configuração do multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// Middleware para upload de um único ficheiro
const uploadSingle = (fieldName = 'file') => {
  return upload.single(fieldName);
};

// Middleware para upload de múltiplos ficheiros
const uploadMultiple = (fieldName = 'files', maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

// Middleware para upload de múltiplos campos
const uploadFields = (fields) => {
  return upload.fields(fields);
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  upload
};

