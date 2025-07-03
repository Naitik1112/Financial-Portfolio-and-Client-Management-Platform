const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { sendEmailWithPDF } = require('./email');

const generateExcel = async (
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
    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Details');

    // Helper function to format keys (similar to PDF version)
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

    // Format title - take only the part before the first dot
    const formattedTitle = title.split('.')[0];

    // Add title row
    const titleRow = worksheet.addRow([formattedTitle]);
    titleRow.font = { size: 16, bold: true };
    worksheet.mergeCells(`A1:${String.fromCharCode(65 + fields.length)}1`);
    titleRow.alignment = { horizontal: 'center' };

    // Add asOnDate if provided
    let currentRow = 3; // Start after title and empty row
    if (extra?.asOnDate) {
      const asOnDateRow = worksheet.addRow([`As on Date: ${extra.asOnDate}`]);
      asOnDateRow.font = { size: 10, color: { argb: 'FF555555' } };
      worksheet.mergeCells(
        `A${currentRow}:${String.fromCharCode(65 + fields.length)}${currentRow}`
      );
      currentRow++;
    }

    // Add Investment Summary if provided
    if (extra?.investmentSummary) {
      const summaryLabelRow = worksheet.addRow(['Investment Summary']);
      summaryLabelRow.font = {
        size: 12,
        bold: true,
        color: { argb: 'FF3b526b' }
      };
      worksheet.mergeCells(
        `A${currentRow}:${String.fromCharCode(65 + fields.length)}${currentRow}`
      );
      currentRow++;

      const summary = extra.investmentSummary;
      const summaryData = Object.entries(summary)
        .filter(([key]) => key !== 'currency')
        .map(([key, value]) => ({
          label: formatKey(key),
          value: [
            'investmentAmount',
            'currentValue',
            'unrealisedGainLoss'
          ].includes(key)
            ? `${summary.currency || '₹'} ${value || '0'}`
            : value
        }));

      // Add summary data with merged cells for labels
      summaryData.forEach((item, index) => {
        // Merge cells A and B for the label
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);

        const labelCell = worksheet.getCell(`A${currentRow}`);
        labelCell.value = item.label;
        labelCell.font = { size: 10, bold: true, color: { argb: 'FF3b526b' } };
        labelCell.alignment = { horizontal: 'left' };

        // Add value in column C
        const valueCell = worksheet.getCell(`C${currentRow}`);
        valueCell.value = item.value;
        valueCell.font = { size: 10 };
        valueCell.alignment = { horizontal: 'right' };

        // Add borders to all cells
        ['A', 'B', 'C'].forEach(col => {
          const cell = worksheet.getCell(`${col}${currentRow}`);
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        currentRow++;
      });

      // Add two empty rows after summary (more space before main table)
      worksheet.addRow([]);
      worksheet.addRow([]);
      currentRow += 2;
    }

    // Add headers in the next row
    const headers = ['SrNo', ...fields.map(field => field.label)];
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    currentRow++;

    // Style the headers
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3b526b' } // Dark blue background (matching PDF)
      };
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' } // White text
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      };
    });

    // Find the index of the scheme name field if it exists
    const schemeNameFieldIndex = fields.findIndex(
      field =>
        field.value.toLowerCase().includes('scheme') ||
        field.value.toLowerCase().includes('name')
    );

    // Add the data with text wrapping and center alignment
    data.forEach((item, index) => {
      const row = [index + 1];
      fields.forEach(field => {
        row.push(item[field.value] ? item[field.value] : space);
      });
      const dataRow = worksheet.addRow(row);
      currentRow++;

      // Set row height for scheme name if it's long
      if (schemeNameFieldIndex >= 0) {
        const schemeName = String(
          item[fields[schemeNameFieldIndex].value] || ''
        );
        if (schemeName.length > 30) {
          dataRow.height = 30; // Increase row height for long scheme names
        }
      }

      // Style all cells in the row
      dataRow.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
          wrapText: true
        };
      });
    });

    // Add Total Row if summaryMetrics exists
    if (extra?.summaryMetrics) {
      const totalRow = ['Total'];
      fields.forEach(field => {
        const metricKey = Object.keys(extra.summaryMetrics).find(
          k => k.toLowerCase() === field.value.toLowerCase()
        );
        if (metricKey) {
          totalRow.push(
            ['totalInvested', 'currentValue'].includes(metricKey)
              ? `${extra.investmentSummary?.currency || '₹'} ${
                  extra.summaryMetrics[metricKey]
                }`
              : extra.summaryMetrics[metricKey]
          );
        } else {
          totalRow.push('');
        }
      });

      const totalDataRow = worksheet.addRow(totalRow);
      currentRow++;

      // Style total row (matching PDF's light blue)
      totalDataRow.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFd8dfe4' } // Light blue background
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = {
          horizontal: cell.col === 1 ? 'left' : 'center',
          vertical: 'middle',
          wrapText: true
        };
      });
    }

    // Add Grand Total section (without "Grand Total" text)
    if (extra?.grandTotal) {
      currentRow += 2; // Add two empty rows before grand total values

      const grandData = Object.entries(extra.grandTotal)
        .filter(([key]) => key !== 'currency')
        .map(([key, value]) => ({
          label: formatKey(key),
          value: `${extra.grandTotal.currency || ''} ${value || '0'}`
        }));

      // Add grand total items with merged cells for labels
      grandData.forEach(item => {
        // Merge cells A and B for the label
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);

        const labelCell = worksheet.getCell(`A${currentRow}`);
        labelCell.value = item.label;
        labelCell.font = { size: 10, bold: true };
        labelCell.alignment = { horizontal: 'left', vertical: 'middle' };

        // Add value in column C
        const valueCell = worksheet.getCell(`C${currentRow}`);
        valueCell.value = item.value;
        valueCell.font = { size: 10 };
        valueCell.alignment = { horizontal: 'right', vertical: 'middle' };

        // Add borders to all cells
        ['A', 'B', 'C'].forEach(col => {
          const cell = worksheet.getCell(`${col}${currentRow}`);
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        currentRow++;
      });
    }

    // Set fixed column widths
    worksheet.columns = [
      { key: 'A', width: 8 }, // Fixed width for first column (for "Total")
      { key: 'B', width: 20 }, // Width for second column
      ...fields.map((_, i) => ({
        key: String.fromCharCode(67 + i), // Starts from 'C'
        width: 20 // Fixed width for other columns
      }))
    ];

    // Create a write stream
    const stream = fs.createWriteStream(filePath);

    // Write to stream and wait for finish
    await new Promise((resolve, reject) => {
      workbook.xlsx
        .write(stream)
        .then(() => {
          stream.end(() => resolve());
        })
        .catch(err => {
          stream.end();
          reject(err);
        });
    });

    // Handle email or download
    if (email) {
      // Send email if email options provided
      const emailSent = await sendEmailWithPDF(
        email,
        subject,
        description,
        filePath,
        title
      );

      if (emailSent) {
        fs.unlinkSync(filePath);
        return res.status(200).json({
          message: 'Excel generated and email sent successfully'
        });
      } else {
        return res.status(500).json({
          message: 'Excel generated but email failed to send',
          downloadUrl: `/download-excel?path=${encodeURIComponent(filePath)}`
        });
      }
    } else {
      // Original download behavior - use proper file streaming
      const fileStream = fs.createReadStream(filePath);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${path.basename(filePath)}`
      );

      fileStream.pipe(res).on('finish', () => {
        fs.unlinkSync(filePath);
      });
    }
  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).send('Error generating Excel');
  }
};

module.exports = generateExcel;
