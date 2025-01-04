import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  // Tracks the currently selected employee in the dropdown. Defaults to "All Employees" (EMPTY_EMPLOYEE).
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(EMPTY_EMPLOYEE)
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(false) // New state to track employees loading status
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false) // New state to track transactions loading status

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(
    async (skipEmployeesLoading = false) => {
      if (!skipEmployeesLoading) {
        setIsEmployeesLoading(true) // Set loading state for employees
        await employeeUtils.fetchAll() // Fetch all employees
        setIsEmployeesLoading(false) // Employee data loading complete
      }
      setIsTransactionsLoading(true)
      transactionsByEmployeeUtils.invalidateData()
      await paginatedTransactionsUtils.fetchAll()
      setIsTransactionsLoading(false)
    },
    [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      if (employeeId === "" || employeeId === "all") {
        await loadAllTransactions(true) //Skip employee data loading
        return
      }
      setIsTransactionsLoading(true)
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
      setIsTransactionsLoading(false)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

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
          <Transactions transactions={transactions} />

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
