const express = require("express");
const path = require("path");
const router = express.Router();
const imageProcessor = require("../processors/imageProcessor");
const testFolder = process.env.IMG_TO_PROCESS_FOLDER || "/usr/src/imgsToProc";
const rawFolder = process.env.IMG_RAW || "/usr/src/imgsRaw";

/* GET api listing. */
router.get("/:file", (req, res) => {
  const imgProc = new imageProcessor(path.join(rawFolder, req.params.file));
  imgProc.copyFile(
    path.join(rawFolder, req.params.file),
    path.join(testFolder, req.params.file)
  ).then(() => {
    res.redirect('/')
  });
});

module.exports = router;
