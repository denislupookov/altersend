declare module 'pear-runtime' {
  export default class PearRuntime {
    constructor(options: { name: string; dir: string; version: string })
    storage: string
    run(path: string, args: string[]): WorkerHandle
  }

  interface WorkerHandle {
    destroy(): void
    stdout: { on(event: string, cb: (...args: unknown[]) => void): void; removeListener(event: string, cb: (...args: unknown[]) => void): void }
    stderr: { on(event: string, cb: (...args: unknown[]) => void): void; removeListener(event: string, cb: (...args: unknown[]) => void): void }
    on(event: string, cb: (...args: unknown[]) => void): void
    once(event: string, cb: (...args: unknown[]) => void): void
  }
}

declare module 'which-runtime' {
  export const isMac: boolean
  export const isLinux: boolean
  export const isWindows: boolean
}

declare module 'paparam' {
  interface ParsedResult {
    name: string | null
    argv: {
      positionals: string[]
      flags: Record<string, string | boolean>
    }
  }

  export function command(name: string, ...modifiers: unknown[]): Command
  export function flag(help: string, description?: string): unknown
  export function arg(help: string, description?: string): unknown
  export function description(desc: string): unknown
  export function summary(desc: string): unknown
  export function sloppy(opts?: { flags?: boolean; args?: boolean }): (cmd: Command) => void

  interface Command {
    add(...modifiers: unknown[]): Command
    parse(input?: string[], opts?: { run?: boolean }): ParsedResult | null
    flags: Record<string, string | boolean>
  }
}