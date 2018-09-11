// docker run --rm -p 5001:5000 avccandidate.azurecr.io/cognitive-services-face
// docker run --rm -p 5000:5000 avccandidate.azurecr.io/cognitive-services-recognize-text

const testFolder = process.env.IMG_TO_PROCESS_FOLDER || "/usr/src/imgsToProc";
const imgFolder = process.env.IMG_FOLDER || "/usr/src/imgs";
const chokidar = require("chokidar");
const request = require("request");
const imageProcessor = require("./imageProcessor");
const path = require("path");
const net = require("net");
const fs = require("fs");
const ocrUrl = process.env.OCR_URL ||  "http://localhost:5000/vision/v2.0/recognizeTextDirect";
const faceUrl = process.env.FACE_URL || "http://localhost:5001/face/v1.0/detect";

let watcher = null;
let wsCollection = [];
let wsOpen = false;

var connection = net.createConnection(12345, "127.0.0.1"); //new WebSocket('ws://172.17.0.2:12345');
var log = console.log.bind(console);

connection.on("connect", () => {
  wsOpen = true;
  log("Darknet Connection established");
  wsCollection.forEach(f => connection.write(f));
});

// Log errors

connection.on("error", error => {
  console.error("TCP Error " + error);
});

// connection.onerror = function (error) {
//   console.error('WebSocket Error ' + error);
// };

module.exports = {
  init: () => {
    // One-liner for current directory, ignores .dotfiles
    watcher = chokidar.watch(testFolder, {
      ignored: /(^|[\/\\])\../,
      persistent: true
    });

    // Something to use when events are received.
    // Add event listeners.
    watcher.on("add", async newFile => {
      log(`File ${newFile} has been added`);

      const imgProc = new imageProcessor(newFile);
      const fileName = "/imagesToProcess/" + path.basename(newFile);

      const imageMetadata = await imgProc.getUsableImage();

      if (wsOpen) {
        log("Connection Open, sending file: " + fileName);
        const writeSuccess = connection.write(fileName + "\n", () => {
          log("write callback for " + fileName);
        });

        log("writeSuccess: " + writeSuccess);
      } else {
        log("Connection Closed, caching file: " + fileName);
        wsCollection.push(fileName);
      }

      let faceDone = false;
      let ocrDone = false;

      const reqOcr = request.post(ocrUrl, (err, resp, body) => {
        if (err) {
          console.log("Error!");
          console.log(err);
          ocrDone = true;
        } else {
          const obj = JSON.parse(body);
          const jsonFile = path.join(
            imgFolder,
            path.basename(newFile) + "-ocr.json"
          );

          obj.imageMetadata = imageMetadata;
          fs.createWriteStream(jsonFile).write(JSON.stringify(obj), () => {
            ocrDone = true;
            console.log("OCR File: " + jsonFile);
          });
        }
      });
      const formOcr = reqOcr.form();
      formOcr.append("file", fs.createReadStream(newFile));

      const reqFace = request.post(faceUrl, (err, resp, body) => {
        if (err) {
          console.log("Error!");
          console.log(err);
          faceDone = true;
        } else {
          const obj = JSON.parse(body);
          const jsonFile = path.join(
            imgFolder,
            path.basename(newFile) + "-face.json"
          );
          fs.createWriteStream(jsonFile).write(JSON.stringify({ obj, imageMetadata }), () => {
            faceDone = true;
            console.log("Face File: " + jsonFile);
          });
        }
      });
      const formFace = reqFace.form();
      formFace.append("file", fs.createReadStream(newFile));
    });
  },
  stop: () => {
    // Stop watching.
    if (watcher) watcher.close();
  }
};
