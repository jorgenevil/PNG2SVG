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
    flip
  } = props;

  let {
    row,
    col,
    index
  } = sheetProps;


  // if (row !== 0) return;
  // if (col !== 8) return;

  return new Promise((resolve, reject) => {

    // Add these amount of pixels per row...
    let addForRow = row * (size.width * vLines);

    // Find top left pixel
    let start = (hLines * col) + addForRow;

    // Create D3 node
    let d3n = new D3Node();

    // Create SVG canvas
    let svg = d3n.createSVG(width, height);

    // Greate group
    let g = svg.append('g');

    // If flip, flip
    if (flip) {
      g.attr('transform', `scale(-1, 1) translate(-${width}, 0)`)
    }
    
    // Put footer
    g.append('text')
      .attr("y", height - vPadding + 8)
      .attr("x", width/2)
      .attr("fill", "#999")
      .attr("font-size", "3px")
      .attr("text-anchor", "middle")
      .text(`sheet no. ${index} / col ${col} / row ${row}`)

    // -----------------------
    // Create horizontal lines
    // -----------------------
    for (let i = 0; i < (hLines+1); i++) {
      let nn = ((col*hLines) + i) / 10;
      let color = nn % 1 === 0 ? 'red' : '#999';
      g.append('line')
        .attr("x1", hPadding + (i*mmSquare))
        .attr("y1", vPadding)
        .attr("x2", hPadding + (i*mmSquare))
        .attr("y2", height - vPadding)
        .attr("stroke", color)
        .attr("stroke-width", 0.3);
    }

    // ---------------------
    // Create vertical lines
    // ---------------------
    for (let i = 0; i < (vLines+1); i++) {
      let nn = ((row*vLines) + i) / 10;
      let color = nn % 1 === 0 ? 'red' : '#999';
      g.append('line')
        .attr("x1", hPadding)
        .attr("y1", vPadding + (i*mmSquare))
        .attr("x2", width - hPadding)
        .attr("y2", vPadding + (i*mmSquare))
        .attr("stroke", color)
        .attr("stroke-width", 0.3);
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
          .attr("cy", vPadding + (mmSquare*o) + (mmSquare/2) )
          .attr("cx", hPadding + (mmSquare*i) + (mmSquare/2) )
          .attr("r", (mmSquare - spacing)/2)
          .attr("fill", color);

        // Write text
        let textColor = getContrast(pixArr[pixelNo])
        g.append('text')
          .attr("y", vPadding + (mmSquare*o) + (mmSquare/2) + 1)
          .attr("x", hPadding + (mmSquare*i) + (mmSquare/2))
          .attr("fill", textColor)
          .attr("font-size", "3px")
          .attr("text-anchor", "middle")
          .text(textVal)          
      }
    }

    let svgString = d3n.svgString();

    fs.writeFile(`./SVG/svgtest-${index}.svg`, svgString, err => {
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

