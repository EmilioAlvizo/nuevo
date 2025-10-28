// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");
// const crypto = require("crypto");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//   const id = req.revistaId || Date.now();
//   let folder = "";

//   if (file.fieldname === "portada") folder = `public/revistas_portadas/${id}`;
//   if (file.fieldname === "archivo") folder = `public/revistas_archivos/${id}`;

//   fs.mkdirSync(folder, { recursive: true });
//   cb(null, folder);
// },

//   filename: (req, file, cb) => {
//     const timestamp = Date.now();
//     const hash = crypto.randomBytes(8).toString("hex");
//     const ext = path.extname(file.originalname);
//     cb(null, `${timestamp}_${hash}${ext}`);
//   }
// });

// const upload = multer({ storage });
// module.exports = upload;

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Usamos carpeta temporal si no hay ID
    const folderBase = file.fieldname === "portada" ? "public/revistas_portadas" : "public/revistas_archivos";
    const folder = req.revistaId ? `${folderBase}/${req.revistaId}` : folderBase;

    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const hash = crypto.randomBytes(8).toString("hex");
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}_${hash}${ext}`);
  }
});

const upload = multer({ storage });

module.exports = upload;
