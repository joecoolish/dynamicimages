const fs = require("fs"); //Load the filesystem module
const sharp = require("sharp");
const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");
const path = require("path");
const rawFolder = process.env.IMG_RAW || "/dbelocal/raw";
const tempFolder = process.env.TEMP_IMGS || "/dbelocal/temp/";

const maxBytes = 4194304;

if (!fs.existsSync(tempFolder)) {
  fs.mkdirSync(tempFolder);
}

class ImageProcessor {
  constructor(path) {
    this._path = path;
  }

  copyFile(source, target, override, resolved) {
    return new Promise((resolve, reject) => {
      fs.exists(target, exists => {
        if (exists && !override) {
          if (resolved) {
            resolved();
          }
          resolve();
          return;
        }

        const rd = fs.createReadStream(source, {
          autoClose: true
        });
        rd.on("error", err => reject(err));
        const wr = fs.createWriteStream(target, {
          autoClose: true
        });
        wr.on("error", err => reject(err));
        wr.on("close", () => {
          if (resolved) {
            resolved();
          }
          resolve();
        });
        rd.pipe(wr);
      });
    });
  }

  copyImageToRaw() {
    console.log("Copying image to RAW folder");

    const fileName = path.basename(this._path);
    this._bigPath = path.join(rawFolder, fileName);

    return this.copyFile(this._path, this._bigPath, false);
  }

  waitFileReady(file, ms, retries) {
    return new Promise((resolve, reject) => {
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
  }

  deleteOriginal() {
    if (fs.existsSync(this._path)) {
      console.log("Deleting image");
      fs.unlinkSync(this._path);
    }
  }

  copyImageFromCompressed() {
    console.log("Copying image from RAW folder");

    return this.copyFile(this._bigPath + "comp", this._path, true);
  }

  async resizeImage() {
    let fileSize = this.getImageSize(this._path);
    const tempFile = path.join(tempFolder, path.basename(this._path));

    while (fileSize > maxBytes) {
      await this.copyFile(this._path, tempFile);
      //this.deleteOriginal();
      console.log("resizing: " + fileSize);
      const md = await sharp(tempFile).metadata();
      await sharp(tempFile)
        .resize(Math.floor(md.width * 0.9))
        .toFile(this._path);

      await this.compressImage(this._path);
      fileSize = this.getImageSize(this._path);
    }
  }

  async compressImage(imgPath) {
    //this.deleteOriginal();

    imgPath || (imgPath = this._bigPath);

    await this.waitFileReady(imgPath, 150, 10);
    const fileSize = await this.getImageSize(imgPath);
    console.log(`compressing image: ${imgPath}, Size: ${fileSize}`);

    switch (path.extname(this._bigPath).toLowerCase()) {

      case ".jpg":
        await sharp(imgPath)
          .jpeg({
            quality: 75,
            chromaSubsampling: "4:4:4"
          })
          .toFile(this._path);
        break;

      case ".png":

        try {
          await imagemin([imgPath], path.dirname(this._path), {
            plugins: [imageminPngquant({
              quality: "65-80"
            })]
          });
        } catch (error) {
          console.log("Error compressing image: " + imgPath);
          console.error(error);
        }
        break;
    }

    // switch (path.extname(this._bigPath).toLowerCase()) {
    //   case ".jpg":
    //     await sharp(this._bigPath)
    //       .jpeg({
    //         quality: 75,
    //         chromaSubsampling: "4:4:4"
    //       })
    //       .toFile(this._path);
    //     break;
    //   case ".png":
    //     await sharp(this._bigPath)
    //       .png({ compressionLevel: 9, adaptiveFiltering: true, force: true })
    //       .toFile(this._path);
    //     break;
    // }
  }

  getImageSize(path) {
    const stats = fs.statSync(path);
    return stats.size;
  }

  getImageMetadata(path) {
    return sharp(path).metadata();
  }

  async getUsableImage() {
    await this.copyImageToRaw();
    let fileSize = this.getImageSize(this._path);

    console.log("File size: " + fileSize);

    if (fileSize <= maxBytes) {
      return await this.getImageMetadata(this._path);
    }

    if (fileSize > maxBytes * 3) {
      console.log("File size too big, resizing");
      await this.resizeImage();
    } else {
      console.log("File size too big, compressing");

      await this.compressImage();
      fileSize = this.getImageSize(this._path);
      console.log("New file size: " + fileSize);

      if (fileSize <= maxBytes) {
        return await this.getImageMetadata(this._path);
      }
      console.log("File size too big, resizing");
      await this.resizeImage();
    }

    console.log("sending metadata");
    return await this.getImageMetadata(this._path);
  }
}

module.exports = ImageProcessor;
