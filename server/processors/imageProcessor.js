const fs = require("fs"); //Load the filesystem module
const sharp = require("sharp");
const path = require("path");
const rawFolder = process.env.IMG_RAW || "/usr/src/imgsRaw";

const maxBytes = 4194304;

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

        const rd = fs.createReadStream(source);
        rd.on("error", err => reject(err));
        const wr = fs.createWriteStream(target);
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

  deleteOriginal() {
    console.log("Deleting image");
    fs.unlinkSync(this._path);
  }

  copyImageFromCompressed() {
    console.log("Copying image from RAW folder");

    return this.copyFile(this._bigPath + "comp", this._path, true);
  }

  async resizeImage() {
    this.deleteOriginal();
    console.log("resizing");
    await sharp(this._bigPath)
      .resize(1024)
      .toFile(this._path);
  }

  async compressImage() {
    this.deleteOriginal();

    switch (path.extname(this._bigPath).toLowerCase()) {
      case ".jpg":
        await sharp(this._bigPath)
          .jpeg({
            quality: 75,
            chromaSubsampling: "4:4:4"
          })
          .toFile(this._path);
        break;
      case ".png":
        await sharp(this._bigPath)
          .png({ compressImage: 9 })
          .toFile(this._path);
        break;
    }
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

    if (fileSize > maxBytes * 2) {
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
