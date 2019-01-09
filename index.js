const PNG = require("pngjs").PNG;
const gm = require('GM');
const chroma = require('chroma-js');
const chalk = require('chalk');
const moment = require('moment');
const d3m = require('./d3.module.js')
const svg2pdf = require('./svg2pdf');

let fileName = 'balle';

let pageProps = {
  width: 297,
  height: 420,
  mmSquare: 8,
  spacing: 1.4,
  minPadding: 15,
  gPerStone: 0.8,
  flip: true
}

// *****************************
// * Get size and image buffer *
// *****************************
const getImageData = pathToImage => {
  return new Promise((resolve, reject) => {
    let img = gm(pathToImage);
    img.toBuffer("PNG", (err, buff) => {
      if (err) return reject(err)
      img.size((err, size) => {
        if (err) return reject(err)
        let str = new PNG();
        str.end(buff);
        str.on("parsed", buffer => resolve({size, buffer}));
        str.on("error", err => reject(err));
      });
    });
  })
}

// ***************************************
// * Get array of colors, and color info *
// ***************************************
const getColorArray = ({buffer, size}) => {
  let pixArr = [];
  let colors = {};
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      let idx = (size.width * y + x) << 2;
      let rgb = {
        r: buffer[idx],
        g: buffer[idx + 1],
        b: buffer[idx + 2]
      };
      let hex = chroma(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`).hex();
      if (!colors[hex]) {
        colors[hex] = {
          count: 0,
          number: Object.keys(colors).length + 1 
        };
      }
      colors[hex].count ++;
      pixArr.push(hex);
    }
  }
  return {pixArr, colors};
}


// ***********************
// * For console logging *
// ***********************
const logIt = ({ size, pixArr, colors, props }) => {

  let space = '\t';

  console.log('')
  console.log(chalk.yellow(`${space}-----------------------------`))
  console.log(chalk.yellow(`${space}No of pixels: \t`), chalk.green(size.width * size.height))
  console.log(chalk.yellow(`${space}Approx weight: \t`), chalk.green(Math.round((size.width * size.height)) * props.gPerStone + 'g'))
  
  console.log(chalk.yellow(`${space}Width:  \t`), chalk.green(size.width + 'px'))
  console.log(chalk.yellow(`${space}Height: \t`), chalk.green(size.height + 'px'))

  console.log(chalk.yellow(`${space}Width:  \t`), chalk.green(size.width * props.mmSquare + 'mm'))
  console.log(chalk.yellow(`${space}Height:  \t`), chalk.green(size.height * props.mmSquare + 'mm'))

  console.log(chalk.yellow(`${space}Colors: \t`), chalk.green(Object.keys(colors).length))
  console.log(chalk.yellow(`${space}-----------------------------`))
  console.log('')

  Object.keys(colors).forEach(k => {
    console.log(chalk.yellow(`${space}Color number: \t` + chalk.green(colors[k].number)))
    console.log(chalk.yellow(`${space}Color sample: \t` + chalk.hex(k).inverse(`       `)))
    console.log(chalk.yellow(`${space}Value:\t\t`) + chalk.green(k))
    console.log(chalk.yellow(`${space}Amount:\t\t`) + chalk.green(colors[k].count))
    console.log(chalk.yellow(`${space}Weight:\t\t`) + chalk.green(Math.round(colors[k].count * props.gPerStone) + 'g'))
    console.log('')
  })


  console.log(JSON.stringify(size, null, 2))
  console.log(JSON.stringify(colors, null, 2))
  console.log(JSON.stringify(props, null, 2))

}


const getProps = ({pageProps, size}) => {

  let p = pageProps;

  let hLines = Math.round((p.width - (p.minPadding*2))/p.mmSquare);
  let vLines = Math.round((p.height - (p.minPadding*2))/p.mmSquare);

  let hPadding = (p.width - (hLines*p.mmSquare)) / 2;
  let vPadding = (p.height - (vLines*p.mmSquare)) / 2;

  let sheetCol = size.width / hLines;
  let sheetRow = size.height / vLines;
  let totalSheets = Math.ceil(sheetCol) * Math.ceil(sheetRow);

  let squaresPerSheet = hLines * vLines;

  return {
    ...pageProps,
    hLines,
    vLines,
    hPadding,
    vPadding,
    sheetCol,
    sheetRow,
    totalSheets,
    squaresPerSheet,
    fileName
  }

}

const runIt = async (pathToImage) => {

  let start = moment().format('x');

  // ----------------
  // Get image buffer
  // ----------------
  let imgData;
  try {
    imgData = await getImageData(pathToImage)
  } catch (err) {
    console.log('ERROR')
  }
  let { size, buffer } = imgData;

  // -------------------
  // Get array of colors
  // -------------------
  let { pixArr, colors } = getColorArray({buffer, size});

  // -------------------
  // Get page properties
  // -------------------
  let props = getProps({pageProps, size})

  // --------------
  // log everything
  // --------------
  logIt({ size, pixArr, colors, props })

  // ------------
  // Create SVG's
  // ------------
  try {
    await d3m({props, pixArr, colors, size})
  } catch (err) {
    console.log(err)
  }

  // ----------
  // Create PDF
  // ----------
  try {
    let fileArr = [];
    for (let i = 0; i<props.totalSheets; i++) {
      fileArr.push(`./SVG/${fileName}-${i}.svg`)
    }
    await svg2pdf({size, fileArr, props})
  } catch (err) {
    console.log(err)
  }

  let diff = moment().format('x') - start;
  console.log(chalk.red(`\tProcess tok ${diff}ms\n`))

}

// Example usage: node index.js test.png
runIt(process.argv[2])



