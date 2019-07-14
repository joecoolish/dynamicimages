if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const testFolder = process.env.IMG_TO_PROCESS_FOLDER || "/dbelocal/input";
const express = require("express"),
  router = express.Router(),
  multer = require("multer"),
  fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, testFolder);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    }
  }),
  uploadStrategy = multer({
    storage: fileStorage
  }).array("file[]", 50);

router.post("/", uploadStrategy, (req, res) => {
  console.log("files", req.files.map(f => f.filename));
  res.send(req.files);
});

module.exports = router;
