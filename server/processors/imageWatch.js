// docker run --rm -p 5001:5000 --name facecontainer avccandidate.azurecr.io/cognitive-services-face
// docker run --rm -p 5000:5000 --name ocrcontainer avccandidate.azurecr.io/cognitive-services-recognize-text
// docker run --rm -v c:/imagesYOLO:/imagesToProcess/ -v c:/images:/darknet/dbesync/processed/ -p 12345:12345 --name yolocontainer joecoolish/yolo
// docker run --rm -p 3000:3000 --link yolocontainer:yolocontainer --link ocrcontainer:ocrcontainer --link facecontainer:facecontainer -v c:/imagesRaw:/usr/src/imgsRaw/ -v c:/imagesYOLO:/usr/src/imgsToProcYOLO/ -v c:/images:/usr/src/imgs/ -v c:/imagesToProcess:/usr/src/imgsToProc/ -v c:/Temp/imgs:/imgs/temp --name dynamicimages joecoolish/dynamic-images

const testFolder = process.env.IMG_TO_PROCESS_FOLDER || "/dbelocal/input";
const yoloFolder = process.env.IMG_YOLO_FOLDER || "/dbelocal/yolo_input";
const imgFolder = process.env.IMG_FOLDER || "/dbesync/processed";
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

connection.setKeepAlive(false);
connection.on("connect", () => {
  wsOpen = true;
  log("Darknet Connection established");
  if (wsCollection.length > 0) {
    connection.write(wsCollection[0] + "\n", () => {
      wsCollection.splice(0, 1);
      // connection.end();
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
const waitFileReady = (file, ms, retries) =>
  new Promise((resolve, reject) => {
    let loopInterval = 0;

    const loop = () => {
      fs.open(file, "r+", (err, fd) => {
        if (!err) {
          clearInterval(loopInterval);

          fs.close(fd, cerr => {
            if (cerr) reject(cerr);
            else resolve();
          });
          return;
        }

        retries--;

        if (retries <= 0) {
          reject(err);
        }
      });
    };

    loopInterval = setInterval(loop, ms || 500);
  });
const imagesProcessing = [];

const removeImageProcessing = file => {
  var index = imagesProcessing.indexOf(file);
  if (index > -1) {
    imagesProcessing.splice(index, 1);
  }
};

const imageProcessFunc = async newFile => {
  log(`File ${newFile} has been added`);
  imagesProcessing.push(path.basename(newFile));

  //await snooze(500);
  try {
    await waitFileReady(newFile, 100, 20);
  } catch (error) {
    log("waiting for file to be ready failed!");
    log(error);
  }

  const imgProc = new imageProcessor(newFile);
  const fileName = "/dbelocal/input/" + path.basename(newFile);

  let imageMetadata = null;
  try {
    imageMetadata = await imgProc.getUsableImage();
  } catch (error) {
    log("Getting usable image failed!");
    log(error);
  }
  const yoloFilePath = path.join(yoloFolder, path.basename(newFile));

  try {
    await imgProc.copyFile(newFile, yoloFilePath, false);
    await waitFileReady(newFile, 100, 20);
  } catch (error) {
    log("Copying file to YOLO directory failed!");
    log(error);
  }

  if (wsOpen) {
    wsOpen = false;
    log("Connection Open, sending file: " + fileName);
    const writeSuccess = connection.write(fileName + "\n", () => {
      log("write callback for " + fileName);
      // connection.end();
    });

    log("writeSuccess: " + writeSuccess);
  } else {
    log("Connection Closed, caching file: " + fileName);
    wsCollection.push(fileName);
  }

  let faceDone = false;
  let ocrDone = false;
  const newFileStream = fs.createReadStream(newFile, {
    autoClose: true
  });

  newFileStream.on("error", err => {
    log("newFileStream error!")
    log(err);
  });

  try {
    await waitFileReady(newFile, 250, 20);
  } catch (error) {
    log("waiting for file to add to reqOcr failed!");
    log(error);
  }

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
      fs.writeFile(jsonFile,
        JSON.stringify(obj),
        'utf8',
        (err) => {
          ocrDone = true;

          if (err) {
            console.log("An error occured while writing OCR JSON Object to File: " + jsonFile);
            console.log(err);
          }
          else {
            console.log("OCR File: " + jsonFile);
          }

          if (faceDone) {
            imgProc.deleteOriginal();
            removeImageProcessing(newFile);
          }
        }
      );
    }
  });

  const formOcr = reqOcr.form();
  formOcr.append("file", newFileStream);

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
      fs.writeFile(jsonFile,
        JSON.stringify({ obj, imageMetadata }),
        'utf8',
        (err) => {
          faceDone = true;

          if (err) {
            console.log("An error occured while writing Face JSON Object to File: " + jsonFile);
            console.log(err);
          }
          else {
            console.log("Face File: " + jsonFile);
          }

          if (ocrDone) {
            imgProc.deleteOriginal();
            removeImageProcessing(newFile);
          }
        }
      );
    }
  });

  const formFace = reqFace.form();
  formFace.append("file", newFileStream);
};

let timeout = null;

module.exports = {
  init: () => {
    // One-liner for current directory, ignores .dotfiles
    watcher = chokidar.watch(testFolder, {
      ignored: /(^|[\/\\])\../,
      persistent: true
    });

    watcher.on("all", (event, path) => {
      //console.log(event, path);
    });

    // Something to use when events are received.
    // Add event listeners.
    watcher.on("add", async newFile => {
      log("File Added: " + newFile);
      try {
        await imageProcessFunc(newFile);
      } catch (error) {
        log("watcher on add failed!");
        log(error);
      }
    });

    timeout = setInterval(async () => {
      let files = [];

      try {
        files = fs.readdirSync(testFolder);
      } catch (error) {
        if (error) {
          log("readdir failed in loop");
          log(error);
          return;
        }
      }

      if (!files || files.length === 0) return;

      const filesToProcess = files.filter(
        f => imagesProcessing.indexOf(f) < 0
      );

      const ftpLeng = filesToProcess.length;
      for (let i = 0; i < ftpLeng; i++) {
        let val = path.join(testFolder, filesToProcess[i]);
        log("Found file that slipped through! " + val);

        try {
          await waitFileReady(val, 100, 20);
          await imageProcessFunc(val);
        } catch (error) {
          log("Slipped file wait failed!")
          log(error);
        }
      }
    }, 1000);
  },
  stop: () => {
    // Stop watching.
    log("Watcher stopped");
    if (watcher) watcher.close();
    if (timeout) clearInterval(timeout);
  }
};
