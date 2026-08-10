export interface AccountStorage {
  read(): Promise<string | null>
  write(code: string): Promise<void>
  clear(): Promise<void>
  readToken?(): Promise<string | null>
  writeToken?(token: string | null): Promise<void>
}
