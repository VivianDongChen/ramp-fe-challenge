import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"
import { Transaction } from "./utils/types"

export function App() {
  const mergeTransactionsWithCache = (
    transactions: Transaction[],
    transactionCache: Record<string, boolean>
  ): Transaction[] => {
    return transactions.map((transaction: Transaction) => ({
      ...transaction,
      approved: transactionCache[transaction.id] ?? transaction.approved, // 优先使用缓存中的状态
    }))
  }

  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  // Tracks the currently selected employee in the dropdown. Defaults to "All Employees" (EMPTY_EMPLOYEE).
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(EMPTY_EMPLOYEE)
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(false) // New state to track employees loading status
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false) // New state to track transactions loading status
  const [transactionCache, setTransactionCache] = useState<Record<string, boolean>>({})

  // const transactions = useMemo(
  //   () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
  //   [paginatedTransactions, transactionsByEmployee]
  // )

  // UseMemo to always apply transactionCache to the displayed data
  const transactions = useMemo(() => {
    const rawTransactions = paginatedTransactions?.data ?? transactionsByEmployee ?? []
    console.log("Merged Transactions:", rawTransactions)
    return mergeTransactionsWithCache(rawTransactions, transactionCache)
  }, [paginatedTransactions, transactionsByEmployee, transactionCache])

  const loadAllTransactions = useCallback(
    async (skipEmployeesLoading = false) => {
      try {
        if (!skipEmployeesLoading) {
          setIsEmployeesLoading(true)
          await employeeUtils.fetchAll()
          setIsEmployeesLoading(false)
        }
        setIsTransactionsLoading(true)

        transactionsByEmployeeUtils.invalidateData()
        const transactions = await paginatedTransactionsUtils.fetchAll()

        const updatedTransactions = mergeTransactionsWithCache(transactions.data, transactionCache)

        paginatedTransactionsUtils.setData(
          {
            ...paginatedTransactions,
            data: updatedTransactions,
            nextPage: paginatedTransactions?.nextPage ?? null,
          },
          true // append = true
        )
      } catch (error) {
        console.error("Error loading transactions:", error)
      } finally {
        setIsTransactionsLoading(false) // 确保状态在所有情况下被重置
      }
    },
    [
      employeeUtils,
      paginatedTransactionsUtils,
      transactionsByEmployeeUtils,
      transactionCache,
      paginatedTransactions,
    ]
  )

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      if (employeeId === "" || employeeId === "all") {
        await loadAllTransactions(true) //Skip employee data loading
        return
      }
      setIsTransactionsLoading(true)
      transactionsByEmployeeUtils.invalidateData()
      try {
        // 获取新的员工相关交易数据
        const transactions = await transactionsByEmployeeUtils.fetchById(employeeId)

        // 使用缓存合并交易数据
        const updatedTransactions = mergeTransactionsWithCache(transactions ?? [], transactionCache)

        // 更新员工相关交易数据
        transactionsByEmployeeUtils.setData(updatedTransactions)
      } catch (error) {
        console.error("Error loading transactions by employee:", error)
      } finally {
        setIsTransactionsLoading(false)
      }
    },
    [loadAllTransactions, paginatedTransactionsUtils, transactionsByEmployeeUtils, transactionCache]
  )

  const handleTransactionApproval = useCallback(
    ({ transactionId, newValue }: { transactionId: string; newValue: boolean }) => {
      setTransactionCache((prevCache) => ({
        ...prevCache,
        [transactionId]: newValue, // 更新缓存
      }))
      // 添加一个隐式的 Promise<void> 返回以匹配类型签名
      return Promise.resolve()
    },
    []
  )

  useEffect(() => {
    console.log("Employees:", employees)
    console.log("Transactions By Employee:", transactionsByEmployee)
    console.log("Paginated Transactions:", paginatedTransactions)
    console.log("Selected Employee:", selectedEmployee)
    if (employees === null && !employeeUtils.loading) {
      void loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  if (
    !employees ||
    (selectedEmployee.id !== EMPTY_EMPLOYEE.id && !transactionsByEmployee) ||
    !paginatedTransactions
  ) {
    return <div>Loading...</div>
  }

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isEmployeesLoading} // Loading state for the dropdown
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }
            setSelectedEmployee(newValue) // Update the selected employee state
            await loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions
            transactions={transactions} // 使用 useMemo 处理后的 transactions
            setTransactionApproval={handleTransactionApproval} // 传递函数
          />

          {transactions !== null &&
            paginatedTransactions?.nextPage !== null &&
            selectedEmployee?.id === EMPTY_EMPLOYEE.id && (
              <button
                className="RampButton"
                disabled={isTransactionsLoading} // Button disabled based on transactions loading state
                onClick={async () => {
                  if (selectedEmployee?.id === EMPTY_EMPLOYEE.id) {
                    await loadAllTransactions(true) // Skip employee data loading
                  } else {
                    console.error("View More should not be clickable for filtered transactions.")
                  }
                }}
              >
                View More
              </button>
            )}
        </div>
      </main>
    </Fragment>
  )
}
