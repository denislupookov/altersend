import { formatAccountCode } from './code'

export interface CodeFileLabels {
  title: string
  codeLabel: string
  savedLabel: string
  warning: string
}

export const ACCOUNT_CODE_FILE_NAME = 'altersend-pro-code.txt'

export function accountCodeFile(code: string, savedOn: string, labels: CodeFileLabels): string {
  return [
    labels.title,
    '',
    `${labels.codeLabel}: ${formatAccountCode(code)}`,
    `${labels.savedLabel}: ${savedOn}`,
    '',
    labels.warning,
    ''
  ].join('\n')
}
