// docker run --rm -p 5001:5000 --name facecontainer avccandidate.azurecr.io/cognitive-services-face
// docker run --rm -p 5000:5000 --name ocrcontainer avccandidate.azurecr.io/cognitive-services-recognize-text
// docker run --rm -v c:/imagesYOLO:/imagesToProcess/ -v c:/images:/darknet/dbesync/processed/ -p 12345:12345 --name yolocontainer joecoolish/yolo
// docker run --rm -p 3000:3000 --link yolocontainer:yolocontainer --link ocrcontainer:ocrcontainer --link facecontainer:facecontainer -v c:/imagesRaw:/usr/src/imgsRaw/ -v c:/imagesYOLO:/usr/src/imgsToProcYOLO/ -v c:/images:/usr/src/imgs/ -v c:/imagesToProcess:/usr/src/imgsToProc/ --name dynamicimages joecoolish/dynamic-images

const testFolder = process.env.IMG_TO_PROCESS_FOLDER || "/usr/src/imgsToProc";
const yoloFolder = process.env.IMG_YOLO_FOLDER || "/usr/src/imgsToProcYOLO";
const imgFolder = process.env.IMG_FOLDER || "/usr/src/imgs";
const chokidar = require("chokidar");
const request = require("request");
const imageProcessor = require("./imageProcessor");
const path = require("path");
const net = require("net");
const fs = require("fs");
const ocrUrl =
  process.env.OCR_URL ||
  "http://ocrcontainer:5000/vision/v2.0/recognizeTextDirect";
const faceUrl =
  process.env.FACE_URL || "http://facecontainer:5000/face/v1.0/detect";
const yoloHostname = process.env.YOLO_HOSTNAME || "yolocontainer";

let watcher = null;
let wsCollection = [];
let wsOpen = false;

var connection = net.createConnection(12345, yoloHostname); //new WebSocket('ws://172.17.0.2:12345');
var log = console.log.bind(console);

connection.on("connect", () => {
  wsOpen = true;
  log("Darknet Connection established");
  if (wsCollection.length > 0) {
    connection.write(wsCollection[0] + "\n", () => {
      wsCollection.splice(0, 1);
    });
  }
});

connection.on("close", () => {
  wsOpen = false;
  log("Darknet connection closed, retrying to connect in 5 seconds");
  const connectInterval = setTimeout(() => {
    if (wsOpen) {
      clearInterval(connectInterval);
      return;
    }

    log("Darknet connection retry");
    if (!connection.connecting) {
      connection.connect(
        12345,
        yoloHostname
      );
    }
  }, 5000);
});
// Log errors

connection.on("error", error => {
  console.error("TCP Error " + error);
});

// connection.onerror = function (error) {
//   console.error('WebSocket Error ' + error);
// };
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

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
      await snooze(500);

      const imgProc = new imageProcessor(newFile);
      const fileName = "/imagesToProcess/" + path.basename(newFile);

      const imageMetadata = await imgProc.getUsableImage();
      fs.exists(
        path.join(yoloFolder, path.basename(newFile)),
        async yoloCopyExisits => {
          if (!yoloCopyExisits) {
            await imgProc.copyFile(
              newFile,
              path.join(yoloFolder, path.basename(newFile))
            );
          }
        });

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
          console.log("Error reqOcr!");
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

            if (faceDone) {
              imgProc.deleteOriginal();
            }
          });
        }
      });
      const formOcr = reqOcr.form();
      formOcr.append("file", fs.createReadStream(newFile));

      const reqFace = request.post(faceUrl, (err, resp, body) => {
        if (err) {
          console.log("Error! reqFace");
          console.log(err);
          faceDone = true;
        } else {
          const obj = JSON.parse(body);
          const jsonFile = path.join(
            imgFolder,
            path.basename(newFile) + "-face.json"
          );
          fs.createWriteStream(jsonFile).write(
            JSON.stringify({ obj, imageMetadata }),
            () => {
              faceDone = true;
              console.log("Face File: " + jsonFile);

              if (ocrDone) {
                imgProc.deleteOriginal();
              }
            }
          );
        }
      });
      const formFace = reqFace.form();
      formFace.append("file", fs.createReadStream(newFile));
    });
  },
  stop: () => {
    // Stop watching.
    log("Watcher stopped");
    if (watcher) watcher.close();
  }
};
