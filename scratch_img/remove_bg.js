const { Jimp } = require("jimp");
const path = require("path");

async function processImage() {
  try {
    const imgPath = path.resolve(__dirname, "../public/assets/images/logo.png");
    console.log("Loading image:", imgPath);
    const image = await Jimp.read(imgPath);
    
    // Scan all pixels
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      // Calculate max color component for unmultiply alpha
      const maxColor = Math.max(red, green, blue);
      
      if (maxColor === 0) {
        // Pure black -> completely transparent
        this.bitmap.data[idx + 3] = 0;
      } else {
        // Set alpha to max color (luminance proxy)
        this.bitmap.data[idx + 3] = maxColor;
        
        // Unmultiply RGB so that it retains color when blended
        // Wait, for neon, we typically amplify the color slightly so it doesn't wash out
        this.bitmap.data[idx + 0] = Math.min(255, (red / maxColor) * 255);
        this.bitmap.data[idx + 1] = Math.min(255, (green / maxColor) * 255);
        this.bitmap.data[idx + 2] = Math.min(255, (blue / maxColor) * 255);
      }
    });

    const outPath = path.resolve(__dirname, "../public/assets/images/logo_transparent.png");
    image.write(outPath);
    console.log("Saved transparent image to", outPath);
  } catch (error) {
    console.error("Error processing image:", error);
  }
}

processImage();
