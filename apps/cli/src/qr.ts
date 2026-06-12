import QRCode from 'qrcode'

export async function displayQR(topic: string): Promise<void> {
  if (process.stdout.isTTY) {
    const qr = await QRCode.toString(topic, { type: 'terminal' })
    console.log(qr)
  } else {
    console.log(`Join code: ${topic}`)
    console.log('(QR code suppressed — non-TTY environment)')
  }
}