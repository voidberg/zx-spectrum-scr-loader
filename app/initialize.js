import _ from 'lodash';
import Rx from 'rxjs';

let canvas;
let cw;
let ch;
let cx;

const scale = 3;

let imageData;
let colorData;
const pixmap = [];
const colors = [
  'black',
  'blue',
  'darkred',
  'darkmagenta',
  'green',
  'cyan',
  'yellow',
  'whitesmoke',
  'black',
  'lightblue',
  'red',
  'magenta',
  'greenyellow',
  'lightcyan',
  'lightyellow',
  'white',    
];

let tape$;
let dataPos = 0;
let colorPos = 0;
const INTERVAL_COLOR = 50;
const INTERVAL_IMAGE = 50;
const SIMULATE_TAPE = true;

const getY = (offset) => {
  return ((offset >> 11) << 6)
      + ((offset % 2048) >> 8)
      + ((((offset % 2048) >> 5) - ((offset % 2048) >> 8 << 3)) << 3);
}

const getX = (offset) => {
  return (offset % 32) << 3;
}

const drawImageStart = () => {
  const chunks = _.chunk(imageData, 16);
  tape$ = new Rx.Observable.from(chunks);

  if (SIMULATE_TAPE) {
    tape$.zip(Rx.Observable.interval(INTERVAL_IMAGE), function(x, y) { return x; })
      .subscribe(drawImage, undefined, drawImageEnd);
  } else {
    tape$
      .subscribe(drawImage, undefined, drawImageEnd);
  }
};

const drawImageEnd = () => {
  drawColorsStart();
};

const drawImage = (bytes) => {
  let color;

  bytes.forEach((data) => {
    pixmap[getX(dataPos) >> 3][getY(dataPos)] = data;
    
    for(var currentByte=0; currentByte < 8; currentByte++) {
      const x = getX(dataPos) + currentByte;
      const y = getY(dataPos);

      if ((data & (128 >> currentByte))) {
        color = colors[7];
      } else {
        color = colors[0];
      }

      cx.beginPath();
      cx.fillStyle = color;
      cx.fillRect(x * scale, y * scale, scale, scale);
    }

    dataPos++;
  });
};

const drawColorsStart = () => {
  const chunks = _.chunk(colorData, 16);
  tape$ = new Rx.Observable.from(chunks);

  if (SIMULATE_TAPE) {
    tape$.zip(Rx.Observable.interval(INTERVAL_COLOR), function(x, y) { return x; })
      .subscribe(drawColors);
  } else {
    tape$
      .subscribe(drawColors);
  }
};

const drawColors = (bytes) => {
  let color;

  bytes.forEach((data) => {
    for(let y=0; y<8; y++) {
      for(let x=0; x<8; x++) {
        if ((pixmap[(colorPos % 32)][((colorPos >> 5) << 3) + y]) & (128 >> x)) {
          color = colors[(data & 7) + 8 * (data >> 6 & 1)];
        } else {
          color = colors[(data >> 3 & 7) + 8 * (data >> 6 & 1)];
        }

        cx.beginPath();
        cx.fillStyle = color;

        const ux = ((colorPos % 32) << 3) + x;
        const uy = ((colorPos >> 5) << 3) + y;
        const w = ((colorPos % 32) << 3) + x + 1 - ((colorPos % 32) << 3) + x;
        const h = ((colorPos / 32) << 3) + y + 1 - ((colorPos >> 5) << 3) + y;

        cx.fillRect(ux * scale, uy * scale, w * scale, h * scale);
      }
    }

    colorPos++;
  });
};

document.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('canvas');
  cx = canvas.getContext('2d');
  cw = canvas.width;
  ch = canvas.height;

  for (var i = 0; i < 32; i++) {
    pixmap[i] = [];
  }

  fetch('./GlugGlug.scr')  
    .then(function(response) {
      var reader = response.body.getReader();

      reader.read().then(function(result) {
        imageData = result.value.slice(0, 6144);
        colorData = result.value.slice(6144);
  
        drawImageStart();
      });
    })  
    .catch(function(err) {  
      console.log('Fetch Error :-S', err);  
    });
});
