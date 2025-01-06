import { Employee, PaginatedResponse, Transaction } from "../utils/types"

type UseTypeBaseResult<TValue> = {
  data: TValue
  loading: boolean
  invalidateData: () => void
}

type UseTypeBaseAllResult<TValue> = UseTypeBaseResult<TValue> & {
  fetchAll: () => Promise<void>
}

type UseTypeBaseByIdResult<TValue> = UseTypeBaseResult<TValue> & {
  fetchById: (id: string) => Promise<void>
}

export type EmployeeResult = UseTypeBaseAllResult<Employee[] | null>

<<<<<<< HEAD
// export type PaginatedTransactionsResult = UseTypeBaseAllResult<PaginatedResponse<Transaction[]> | null>
export type PaginatedTransactionsResult = UseTypeBaseAllResult<PaginatedResponse<
  Transaction[]
> | null> & {
  setData: (newData: PaginatedResponse<Transaction[]>) => void
}

// export type TransactionsByEmployeeResult = UseTypeBaseByIdResult<Transaction[] | null>
export type TransactionsByEmployeeResult = UseTypeBaseByIdResult<Transaction[] | null> & {
  setData: (newData: Transaction[]) => void
=======
export type PaginatedTransactionsResult = UseTypeBaseAllResult<PaginatedResponse<
  Transaction[]
> | null> & {
  updateTransactions: (updater: (transactions: Transaction[]) => Transaction[]) => void
}

export type TransactionsByEmployeeResult = UseTypeBaseByIdResult<Transaction[] | null> & {
  updateTransactions: (updater: (transactions: Transaction[]) => Transaction[]) => void
>>>>>>> f1a5358d5c45d3e9ac7f8165c593a1928ba39aa6
}
