const BDF = require("bdfjs");
const Bitfield = require("bitfield");
const lpad = require("left-pad");

const fs = require("fs");
const util = require("util");

const library = (
  "\u00B7" + // periodcentered
  "0123456789" +
  " °<!" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
  "\u2602" + // umbrella
  "\u2600" + // sun
  "\u2601" + // cloud
  "\u2608" + // thunderstorm
  ""
);

function glyphToStruct(index, glyph) {
  const bitmap = glyph.bitmap;
  const w = 8;
  const h = 8;
  const l = w*h;
  const field = new Bitfield(l);
  for (let iy = 0; iy < bitmap.length; iy++) {
    const row = bitmap[iy];
    for (let ix = 0; ix < row.length; ix++) {
      field.set(l - 1 - (ix + iy * row.length), row[ix]);
    }
  }
  const hex = field.buffer.toString('hex');
  return (
    `/* ${lpad(index, 3)}  ${glyph.char} ${lpad(glyph.name, 8)} ${lpad(glyph.code, 4)} ${lpad("0x" + glyph.code.toString(16), 6)} */ ` +
    `{ ${glyph.boundingBox.x}, ${glyph.boundingBox.y}, ${glyph.boundingBox.width}, ${glyph.boundingBox.height}, 0x${hex} }`
  );
}

// const font = BDF.parse(fs.readFileSync("tom-thumb-ml.bdf"));
const font = BDF.parse(fs.readFileSync("C:/Users/Miha/Documents/tom-thumb-ml-6.bdf"));

const maxCodes = 256;
const codeColumns = 16;
const codeToGlyph = [];
const extraCodes = [];
for (let i = 0; i < maxCodes; i++) codeToGlyph[i] = null;

const structs = [];
for (let i = 0; i < library.length; i++) {
  const code = library.charCodeAt(i);
  const glyph = font.glyphs[code];
  if (!glyph) {
    console.error("Glyph not found for: " + code);
    continue;
  }
  structs.push(glyphToStruct(i, glyph));
  if (code >= 0 && code < maxCodes) {
    codeToGlyph[code] = i;
  } else {
    extraCodes.push([code, i]);
  }
}
const out = "" +
`// Generated using bdf2matrix
struct Glyph {
  char x;
  char y;
  char width;
  char height;
  uint64_t image;
};

const Glyph GLYPHS[] = {
  ${structs.join(",\n  ")}
};
const int GLYPH_NUM = ${structs.length};

const int CODE_TO_GLYPH[] = {
  ${codeToGlyph.reduce((acc, cur, index, arr) => {
    acc += lpad((cur === null ? 0 : cur), 3);
    if (index < arr.length - 1) {
      acc += ",";
      if ((index + 1) % codeColumns == 0) acc += "\n  ";
    }
    return acc;
  }, "")}
};
const int CODE_NUM = ${codeToGlyph.length};

int getGlyphIndexFromCode(int code) {
  if (code < 0) return 0;
  if (code < CODE_NUM) return CODE_TO_GLYPH[code];
  ${extraCodes.map(ex => `if (code == ${ex[0]}) return ${ex[1]};`).join("\n  ")}
  return 0;
}
`

fs.writeFileSync("glyphs.h", out);


// const font = new BDF();
// font.loadSync("tom-thumb.bdf");
// console.log(font.meta);
// console.log(font.glyphs);
// console.log(font.toString());