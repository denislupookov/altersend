declare module '#fs' {
  import fs from 'node:fs/promises'
  export default fs
}

declare module '#path' {
  import path from 'node:path'
  export default path
}
