const fs = require('fs');
const D3Node = require('d3-node');
    
const getContrast = (hexcolor) => {
  if (!hexcolor) return "#FFFFFF";
  let r = parseInt(hexcolor.substr(0,2),16);
  let g = parseInt(hexcolor.substr(2,2),16);
  let b = parseInt(hexcolor.substr(4,2),16);
  let yiq = ((r*299)+(g*587)+(b*114))/1000;
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
}

const createSVGsheet = ({pixArr, colors, size, props, sheetProps}) => {
  
  let {
    width,
    height,
    mmSquare,
    spacing,
    minPadding,
    hLines,
    vLines,
    hPadding,
    vPadding,
    flip,
    fileName
  } = props;

  let {
    row,
    col,
    index
  } = sheetProps;


  // if (row !== 0) return;
  // if (col !== 8) return;

  return new Promise((resolve, reject) => {

    // Size
    let unit = 'mm';

    // Add these amount of pixels per row...
    let addForRow = row * (size.width * vLines);

    // Find top left pixel
    let start = (hLines * col) + addForRow;

    // Create D3 node
    let d3n = new D3Node();

    // Create SVG canvas
    let svg = d3n.createSVG(`${width}${unit}`, `${height}${unit}`);

    // Greate group
    let g = svg.append('g');

    // If flip, flip
    if (flip) {
      // I have no idea why the answer is -1120...
      g.attr('transform', `scale(-1, 1) translate(-1120mm, 0)`)
    }
    
    // Put footer
    g.append('text')
      .attr("y", (height - vPadding + 8) + unit)
      .attr("x", (width/2) + unit)
      .attr("fill", "#999")
      .attr("font-size", "10px")
      .attr("text-anchor", "middle")
      .text(`sheet no. ${index} / col ${col} / row ${row}`)

    // -----------------------
    // Create horizontal lines
    // -----------------------
    for (let i = 0; i < (hLines+1); i++) {
      let nn = ((col*hLines) + i) / 10;
      let color = nn % 1 === 0 ? 'red' : '#999';
      g.append('line')
        .attr("x1", (hPadding + (i*mmSquare)) + unit)
        .attr("y1", vPadding + unit)
        .attr("x2", (hPadding + (i*mmSquare)) + unit)
        .attr("y2", (height - vPadding) + unit)
        .attr("stroke", color)
        .attr("stroke-width", 1);
    }

    // ---------------------
    // Create vertical lines
    // ---------------------
    for (let i = 0; i < (vLines+1); i++) {
      let nn = ((row*vLines) + i) / 10;
      let color = nn % 1 === 0 ? 'red' : '#999';
      g.append('line')
        .attr("x1", hPadding + unit)
        .attr("y1", (vPadding + (i*mmSquare))  + unit)
        .attr("x2", (width - hPadding) + unit)
        .attr("y2", (vPadding + (i*mmSquare)) + unit)
        .attr("stroke", color)
        .attr("stroke-width", 1);
    }

    // --------------
    // Create circles
    // --------------
    for (let i = 0; i < hLines; i++) {
      for (let o = 0; o < vLines; o++) {

        let pixelNo = i+start + (o * size.width);

        // Stop at horizontal end
        let currentHPos = (hLines * col) + i;
        let addingH = currentHPos < size.width;

        // Stop at vertical end
        let isNotEnd = pixelNo <= pixArr.length;

        // Get color
        let color = "#fff";
        let textVal = '';
        if (addingH && isNotEnd) {
          color = pixArr[pixelNo];
          textVal = colors[pixArr[pixelNo]] ? colors[pixArr[pixelNo]].number : ''
        }

        // Write circle
        g.append('circle')
          .attr("cy", (vPadding + (mmSquare*o) + (mmSquare/2)) + unit )
          .attr("cx", (hPadding + (mmSquare*i) + (mmSquare/2)) + unit )
          .attr("r", ((mmSquare - spacing)/2) + unit )
          .attr("fill", color);

        // Write text
        // let textColor = getContrast(pixArr[pixelNo])

        g.append('text')
          .attr("y", (vPadding + (mmSquare*o) + (mmSquare/2) + 1) + unit )
          .attr("x", (hPadding + (mmSquare*i) + (mmSquare/2)) + unit )
          .attr("fill", "#000000")
          .attr("font-size", "10px")
          .attr("text-anchor", "middle")
          .text(textVal)

        g.append('text')
          .attr("y", (vPadding + (mmSquare*o) + (mmSquare/2) + 1 - 0.1) + unit)
          .attr("x", (hPadding + (mmSquare*i) + (mmSquare/2) - 0.1) + unit)
          .attr("fill", "#ffffff")
          .attr("font-size", "10px")
          .attr("text-anchor", "middle")
          .text(textVal)
      }
    }

    let svgString = d3n.svgString();

    fs.writeFile(`./SVG/${fileName}-${index}.svg`, svgString, err => {
      if (err) return reject('error writing file...');
      resolve(svgString)
    });

  })

}



const d3m = ({props, pixArr, colors, size}) => {

  let {
    sheetCol,
    totalSheets
  } = props;

  let promises = [];

  for (let i = 0; i < totalSheets; i++) {
    let row = Math.floor(i / Math.ceil(sheetCol));
    let col = i - (row * Math.ceil(sheetCol));
    let index = i;

    promises.push(createSVGsheet({
      pixArr,
      colors,
      size,
      props,
      sheetProps: {
        row,
        col,
        index
      }
    }))

  }

  return new Promise((resolve, reject) => {
    try {
      Promise.all(promises)
      .then(() => resolve('OK'))
    } catch (err) {
      reject(err)
    }
  })


}

module.exports = d3m;

