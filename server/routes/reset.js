const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const imageProcessor = require("../processors/imageProcessor");
const testFolder = process.env.IMG_TO_PROCESS_FOLDER || "/dbelocal/input";
const rawFolder = process.env.IMG_RAW || "/dbelocal/raw";

/* GET api listing. */
router.get("/:file", (req, res) => {
  const output = path.join(testFolder, req.params.file);
  const input = path.join(rawFolder, req.params.file);
  const imgProc = new imageProcessor(input);

  if(fs.existsSync(output)) {
    fs.unlinkSync(output);
  }

  imgProc.copyFile(
    input,
    output
  ).then(() => {
    res.redirect('/')
  });
});

module.exports = router;
