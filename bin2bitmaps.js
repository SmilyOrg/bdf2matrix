const fs = require('fs');
const PNG = require('pngjs').PNG;
const bmp = require('bmp-js');

const fd = fs.openSync("weather.bin", "r");
const size = fs.fstatSync(fd).size;
const buffer = new Buffer(size);
fs.readSync(fd, buffer, 0, size, null);

const images = size / 8;
let index = 0;
for (let ii = 0; ii < images; ii++) {
    const png = new PNG({ width: 8, height: 8 });
    for (let ri = 0; ri < 8; ri++) {
        const byte = buffer.readUInt8(index++);
        for (let bi = 0; bi < 8; bi++) {
            const bit = (byte >> bi) & 1;
            png.data[(bi + ri*8)*4 + 0] = !bit * 0xFF;
            png.data[(bi + ri*8)*4 + 1] = !bit * 0xFF;
            png.data[(bi + ri*8)*4 + 2] = !bit * 0xFF;
            png.data[(bi + ri*8)*4 + 3] = 0xFF;
        }
    }
    fs.writeFile(
        `bitmaps/${ii}.bmp`,
        bmp.encode({
            width: 8,
            height: 8,
            data: png.data
        }).data
    );
    png.pack().pipe(fs.createWriteStream(`bitmaps/${ii}.png`))
}