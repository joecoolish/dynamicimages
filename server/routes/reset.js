const express = require("express");
const path = require("path");
const router = express.Router();
const imageProcessor = require("../processors/imageProcessor");
const testFolder = process.env.IMG_TO_PROCESS_FOLDER || "/dbelocal/input";
const rawFolder = process.env.IMG_RAW || "/dbelocal/raw";

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
