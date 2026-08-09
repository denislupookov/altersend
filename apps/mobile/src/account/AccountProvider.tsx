import { createContext, useContext, type ReactNode } from 'react'
import { useAccount, type AccountModel } from '@altersend/domain'
import { accountAdapter } from '@/src/lifecycle/account'

const AccountContext = createContext<AccountModel | null>(null)

export function AccountProvider({ children }: { children: ReactNode }) {
  const model = useAccount(accountAdapter)
  return <AccountContext.Provider value={model}>{children}</AccountContext.Provider>
}

export function useAccountModel(): AccountModel {
  const model = useContext(AccountContext)
  if (!model) throw new Error('useAccountModel must be used within AccountProvider')

  return model
}
