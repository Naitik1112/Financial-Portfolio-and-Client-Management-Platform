const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const generateExcel = async (data, filePath, res, fields, title, space) => {
  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Details');

  // Add title row
  const titleRow = worksheet.addRow([title]);
  titleRow.font = { size: 16, bold: true };
  worksheet.mergeCells(`A1:${String.fromCharCode(65 + fields.length)}1`);
  titleRow.alignment = { horizontal: 'center' };

  // Add headers in the second row
  const headers = ['SrNo', ...fields.map(field => field.label)];
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };

  // Add the data starting from the third row
  data.forEach((item, index) => {
    const row = [index + 1];
    fields.forEach(field => {
      row.push(item[field.value] ? item[field.value] : space);
    });
    worksheet.addRow(row);
  });

  // Write the Excel file
  await workbook.xlsx.writeFile(filePath);

  // Send the file to the client
  res.download(filePath, path.basename(filePath), err => {
    if (!err) fs.unlinkSync(filePath); // Clean up the file after download
  });
};

module.exports = generateExcel;
