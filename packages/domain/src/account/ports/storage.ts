export interface AccountStorage {
  read(): Promise<string | null>
  write(code: string): Promise<void>
  clear(): Promise<void>
}
