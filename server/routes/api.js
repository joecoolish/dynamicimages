const express = require('express');
const fs = require("fs");
const router = express.Router();
const testFolder = '/usr/src/imgs';


/* GET api listing. */
router.get('/', (req, res) => {
  fs.readdir(testFolder, (err, files) => {
    res.send(files);
  })
});

module.exports = router;
