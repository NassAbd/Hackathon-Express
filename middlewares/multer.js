const path = require("path");

// Gestionnaire d'upload avec Multer
const multer = require("multer");

const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

module.exports = upload;
