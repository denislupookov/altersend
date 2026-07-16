export class Bitmap {
  readonly size: number
  private readonly bits: Uint8Array
  private setBits = 0

  constructor(size: number, bits?: Uint8Array) {
    this.size = size
    const byteLength = Math.ceil(size / 8)
    if (bits) {
      if (bits.length < byteLength) throw new Error('Bitmap bits too short for size')
      this.bits = bits.slice(0, byteLength)
      for (let i = 0; i < size; i++) {
        if (this.get(i)) this.setBits++
      }
    } else {
      this.bits = new Uint8Array(byteLength)
    }
  }

  get(index: number): boolean {
    if (index < 0 || index >= this.size) return false
    return (this.bits[Math.floor(index / 8)] & (1 << (index & 7))) !== 0
  }

  set(index: number): void {
    if (index < 0 || index >= this.size) throw new Error('Bitmap index out of range')
    const byte = Math.floor(index / 8)
    const mask = 1 << (index & 7)
    if ((this.bits[byte] & mask) === 0) {
      this.bits[byte] |= mask
      this.setBits++
    }
  }

  count(): number {
    return this.setBits
  }

  allSet(): boolean {
    return this.setBits === this.size
  }

  missing(): number[] {
    const out: number[] = []
    for (let i = 0; i < this.size; i++) {
      if (!this.get(i)) out.push(i)
    }
    return out
  }

  serialize(): Uint8Array {
    return this.bits.slice()
  }

  static deserialize(size: number, bits: Uint8Array): Bitmap {
    return new Bitmap(size, bits)
  }
}
