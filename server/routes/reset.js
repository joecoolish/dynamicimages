const express = require("express");
const fs = require("fs");
const router = express.Router();
const testFolder = process.env.IMG_TO_PROCESS_FOLDER || "/usr/src/imgsToProc";
const rawFolder = process.env.IMG_RAW || "/usr/src/imgsRaw";

/* GET api listing. */
router.get("/", (req, res) => {
  const imgProc = new imageProcessor(newFile);
});

module.exports = router;
