import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useSchoolYear } from '../contexts/SchoolYearContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

type FinanceTab = 'overview' | 'payments' | 'invoices' | 'expenses' | 'payroll'

interface Payment {
  id: string
  student_name: string | null
  amount: number
  date: string | null
  type: string | null
  status: string | null
  reference: string | null
}

interface Invoice {
  id: string
  invoice_no: string | null
  student_name: string | null
  amount: number
  due_date: string | null
  status: string | null
  paid_amount: number | null
}

interface Expense {
  id: string
  category: string | null
  description: string
  amount: number
  date: string | null
  approved_by: string | null
  status: string | null
}

interface Employee {
  id: string
  name: string
  position: string | null
  department: string | null
  salary: number | null
  status: string | null
}

export function FinanceListPage() {
  const { selectedYear: _selectedYear } = useSchoolYear()
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)

  // Form states
  const [paymentForm, setPaymentForm] = useState({ student_name: '', amount: 0, type: 'Tuition', reference: '' })
  const [expenseForm, setExpenseForm] = useState({ category: 'Utilities', description: '', amount: 0 })
  const [invoiceForm, setInvoiceForm] = useState({ student_name: '', amount: 0, due_date: '' })

  // Data from DB
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  // Load Payments from DB
  const loadPayments = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('payments').select('*').order('date', { ascending: false })
    if (data && data.length > 0) {
      setPayments(data)
    } else {
      // Insert default demo data if none exists
      const defaultPayments = [
        { student_name: 'Maria Santos', amount: 15000, date: '2026-01-03', type: 'Tuition', status: 'paid', reference: 'PAY-2026-001' },
        { student_name: 'Juan Cruz', amount: 15000, date: '2026-01-02', type: 'Tuition', status: 'paid', reference: 'PAY-2026-002' },
        { student_name: 'Ana Reyes', amount: 2500, date: '2026-01-02', type: 'Registration', status: 'paid', reference: 'PAY-2026-003' },
        { student_name: 'Pedro Garcia', amount: 15000, date: '2026-01-01', type: 'Tuition', status: 'pending', reference: 'PAY-2026-004' },
        { student_name: 'Sofia Lim', amount: 1500, date: '2025-12-28', type: 'Laboratory', status: 'overdue', reference: 'PAY-2026-005' },
      ]
      const { data: inserted } = await supabase.from('payments').insert(defaultPayments).select()
      if (inserted) setPayments(inserted)
    }
    setLoading(false)
  }, [])

  // Load Invoices from DB
  const loadInvoices = useCallback(async () => {
    const { data } = await supabase.from('invoices').select('*').order('due_date', { ascending: false })
    if (data && data.length > 0) {
      setInvoices(data)
    } else {
      const defaultInvoices = [
        { invoice_no: 'INV-2026-001', student_name: 'Maria Santos', amount: 45000, due_date: '2026-01-31', status: 'partial', paid_amount: 30000 },
        { invoice_no: 'INV-2026-002', student_name: 'Juan Cruz', amount: 45000, due_date: '2026-01-31', status: 'paid', paid_amount: 45000 },
        { invoice_no: 'INV-2026-003', student_name: 'Ana Reyes', amount: 45000, due_date: '2026-01-31', status: 'pending', paid_amount: 0 },
        { invoice_no: 'INV-2026-004', student_name: 'Pedro Garcia', amount: 45000, due_date: '2025-12-31', status: 'overdue', paid_amount: 15000 },
      ]
      const { data: inserted } = await supabase.from('invoices').insert(defaultInvoices).select()
      if (inserted) setInvoices(inserted)
    }
  }, [])

  // Load Expenses from DB
  const loadExpenses = useCallback(async () => {
    const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false })
    if (data && data.length > 0) {
      setExpenses(data)
    } else {
      const defaultExpenses = [
        { category: 'Utilities', description: 'Electric bill - December', amount: 45000, date: '2026-01-02', approved_by: 'Admin', status: 'approved' },
        { category: 'Supplies', description: 'Office supplies', amount: 12500, date: '2026-01-01', approved_by: 'Admin', status: 'approved' },
        { category: 'Maintenance', description: 'AC repair - Room 101', amount: 8500, date: '2025-12-28', approved_by: 'Admin', status: 'approved' },
        { category: 'Events', description: 'Science fair supplies', amount: 25000, date: '2026-01-03', approved_by: '', status: 'pending' },
      ]
      const { data: inserted } = await supabase.from('expenses').insert(defaultExpenses).select()
      if (inserted) setExpenses(inserted)
    }
  }, [])

  // Load Employees from DB
  const loadEmployees = useCallback(async () => {
    const { data } = await supabase.from('employees').select('*').order('name')
    if (data && data.length > 0) {
      setEmployees(data)
    } else {
      const defaultEmployees = [
        { name: 'Dr. Maria Santos', position: 'Principal', department: 'Admin', salary: 85000, status: 'active' },
        { name: 'John Cruz', position: 'Math Teacher', department: 'Junior High', salary: 35000, status: 'active' },
        { name: 'Anna Reyes', position: 'English Teacher', department: 'Elementary', salary: 32000, status: 'active' },
        { name: 'Pedro Garcia', position: 'PE Teacher', department: 'Junior High', salary: 30000, status: 'active' },
        { name: 'Sofia Lim', position: 'Science Teacher', department: 'Senior High', salary: 38000, status: 'active' },
      ]
      const { data: inserted } = await supabase.from('employees').insert(defaultEmployees).select()
      if (inserted) setEmployees(inserted)
    }
  }, [])

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'payments') loadPayments()
    if (activeTab === 'overview' || activeTab === 'expenses') loadExpenses()
    if (activeTab === 'invoices') loadInvoices()
    if (activeTab === 'payroll') loadEmployees()
  }, [activeTab, loadPayments, loadInvoices, loadExpenses, loadEmployees])

  // Stats
  const totalCollected = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
  const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0)
  const totalExpenses = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0)
  const totalPayroll = employees.filter(e => e.status === 'active').reduce((s, e) => s + (e.salary || 0), 0)

  const monthlyData = [
    { month: 'Jun', income: 850000, expenses: 320000 },
    { month: 'Jul', income: 420000, expenses: 290000 },
    { month: 'Aug', income: 380000, expenses: 310000 },
    { month: 'Sep', income: 410000, expenses: 285000 },
    { month: 'Oct', income: 450000, expenses: 295000 },
    { month: 'Nov', income: 390000, expenses: 300000 },
    { month: 'Dec', income: 350000, expenses: 340000 },
    { month: 'Jan', income: totalCollected || 480000, expenses: totalExpenses || 310000 },
  ]

  // Payment Handlers
  const handleAddPayment = async () => {
    if (!paymentForm.student_name || paymentForm.amount <= 0) return
    const newPayment = {
      student_name: paymentForm.student_name,
      amount: paymentForm.amount,
      date: new Date().toISOString().split('T')[0],
      type: paymentForm.type,
      status: 'paid',
      reference: `PAY-2026-${String(payments.length + 1).padStart(3, '0')}`
    }
    await supabase.from('payments').insert(newPayment)
    setShowPaymentModal(false)
    setPaymentForm({ student_name: '', amount: 0, type: 'Tuition', reference: '' })
    loadPayments()
  }

  const handleDeletePayment = async (id: string) => {
    if (confirm('Delete this payment record?')) {
      await supabase.from('payments').delete().eq('id', id)
      loadPayments()
    }
  }

  // Expense Handlers
  const handleAddExpense = async () => {
    if (!expenseForm.description || expenseForm.amount <= 0) return
    const newExpense = {
      category: expenseForm.category,
      description: expenseForm.description,
      amount: expenseForm.amount,
      date: new Date().toISOString().split('T')[0],
      approved_by: '',
      status: 'pending'
    }
    await supabase.from('expenses').insert(newExpense)
    setShowExpenseModal(false)
    setExpenseForm({ category: 'Utilities', description: '', amount: 0 })
    loadExpenses()
  }

  const handleApproveExpense = async (id: string) => {
    await supabase.from('expenses').update({ status: 'approved', approved_by: 'Admin' }).eq('id', id)
    loadExpenses()
  }

  const handleRejectExpense = async (id: string) => {
    await supabase.from('expenses').update({ status: 'rejected' }).eq('id', id)
    loadExpenses()
  }

  const handleDeleteExpense = async (id: string) => {
    if (confirm('Delete this expense?')) {
      await supabase.from('expenses').delete().eq('id', id)
      loadExpenses()
    }
  }

  // Invoice Handlers
  const handleAddInvoice = async () => {
    if (!invoiceForm.student_name || invoiceForm.amount <= 0) return
    const newInvoice = {
      invoice_no: `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`,
      student_name: invoiceForm.student_name,
      amount: invoiceForm.amount,
      due_date: invoiceForm.due_date,
      status: 'pending',
      paid_amount: 0
    }
    await supabase.from('invoices').insert(newInvoice)
    setShowInvoiceModal(false)
    setInvoiceForm({ student_name: '', amount: 0, due_date: '' })
    loadInvoices()
  }

  // Payroll Handler
  const handleRunPayroll = async () => {
    const activeEmployees = employees.filter(e => e.status === 'active')
    // Record payroll as expense
    await supabase.from('expenses').insert({
      category: 'Payroll',
      description: `Monthly payroll for ${activeEmployees.length} employees`,
      amount: totalPayroll,
      date: new Date().toISOString().split('T')[0],
      approved_by: 'System',
      status: 'approved'
    })
    alert(`Payroll processed for ${activeEmployees.length} employees. Total: ₱${totalPayroll.toLocaleString()}`)
    loadExpenses()
  }

  // Filtered data
  const filteredPayments = payments.filter(p => {
    const studentName = p.student_name || ''
    const reference = p.reference || ''
    const matchSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) || reference.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const filteredExpenses = expenses.filter(e => {
    const matchSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === 'all' || e.status === statusFilter
    return matchSearch && matchStatus
  })

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'invoices', label: 'Invoices', icon: '📄' },
    { id: 'expenses', label: 'Expenses', icon: '💸' },
    { id: 'payroll', label: 'Payroll', icon: '👥' },
  ]

  return (
    <div className="flex-1 p-6" style={{ backgroundColor: '#F8FAF7' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">💰 Finance</h1>
          <p className="text-gray-500">Manage payments, expenses, and payroll (all data persisted)</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'payments' && (
            <button onClick={() => setShowPaymentModal(true)} className="px-4 py-2 rounded-xl text-white font-medium" style={{ backgroundColor: '#5B8C51' }}>+ Record Payment</button>
          )}
          {activeTab === 'invoices' && (
            <button onClick={() => setShowInvoiceModal(true)} className="px-4 py-2 rounded-xl text-white font-medium" style={{ backgroundColor: '#5B8C51' }}>+ Create Invoice</button>
          )}
          {activeTab === 'expenses' && (
            <button onClick={() => setShowExpenseModal(true)} className="px-4 py-2 rounded-xl text-white font-medium" style={{ backgroundColor: '#5B8C51' }}>+ Add Expense</button>
          )}
          {activeTab === 'payroll' && (
            <button onClick={handleRunPayroll} className="px-4 py-2 rounded-xl text-white font-medium" style={{ backgroundColor: '#5B8C51' }}>🏃 Run Payroll</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-sm mb-6 flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as FinanceTab)}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === tab.id ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
            style={activeTab === tab.id ? { backgroundColor: '#5B8C51' } : {}}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Total Collected</p>
              <p className="text-3xl font-bold" style={{ color: '#5B8C51' }}>₱{totalCollected.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">This month</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-500">₱{totalPending.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Awaiting payment</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Overdue</p>
              <p className="text-3xl font-bold text-red-500">₱{totalOverdue.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Past due date</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Expenses</p>
              <p className="text-3xl font-bold text-gray-800">₱{totalExpenses.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">This month</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Payroll</p>
              <p className="text-3xl font-bold text-blue-500">₱{totalPayroll.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Monthly total</p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `₱${v / 1000}K`} />
                <Bar dataKey="income" fill="#5B8C51" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expenses" fill="#E8A838" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#5B8C51' }}></div><span className="text-sm text-gray-600">Income</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#E8A838' }}></div><span className="text-sm text-gray-600">Expenses</span></div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">Recent Payments</h3>
              <div className="space-y-3">
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{payment.student_name}</p>
                      <p className="text-sm text-gray-500">{payment.type} • {payment.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold" style={{ color: '#5B8C51' }}>₱{payment.amount.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${payment.status === 'paid' ? 'bg-green-100 text-green-700' : payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && <p className="text-center py-4 text-gray-500">Loading payments...</p>}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">Recent Expenses</h3>
              <div className="space-y-3">
                {expenses.slice(0, 5).map((expense) => (
                  <div key={expense.id} className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{expense.description}</p>
                      <p className="text-sm text-gray-500">{expense.category} • {expense.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">₱{expense.amount.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${expense.status === 'approved' ? 'bg-green-100 text-green-700' : expense.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {expense.status}
                      </span>
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && <p className="text-center py-4 text-gray-500">Loading expenses...</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-200 outline-none w-64"
              />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 outline-none">
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <p className="text-sm text-gray-500">{filteredPayments.length} records</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Reference</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Student</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Type</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Amount</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Date</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-500">Loading...</td></tr>
              ) : filteredPayments.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-500">No payments found</td></tr>
              ) : filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">{payment.reference}</td>
                  <td className="py-3 px-4 font-medium">{payment.student_name}</td>
                  <td className="py-3 px-4">{payment.type}</td>
                  <td className="py-3 px-4 font-bold" style={{ color: '#5B8C51' }}>₱{payment.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-600">{payment.date}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${payment.status === 'paid' ? 'bg-green-100 text-green-700' : payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleDeletePayment(payment.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <input type="text" placeholder="Search invoices..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 outline-none w-64" />
            <p className="text-sm text-gray-500">{invoices.length} invoices</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Invoice #</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Student</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Total</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Paid</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Balance</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Due Date</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-500">Loading invoices...</td></tr>
              ) : invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">{invoice.invoice_no}</td>
                  <td className="py-3 px-4 font-medium">{invoice.student_name || '-'}</td>
                  <td className="py-3 px-4">₱{invoice.amount.toLocaleString()}</td>
                  <td className="py-3 px-4" style={{ color: '#5B8C51' }}>₱{(invoice.paid_amount || 0).toLocaleString()}</td>
                  <td className="py-3 px-4 text-red-600">₱{(invoice.amount - (invoice.paid_amount || 0)).toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-600">{invoice.due_date}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' : invoice.status === 'partial' ? 'bg-blue-100 text-blue-700' : invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <input type="text" placeholder="Search expenses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 outline-none w-64" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 outline-none">
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <p className="text-sm text-gray-500">Total Approved: ₱{totalExpenses.toLocaleString()}</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm text-gray-600">Category</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Description</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Amount</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Date</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-500">No expenses found</td></tr>
              ) : filteredExpenses.map((expense) => (
                <tr key={expense.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4"><span className="px-2 py-1 rounded-lg bg-gray-100 text-sm">{expense.category}</span></td>
                  <td className="py-3 px-4 font-medium">{expense.description}</td>
                  <td className="py-3 px-4 font-bold">₱{expense.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-600">{expense.date}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${expense.status === 'approved' ? 'bg-green-100 text-green-700' : expense.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {expense.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      {expense.status === 'pending' && (
                        <>
                          <button onClick={() => handleApproveExpense(expense.id)} className="text-green-600 hover:bg-green-50 p-1 rounded" title="Approve">✓</button>
                          <button onClick={() => handleRejectExpense(expense.id)} className="text-red-600 hover:bg-red-50 p-1 rounded" title="Reject">✕</button>
                        </>
                      )}
                      <button onClick={() => handleDeleteExpense(expense.id)} className="text-red-600 hover:bg-red-50 p-1 rounded" title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payroll Tab */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Total Employees</p>
              <p className="text-3xl font-bold text-gray-800">{employees.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Active</p>
              <p className="text-3xl font-bold" style={{ color: '#5B8C51' }}>{employees.filter(e => e.status === 'active').length}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Monthly Payroll</p>
              <p className="text-3xl font-bold text-blue-500">₱{totalPayroll.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Avg Salary</p>
              <p className="text-3xl font-bold text-gray-800">₱{employees.length > 0 ? Math.round(totalPayroll / employees.filter(e => e.status === 'active').length).toLocaleString() : 0}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Employee Salaries</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Position</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Department</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Salary</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-500">Loading employees...</td></tr>
                ) : employees.map((emp) => (
                  <tr key={emp.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{emp.name}</td>
                    <td className="py-3 px-4">{emp.position}</td>
                    <td className="py-3 px-4">{emp.department}</td>
                    <td className="py-3 px-4 font-bold" style={{ color: '#5B8C51' }}>₱{(emp.salary || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Record Payment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Student Name</label>
                <input type="text" value={paymentForm.student_name} onChange={(e) => setPaymentForm({...paymentForm, student_name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₱)</label>
                <input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Type</label>
                <select value={paymentForm.type} onChange={(e) => setPaymentForm({...paymentForm, type: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none">
                  <option value="Tuition">Tuition</option>
                  <option value="Registration">Registration</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Library">Library</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200">Cancel</button>
              <button onClick={handleAddPayment} className="flex-1 py-2.5 rounded-xl text-white" style={{ backgroundColor: '#5B8C51' }}>Save to Database</button>
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Expense</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={expenseForm.category} onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none">
                  <option value="Utilities">Utilities</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Events">Events</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input type="text" value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₱)</label>
                <input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowExpenseModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200">Cancel</button>
              <button onClick={handleAddExpense} className="flex-1 py-2.5 rounded-xl text-white" style={{ backgroundColor: '#5B8C51' }}>Save to Database</button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Invoice</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Student Name</label>
                <input type="text" value={invoiceForm.student_name} onChange={(e) => setInvoiceForm({...invoiceForm, student_name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₱)</label>
                <input type="number" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({...invoiceForm, amount: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input type="date" value={invoiceForm.due_date} onChange={(e) => setInvoiceForm({...invoiceForm, due_date: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowInvoiceModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200">Cancel</button>
              <button onClick={handleAddInvoice} className="flex-1 py-2.5 rounded-xl text-white" style={{ backgroundColor: '#5B8C51' }}>Save to Database</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
