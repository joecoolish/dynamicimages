if (process.env.NODE_ENV !== "production") {
  require("dotenv").load();
}

const testFolder = process.env.IMG_TO_PROCESS_FOLDER || "/usr/src/imgsToProc";
const express = require("express"),
  router = express.Router(),
  multer = require("multer"),
  fileStorage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, testFolder);
    },
    filename: function(req, file, cb) {
      cb(null, file.originalname);
    }
  }),
  uploadStrategy = multer({
    storage: fileStorage
  }).array("file[]", 50);


router.post("/", uploadStrategy, (req, res) => {
  //console.log('files', req.files);
  res.send(req.files);
});

module.exports = router;
