import { useCallback, useState } from "react"
import { RequestByEmployeeParams, Transaction } from "../utils/types"
import { TransactionsByEmployeeResult } from "./types"
import { useCustomFetch } from "./useCustomFetch"

export function useTransactionsByEmployee(): TransactionsByEmployeeResult {
  const { fetchWithCache, loading } = useCustomFetch()
  const [transactionsByEmployee, setTransactionsByEmployee] = useState<Transaction[] | null>(null)

  const fetchById = useCallback(
    async (employeeId: string) => {
      const data = await fetchWithCache<Transaction[], RequestByEmployeeParams>(
        "transactionsByEmployee",
        {
          employeeId,
        }
      )

      setTransactionsByEmployee(data)
    },
    [fetchWithCache]
  )

  const invalidateData = useCallback(() => {
    setTransactionsByEmployee(null)
  }, [])

  // **New Method**: Update transactions in the current state
  const updateTransactions = useCallback((updater: (transactions: Transaction[]) => Transaction[]) => {
    setTransactionsByEmployee((prev) => {
      if (!prev) return null // If no transactions, keep unchanged
      return updater(prev) // Apply updater function to update transactions
    })
  }, [])

  return { data: transactionsByEmployee, loading, fetchById, invalidateData, updateTransactions }
}
