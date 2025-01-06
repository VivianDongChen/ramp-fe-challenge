import { useCallback, useState } from "react"
import { PaginatedRequestParams, PaginatedResponse, Transaction } from "../utils/types"
import { useCustomFetch } from "./useCustomFetch"

export function usePaginatedTransactions(): {
  data: PaginatedResponse<Transaction[]> | null
  loading: boolean
  fetchAll: () => Promise<PaginatedResponse<Transaction[]>>
  invalidateData: () => void
  setData: (newData: PaginatedResponse<Transaction[]>, append?: boolean) => void
} {
  const { fetchWithCache, loading } = useCustomFetch()
  const [paginatedTransactions, setPaginatedTransactions] = useState<PaginatedResponse<
    Transaction[]
  > | null>(null)

  const fetchAll = useCallback(async (): Promise<PaginatedResponse<Transaction[]>> => {
    const response = await fetchWithCache<PaginatedResponse<Transaction[]>, PaginatedRequestParams>(
      "paginatedTransactions",
      {
        page: paginatedTransactions === null ? 0 : paginatedTransactions.nextPage,
      }
    )

    setPaginatedTransactions((previousResponse) => {
      if (response === null) {
        // No data fetched, keep the current state unchanged
        return previousResponse
      }

      if (previousResponse === null) {
        // Initial fetch
        return response
      }

      return {
        data: [...previousResponse.data, ...response.data], // Append new data to the existing data
        nextPage: response.nextPage,
      }
    })
    return response ?? { data: [], nextPage: null } // Ensure the function always returns a value
  }, [fetchWithCache, paginatedTransactions])

  const invalidateData = useCallback(() => {
    setPaginatedTransactions(null) // Reset the cached data
  }, [])

  return { data: paginatedTransactions, loading, fetchAll, invalidateData }
}
