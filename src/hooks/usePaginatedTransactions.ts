import { useCallback, useState } from "react"
import { PaginatedRequestParams, PaginatedResponse, Transaction } from "../utils/types"
import { PaginatedTransactionsResult } from "./types"
import { useCustomFetch } from "./useCustomFetch"

export function usePaginatedTransactions(): PaginatedTransactionsResult {
  const { fetchWithCache, loading } = useCustomFetch()
  const [paginatedTransactions, setPaginatedTransactions] = useState<PaginatedResponse<
    Transaction[]
  > | null>(null)

  const fetchAll = useCallback(async () => {
    const response = await fetchWithCache<PaginatedResponse<Transaction[]>, PaginatedRequestParams>(
      "paginatedTransactions",
      {
        page: paginatedTransactions === null ? 0 : paginatedTransactions.nextPage,
      }
    )

    setPaginatedTransactions((previousResponse) => {
      if (response === null) {
        //fetch no data, keep unchanged
        return previousResponse
      }

      if (previousResponse === null) {
        // initial fetch
        return response
      }

      return {
        data: [...previousResponse.data, ...response.data], // Merge new data with existing data
        nextPage: response.nextPage,
      }
    })
  }, [fetchWithCache, paginatedTransactions])

  const invalidateData = useCallback(() => {
    setPaginatedTransactions(null)
  }, [])

  // **New Method**: Update transactions in the current state
  const updateTransactions = useCallback((updater: (transactions: Transaction[]) => Transaction[]) => {
    setPaginatedTransactions((prev) => {
      if (!prev) return null // Keep unchanged if there is no transaction data
      return {
        ...prev,
        data: updater(prev.data), // Apply the updater function to update the transaction list
      }
    })
  }, [])

  return { data: paginatedTransactions, loading, fetchAll, invalidateData, updateTransactions }
}
