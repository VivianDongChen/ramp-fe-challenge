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
    const uniqueTransactions = Array.from(new Map(transactions.map((t) => [t.id, t])).values()) // Remove duplicates
    return uniqueTransactions.map((transaction) => ({
      ...transaction,
      approved: transactionCache[transaction.id] ?? transaction.approved,
    }))
  }

  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(EMPTY_EMPLOYEE)
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(false) // New state to track employees loading status
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false) // New state to track transactions loading status
  const [transactionCache, setTransactionCache] = useState<Record<string, boolean>>({}) // Cache variable to store transaction updates

  const transactions = useMemo(() => {
    const rawTransactions =
      selectedEmployee?.id === EMPTY_EMPLOYEE.id
        ? paginatedTransactions?.data ?? []
        : transactionsByEmployee ?? []
    return mergeTransactionsWithCache(rawTransactions, transactionCache)
  }, [selectedEmployee, paginatedTransactions, transactionsByEmployee, transactionCache])

  const loadAllTransactions = useCallback(
    async (isInitialLoad = false, skipEmployeesLoading = false) => {
      try {
        if (!skipEmployeesLoading) {
          setIsEmployeesLoading(true)
          await employeeUtils.fetchAll()
          setIsEmployeesLoading(false)
        }
        setIsTransactionsLoading(true)

        if (isInitialLoad) {
          paginatedTransactionsUtils.setData({
            data: [],
            nextPage: 0,
          })
        }

        const transactions = await paginatedTransactionsUtils.fetchAll()
        const updatedTransactions = mergeTransactionsWithCache(transactions.data, transactionCache)

        paginatedTransactionsUtils.setData({
          data: updatedTransactions,
          nextPage: transactions.nextPage,
        })
      } catch (error) {
        console.error("Error loading all transactions:", error)
      } finally {
        setIsTransactionsLoading(false)
      }
    },
    [employeeUtils, paginatedTransactionsUtils, transactionCache]
  )

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      if (employeeId === "" || employeeId === "all") {
        await loadAllTransactions(true) // Skip employee data loading
        return
      }
      setIsTransactionsLoading(true)
      try {
        const transactions = await transactionsByEmployeeUtils.fetchById(employeeId)

        // Merge with cache
        const updatedTransactions = mergeTransactionsWithCache(transactions, transactionCache)
        // Set updated data
        transactionsByEmployeeUtils.setData(updatedTransactions)
      } catch (error) {
        console.error("Error loading transactions by employee:", error)
      } finally {
        setIsTransactionsLoading(false)
      }
    },
    [loadAllTransactions, transactionsByEmployeeUtils, transactionCache]
  )

  const handleTransactionApproval = useCallback(
    ({ transactionId, newValue }: { transactionId: string; newValue: boolean }) => {
      setTransactionCache((prevCache) => ({
        ...prevCache,
        [transactionId]: newValue, // Update the cache
      }))
      return Promise.resolve()
    },
    []
  )

  useEffect(() => {
    if (!employees && !employeeUtils.loading) {
      void loadAllTransactions()
    }
  }, [employees, employeeUtils.loading])

  if (!employees || (selectedEmployee.id !== EMPTY_EMPLOYEE.id && !transactionsByEmployee)) {
    return <div>Loading...</div>
  }

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isEmployeesLoading}
          value={selectedEmployee}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) return
            setSelectedEmployee(newValue)

            if (newValue.id === EMPTY_EMPLOYEE.id) {
              await loadAllTransactions(true, false)
            } else {
              await loadTransactionsByEmployee(newValue.id)
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          {transactions.length > 0 && (
            <Transactions
              transactions={transactions}
              setTransactionApproval={handleTransactionApproval}
            />
          )}

          {transactions !== null &&
            paginatedTransactions?.nextPage !== null &&
            selectedEmployee?.id === EMPTY_EMPLOYEE.id && (
              <button
                className="RampButton"
                disabled={isTransactionsLoading}
                onClick={async () => {
                  if (selectedEmployee?.id === EMPTY_EMPLOYEE.id) {
                    await loadAllTransactions(false, true)
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
