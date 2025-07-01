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
  description = null
) => {
  try {
    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Details');

    // Format title - take only the part before the first dot
    const formattedTitle = title.split('.')[0];

    // Add title row
    const titleRow = worksheet.addRow([formattedTitle]);
    titleRow.font = { size: 16, bold: true };
    worksheet.mergeCells(`A1:${String.fromCharCode(65 + fields.length)}1`);
    titleRow.alignment = { horizontal: 'center' };

    // Add headers in the second row
    const headers = ['SrNo', ...fields.map(field => field.label)];
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };

    // Style the headers
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' } // Light gray background
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add the data starting from the third row
    data.forEach((item, index) => {
      const row = [index + 1];
      fields.forEach(field => {
        row.push(item[field.value] ? item[field.value] : space);
      });
      const dataRow = worksheet.addRow(row);

      // Add borders to data cells
      dataRow.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Optimize column widths - only as much as needed
    worksheet.columns.forEach(column => {
      let maxLength = 0;

      column.eachCell({ includeEmpty: true }, cell => {
        if (cell.row === 1) return; // ✅ Skip title row

        let cellLength = 0;
        if (cell.value) {
          cellLength =
            typeof cell.value === 'number' ? 10 : cell.value.toString().length;
        }

        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });

      column.width = Math.max(maxLength + 2, 4); // Add some padding
    });

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
