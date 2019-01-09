const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');
const fs = require('fs-extra');
const aS = require('async')

const getSize = n => {
  return n * (72/25.4);
}

const svgConvertor = async ({fileArr, props}) => {

  console.log('\n\n***********\nWRITING PDF\n***********\n\n')

  return new Promise((resolve, reject) => {

    let doc = new PDFDocument({
      size: [
        getSize(props.width),
        getSize(props.height)
      ],
    });
    let stream = fs.createWriteStream(`./PDF/${props.fileName}.pdf`);

    aS.map(fileArr, async f => {

      let svg = await fs.readFile(f, "utf8");
      SVGtoPDF(doc, svg, 0, 0);
      doc.addPage()
      console.log(`File added: ${f}`)

    }, (err, res) => {

      if (err) return reject(err)
      
      doc.pipe(stream)
      doc.end();
      resolve('ok')

    })

  })

}


module.exports = svgConvertor;



