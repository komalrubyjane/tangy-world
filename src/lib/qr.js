import QRCode from 'qrcode';

// Generates a data: URL PNG for a booking's registration code so it can be
// shown as a scannable ticket without needing a server round-trip.
export async function generateQrDataUrl(text) {
  return QRCode.toDataURL(text, {
    width: 320,
    margin: 2,
    color: { dark: '#11100C', light: '#E7D5A4' },
  });
}
