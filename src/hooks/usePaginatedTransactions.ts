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
    return response ?? { data: [], nextPage: null } // 确保函数总是返回一个值
  }, [fetchWithCache, paginatedTransactions])

  const invalidateData = useCallback(() => {
    setPaginatedTransactions(null)
  }, [])

  return { data: paginatedTransactions, loading, fetchAll, invalidateData }
}
