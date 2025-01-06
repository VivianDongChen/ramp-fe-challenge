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

  // const setData = useCallback((newData: PaginatedResponse<Transaction[]>) => {
  //   setPaginatedTransactions(newData)
  // }, [])

  const setData = useCallback((newData: PaginatedResponse<Transaction[]>, append = false) => {
    setPaginatedTransactions((prev) => {
      if (!append || prev === null) {
        // 如果 append 为 false 或之前没有数据，直接替换
        return newData
      }

      // 否则，将新数据追加到已有数据中
      return {
        ...newData, // 保留新数据中的其他属性（如 nextPage）
        data: [...prev.data, ...newData.data], // 合并数据
      }
    })
  }, [])

  return { data: paginatedTransactions, loading, fetchAll, invalidateData, setData }
}
