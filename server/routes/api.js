const express = require("express");
const fs = require("fs");
const router = express.Router();
const testFolder = process.env.IMG_FOLDER || "/usr/src/imgs";
const rawFolder = process.env.IMG_RAW || "/usr/src/imgsRaw";

/* GET api listing. */
router.get("/", (req, res) => {
  let data = null;
  let raw = null;

  fs.readdir(testFolder, (error, files)=> {
    data = files;
    if(raw) {
      res.send({data, raw});
    }
  });

  fs.readdir(rawFolder, (error, files)=> {
    raw = files;
    if(data) {
      res.send({data, raw});
    }
  });
});

module.exports = router;
