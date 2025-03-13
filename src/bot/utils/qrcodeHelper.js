const qrcode = require('qrcode-terminal');

function qrCodeGenerator(qr) {
  qrcode.generate(qr, { small: true });
}

module.exports = {
  qrCodeGenerator
};