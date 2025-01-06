import { useCallback, useState } from "react"
import { RequestByEmployeeParams, Transaction } from "../utils/types"
import { TransactionsByEmployeeResult } from "./types"
import { useCustomFetch } from "./useCustomFetch"

export function useTransactionsByEmployee(): TransactionsByEmployeeResult {
  const { fetchWithCache, loading } = useCustomFetch()
  const [transactionsByEmployee, setTransactionsByEmployee] = useState<Transaction[] | null>(null)

  const fetchById = useCallback(
    async (employeeId: string): Promise<void> => {
      try {
        const data = await fetchWithCache<Transaction[], RequestByEmployeeParams>(
          "transactionsByEmployee",
          {
            employeeId, // Explicitly provide employee ID
          }
        )
        setTransactionsByEmployee(data ?? []) // Update state with fetched data
      } catch (error) {
        setTransactionsByEmployee([]) // Ensure state is updated even if an error occurs
      }
    },
    [fetchWithCache]
  )

  const invalidateData = useCallback(() => {
    setTransactionsByEmployee(null) // Reset the state
  }, [])

  const setData = useCallback((newData: Transaction[]) => {
    setTransactionsByEmployee(newData) // Directly set the state with new data
  }, [])

  return { data: transactionsByEmployee, loading, fetchById, invalidateData, setData }
}
