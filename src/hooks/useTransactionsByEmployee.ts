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
            employeeId, // 确保显式提供值
          }
        )
        setTransactionsByEmployee(data ?? []) // 更新内部状态
      } catch (error) {
        console.error("Error fetching transactions by employee:", error)
        setTransactionsByEmployee([]) // 确保状态更新，即使发生错误
      }
    },
    [fetchWithCache]
  )

  const invalidateData = useCallback(() => {
    setTransactionsByEmployee(null)
  }, [])

  // 添加 setData 方法
  const setData = useCallback((newData: Transaction[]) => {
    setTransactionsByEmployee(newData)
  }, [])

  return { data: transactionsByEmployee, loading, fetchById, invalidateData, setData }
}
