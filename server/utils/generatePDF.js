const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { sendEmailWithPDF } = require('./email');

const generatePDF = async (
  data,
  filePath,
  res,
  fields,
  title,
  space,
  email = null,
  subject = null,
  description = null,
  extra = null
) => {
  try {
    const doc = new PDFDocument({
      margin: 30,
      size: 'A4',
      layout: 'landscape',
      font: 'Helvetica'
    });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);
    
    // Helper functions
    const formatKey = key => {
      const specialCases = { XIRR: 'XIRR', CAGR: 'CAGR', Abs: 'Abs' };
      let result = key.replace(/([A-Z][a-z]+)/g, (match, p1) =>
        specialCases[p1] ? ` ${specialCases[p1]}` : ` ${p1.toLowerCase()}`
      );
      return result
        .replace(/\b\w/g, char => char.toUpperCase())
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\bXirr\b/gi, 'XIRR')
        .replace(/\bCagr\b/gi, 'CAGR');
    };

    const calculateHeight = (text, width, fontSize = 8) =>
      doc.heightOfString(text, { width: width - 10, fontSize }) + 10;

    // Constants for layout
    const PAGE_WIDTH = doc.page.width - 60; // 30px margins on each side
    const CURRENCY_SYMBOL = '';
    const FIXED_HEADER_HEIGHT = 34;

    // Title
    const cleanTitle = title ? title.split('.')[0].trim() : 'Report';
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(cleanTitle, { align: 'center' })
      .moveDown(0.5);

    // As on Date
    if (extra?.asOnDate) {
      doc
        .fontSize(10)
        .fillColor('#555555')
        .text(`As on Date: ${extra.asOnDate}`, { align: 'left' })
        .moveDown(0.5);
    }

    // Investment Summary - Doesn't affect main table width
    if (extra?.investmentSummary) {
      const summary = extra.investmentSummary;
      doc
        .fontSize(10)
        .fillColor('#3b526b')
        .text('Investment Summary', { align: 'left' })
        .moveDown(0.5);

      const summaryData = Object.entries(summary)
        .filter(([key]) => key !== 'currency')
        .map(([key, value]) => [
          formatKey(key),
          ['investmentAmount', 'currentValue', 'unrealisedGainLoss'].includes(
            key
          )
            ? `${summary.currency || CURRENCY_SYMBOL} ${value || '0'}`
            : value
        ]);

      const summaryColWidths = [150, 150];
      const initialY = doc.y;

      summaryData.forEach(([label, value], i) => {
        const y = initialY + i * 20;
        doc
          .rect(30, y, summaryColWidths[0], 20)
          .fillAndStroke('#FFFFFF', '#EEEEEE');
        doc
          .rect(30 + summaryColWidths[0], y, summaryColWidths[1], 20)
          .fillAndStroke('#FFFFFF', '#EEEEEE');
        doc
          .fontSize(8)
          .fillColor('#3b526b')
          .text(label, 35, y + 5, { width: summaryColWidths[0] - 10 })
          .text(value, 30 + summaryColWidths[0] + 5, y + 5, {
            width: summaryColWidths[1] - 10,
            align: 'right'
          });
      });

      doc.y = initialY + summaryData.length * 20 + 15;
    }

    // Main Table - Width calculation with fixed first column
    const headers = ['S/N', ...fields.map(f => f.label)];

    // Calculate fixed width for first column (S/N)
    const maxRowNumber = data.length.toString();
    const firstColWidth = Math.max(
      35, // Minimum width
      doc.widthOfString('S/N', { fontSize: 8 }) + 15,
      doc.widthOfString(maxRowNumber, { fontSize: 8 }) + 15
    );

    // Calculate column widths for other columns based on content
    const otherColumnWidths = headers.slice(1).map((header, index) => {
      const contentWidths = data.map(item => {
        const text = String(item[fields[index].value] || space);
        return doc.widthOfString(text, { fontSize: 8 });
      });
      const headerWidth = doc.widthOfString(header, { fontSize: 8 });
      const maxContentWidth = Math.max(...contentWidths, headerWidth);

      // Also consider "Total" text width if this column will contain totals
      const totalText =
        extra?.summaryMetrics?.[fields[index].value.toLowerCase()] || '';
      const totalWidth = totalText
        ? doc.widthOfString(totalText, { fontSize: 8 })
        : 0;

      return Math.max(
        140, // Minimum width for other columns
        maxContentWidth + 15,
        totalWidth + 15
      );
    });

    // Combine fixed first column with other columns
    const columnWidths = [firstColWidth, ...otherColumnWidths];

    // Ensure total width doesn't exceed page width
    const totalWidth = columnWidths.reduce((sum, w) => sum + w, 0);
    const scaleFactor = Math.min(PAGE_WIDTH / totalWidth, 1);
    const adjustedColumnWidths = columnWidths.map(
      (w, i) => (i === 0 ? w : w * scaleFactor) // Don't scale the first column
    );
    const startX =
      (doc.page.width - adjustedColumnWidths.reduce((s, w) => s + w, 0)) / 2;

    // Draw table header
    const drawHeader = y => {
      headers.forEach((header, index) => {
        const x =
          startX +
          adjustedColumnWidths.slice(0, index).reduce((s, w) => s + w, 0);
        doc
          .rect(x, y, adjustedColumnWidths[index], FIXED_HEADER_HEIGHT)
          .fillAndStroke('#3b526b', '#3b526b');
        doc
          .fontSize(8)
          .fillColor('#FFFFFF')
          .text(header, x + 5, y + 5, {
            width: adjustedColumnWidths[index] - 10,
            align: 'center',
            lineBreak: false
          });
      });
      return y + FIXED_HEADER_HEIGHT;
    };

    let currentY = drawHeader(doc.y);

    // Draw table rows
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = [
        rowIndex + 1,
        ...fields.map(field => String(data[rowIndex][field.value] || space))
      ];

      const rowHeight = Math.max(
        ...row.map((cell, i) => calculateHeight(cell, adjustedColumnWidths[i]))
      );

      if (
        currentY + rowHeight >
        doc.page.height - doc.page.margins.bottom - 50
      ) {
        doc.addPage({ margin: 30, size: 'A4', layout: 'landscape' });
        currentY = drawHeader(doc.y);
      }

      row.forEach((cell, cellIndex) => {
        const x =
          startX +
          adjustedColumnWidths.slice(0, cellIndex).reduce((s, w) => s + w, 0);
        doc
          .rect(x, currentY, adjustedColumnWidths[cellIndex], rowHeight)
          .fillAndStroke('#FFFFFF', '#EEEEEE');
        doc
          .fontSize(8)
          .fillColor('#333333')
          .text(cell, x + 5, currentY + 5, {
            width: adjustedColumnWidths[cellIndex] - 10,
            align: 'center'
          });
      });

      currentY += rowHeight;
    }

    // Total Row
    if (extra?.summaryMetrics) {
      const metricColumns = {};
      Object.keys(extra.summaryMetrics).forEach(metricKey => {
        const matchingField = fields.find(
          f => f.value.toLowerCase() === metricKey.toLowerCase()
        );
        if (matchingField) {
          metricColumns[metricKey] = fields.indexOf(matchingField) + 1;
        }
      });

      const totalRow = ['Total'];
      for (let i = 1; i < headers.length; i++) {
        const metricKey = Object.keys(metricColumns).find(
          k => metricColumns[k] === i
        );
        totalRow.push(
          metricKey
            ? ['totalInvested', 'currentValue'].includes(metricKey)
              ? `${extra.investmentSummary?.currency || CURRENCY_SYMBOL} ${extra
                  .summaryMetrics[metricKey] || ''}`
              : extra.summaryMetrics[metricKey] || ''
            : ''
        );
      }

      const rowHeight = Math.max(
        ...totalRow.map((cell, i) =>
          calculateHeight(cell, adjustedColumnWidths[i])
        )
      );

      if (
        currentY + rowHeight >
        doc.page.height - doc.page.margins.bottom - 50
      ) {
        doc.addPage();
        currentY = drawHeader(doc.y);
      }

      totalRow.forEach((cell, cellIndex) => {
        const x =
          startX +
          adjustedColumnWidths.slice(0, cellIndex).reduce((s, w) => s + w, 0);
        doc
          .rect(x, currentY, adjustedColumnWidths[cellIndex], rowHeight)
          .fillAndStroke('#d8dfe4', '#d8dfe4');
        doc
          .fontSize(8)
          .fillColor('#000000')
          .text(cell, x + 5, currentY + 5, {
            width: adjustedColumnWidths[cellIndex] - 10,
            align: cellIndex === 0 ? 'left' : 'center'
          });
      });

      currentY += rowHeight + 10;
    }

    // Grand Total Section
    if (extra?.grandTotal) {
      if (currentY + 100 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
      } else {
        currentY += 20;
      }

      const metrics = Object.entries(extra.grandTotal)
        .filter(([key]) => key !== 'currency')
        .map(
          ([key, value]) =>
            `${formatKey(key)}: ${extra.grandTotal.currency ||
              CURRENCY_SYMBOL} ${value || '0'}`
        );

      const boxHeight = metrics.length * 14 + 10;
      doc.rect(30, currentY - 5, PAGE_WIDTH, boxHeight).stroke('#CCCCCC');

      metrics.forEach((line, i) => {
        doc
          .fontSize(8)
          .fillColor('#333333')
          .text(line, 35, currentY + i * 14, { align: 'left' });
      });
    }

    doc.end();

    writeStream.on('finish', async () => {
      if (email) {
        const emailSent = await sendEmailWithPDF(
          email,
          subject,
          description,
          filePath,
          title
        );
        if (emailSent) {
          fs.unlinkSync(filePath);
          return res
            .status(200)
            .json({ message: 'PDF generated and email sent successfully' });
        } else {
          return res.status(500).json({
            message: 'PDF generated but email failed to send',
            downloadUrl: `/download-pdf?path=${encodeURIComponent(filePath)}`
          });
        }
      } else {
        res.download(filePath, path.basename(filePath), err => {
          if (!err) fs.unlinkSync(filePath);
        });
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating PDF');
  }
};

module.exports = generatePDF;
