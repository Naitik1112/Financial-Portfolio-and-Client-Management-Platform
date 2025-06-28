const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const generatePDF = async (data, filePath, res, fields, title, space) => {
  try {
    // console.log(data);
    console.log('generate PDF');
    // console.log(fields);
    // console.log(space);
    const doc = new PDFDocument({
      margin: 30,
      size: 'A4',
      layout: 'landscape'
    });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(title, { align: 'center', underline: true });
    doc.moveDown(1);

    const tableTop = doc.y;
    const maxWidth = 720;
    const headers = ['SrNo', ...fields.map(field => field.label)];

    const isNumber = value => !isNaN(value) && typeof value !== 'object';

    const columnWidths = headers.map((header, index) => {
      const contentWidths = data.map(item => {
        const text =
          index === 0
            ? String(item[index] || '')
            : String(item[fields[index - 1].value] || space);
        return doc.widthOfString(text, { fontSize: 8 });
      });

      const maxContentWidth = Math.max(
        ...contentWidths,
        doc.widthOfString(header, { fontSize: 8 })
      );
      return index === 0 || isNumber(data[0][fields[index - 1].value])
        ? Math.max(40, maxContentWidth + 10, 130)
        : Math.max(160, maxContentWidth + 10, 125);
    });

    const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const scaleFactor = Math.min(maxWidth / totalWidth, 1);
    const adjustedColumnWidths = columnWidths.map(width => width * scaleFactor);

    const startX =
      (doc.page.width -
        adjustedColumnWidths.reduce((sum, width) => sum + width, 0)) /
      2;

    const calculateHeight = (text, width, fontSize) =>
      doc.heightOfString(text, { width: width - 10, fontSize: fontSize }) + 10;

    let maxHeaderHeight = Math.max(
      ...headers.map(
        header =>
          calculateHeight(
            header,
            adjustedColumnWidths[headers.indexOf(header)],
            8
          ) * 0.6
      )
    );

    headers.forEach((header, index) => {
      const x =
        startX +
        adjustedColumnWidths
          .slice(0, index)
          .reduce((sum, width) => sum + width, 0);
      doc
        .rect(x, tableTop, adjustedColumnWidths[index], maxHeaderHeight)
        .stroke();
      doc.fontSize(8).text(header, x + 5, tableTop + 5, {
        width: adjustedColumnWidths[index] - 10,
        align: 'center'
      });
    });

    const addDataRows = (data, startY) => {
      let yPos = startY;
      data.forEach((item, rowIndex) => {
        const row = [
          rowIndex + 1,
          ...fields.map(field => String(item[field.value] || space))
        ];
        const rowHeight = Math.max(
          ...row.map((cell, index) =>
            calculateHeight(cell, adjustedColumnWidths[index], 8)
          )
        );

        if (yPos + rowHeight > doc.page.height - 30) {
          doc.addPage({ margin: 30, size: 'A4', layout: 'landscape' });
          yPos = 30;
          headers.forEach((header, index) => {
            const x =
              startX +
              adjustedColumnWidths
                .slice(0, index)
                .reduce((sum, width) => sum + width, 0);
            doc
              .rect(x, yPos, adjustedColumnWidths[index], maxHeaderHeight)
              .stroke();
            doc.fontSize(8).text(header, x + 5, yPos + 5, {
              width: adjustedColumnWidths[index] - 10,
              align: 'center'
            });
          });
          yPos += maxHeaderHeight;
        }

        const rowTop = yPos;
        row.forEach((cell, cellIndex) => {
          const x =
            startX +
            adjustedColumnWidths
              .slice(0, cellIndex)
              .reduce((sum, width) => sum + width, 0);
          doc
            .rect(x, rowTop, adjustedColumnWidths[cellIndex], rowHeight)
            .stroke();
          doc.fontSize(8).text(cell, x + 5, rowTop + 5, {
            width: adjustedColumnWidths[cellIndex] - 10,
            align: 'center'
          });
        });
        yPos += rowHeight;
      });
    };

    addDataRows(data, tableTop + maxHeaderHeight);
    doc.end();

    writeStream.on('finish', () => {
      res.download(filePath, path.basename(filePath), err => {
        if (!err) fs.unlinkSync(filePath);
      });
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating PDF');
  }
};

module.exports = generatePDF;
