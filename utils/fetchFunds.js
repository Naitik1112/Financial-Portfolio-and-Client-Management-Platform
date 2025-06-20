const { exec } = require('child_process');
const path = require('path');

function getMutualFundsFromPython() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../python/fetch_amfi_data.py');
    // const pythonPath = `"C:/Users/NAITIK SHAH/AppData/Local/Programs/Python/Python313/python.exe"`;
    const pythonPath = 'python';

    exec(
      `${pythonPath} "${scriptPath}"`,
      { maxBuffer: 1024 * 1024 * 5 },
      (err, stdout, stderr) => {
        console.log('stdout : ', stdout);
        console.log('error : ', err);
        console.log('here 1');
        if (err) {
          return reject('Python script error: ' + stderr);
        }
        try {
          const data = JSON.parse(stdout);
          resolve(data);
        } catch (e) {
          reject('JSON parse error: ' + e.message);
        }
      }
    );
  });
}

module.exports = getMutualFundsFromPython;
