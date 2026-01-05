import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

interface AcademicYear {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
}

interface FeeStructure {
  id: string
  name: string
  amount: number
  grade_level: string
  description: string
  is_required: boolean
}

interface UserAccount {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
}

interface GradeLevel {
  id: string
  name: string
  is_active: boolean
}

type SettingsTab = 'school' | 'academic' | 'users' | 'fees' | 'grades' | 'notifications' | 'system' | 'backup'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('school')
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // School Info - persisted to school_settings table
  const [schoolInfo, setSchoolInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    principal: '',
    founded_year: ''
  })

  // Academic Years - persisted to academic_years table
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [showYearModal, setShowYearModal] = useState(false)
  const [yearForm, setYearForm] = useState({ name: '', start_date: '', end_date: '' })

  // Users - from profiles table
  const [users, setUsers] = useState<UserAccount[]>([])
  const [userFilter, setUserFilter] = useState('all')
  const [showUserModal, setShowUserModal] = useState(false)
  const [userForm, setUserForm] = useState({ full_name: '', email: '', role: 'student', password: '' })

  // Fees - persisted to fee_structure table
  const [fees, setFees] = useState<FeeStructure[]>([])
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [feeForm, setFeeForm] = useState({ name: '', amount: 0, grade_level: 'All', description: '', is_required: false })
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null)

  // Grade Levels - persisted to grade_levels table
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([])

  // Notifications - persisted to notification_settings table
  const [notifications, setNotifications] = useState({
    email_announcements: true,
    email_grades: true,
    email_attendance: false,
    email_payments: true,
    sms_urgent: true,
    sms_reminders: false,
  })

  // System Settings - persisted to system_settings table
  const [systemSettings, setSystemSettings] = useState({
    timezone: 'Asia/Manila',
    currency: 'PHP',
    date_format: 'MM/DD/YYYY',
    grading_system: 'percentage',
    attendance_threshold: 80,
    late_payment_penalty: 5,
  })

  // Load School Info
  const loadSchoolInfo = useCallback(async () => {
    const { data } = await supabase.from('school_settings').select('*').single()
    if (data) {
      setSchoolInfo({
        name: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        principal: data.principal || '',
        founded_year: data.founded_year || ''
      })
    }
  }, [])

  // Load Academic Years
  const loadAcademicYears = useCallback(async () => {
    const { data } = await supabase.from('academic_years').select('*').order('start_date', { ascending: false })
    if (data && data.length > 0) {
      setAcademicYears(data)
    } else {
      // Insert default years if none exist
      const defaultYears = [
        { name: '2024-2025', start_date: '2024-06-01', end_date: '2025-03-31', is_active: false },
        { name: '2025-2026', start_date: '2025-06-01', end_date: '2026-03-31', is_active: true },
        { name: '2026-2027', start_date: '2026-06-01', end_date: '2027-03-31', is_active: false },
      ]
      const { data: inserted } = await supabase.from('academic_years').insert(defaultYears).select()
      if (inserted) setAcademicYears(inserted)
    }
  }, [])

  // Load Users
  const loadUsers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('id, full_name, email, role, is_active').order('full_name')
    if (data) setUsers(data.map(u => ({ ...u, email: u.email || '', is_active: u.is_active ?? true })))
    setLoading(false)
  }, [])

  // Load Fees
  const loadFees = useCallback(async () => {
    const { data } = await supabase.from('fee_structure').select('*').order('name')
    if (data && data.length > 0) {
      setFees(data)
    } else {
      // Insert default fees if none exist
      const defaultFees = [
        { name: 'Tuition Fee', amount: 15000, grade_level: 'All', description: 'Monthly tuition', is_required: true },
        { name: 'Registration Fee', amount: 2500, grade_level: 'All', description: 'One-time registration', is_required: true },
        { name: 'Laboratory Fee', amount: 1500, grade_level: 'Grade 7-12', description: 'Science lab materials', is_required: true },
        { name: 'Computer Fee', amount: 1000, grade_level: 'All', description: 'Computer lab usage', is_required: false },
        { name: 'Library Fee', amount: 500, grade_level: 'All', description: 'Library resources', is_required: false },
      ]
      const { data: inserted } = await supabase.from('fee_structure').insert(defaultFees).select()
      if (inserted) setFees(inserted)
    }
  }, [])

  // Load Grade Levels
  const loadGradeLevels = useCallback(async () => {
    const { data } = await supabase.from('grade_levels').select('*').order('id')
    if (data && data.length > 0) {
      setGradeLevels(data)
    } else {
      // Insert default grade levels if none exist
      const defaultGrades = [
        'Kinder 1', 'Kinder 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
        'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
      ].map((name, idx) => ({ name, is_active: true }))
      const { data: inserted } = await supabase.from('grade_levels').insert(defaultGrades).select()
      if (inserted) setGradeLevels(inserted)
    }
  }, [])

  // Load Notification Settings
  const loadNotifications = useCallback(async () => {
    const { data } = await supabase.from('notification_settings').select('*').single()
    if (data) setNotifications(data)
  }, [])

  // Load System Settings
  const loadSystemSettings = useCallback(async () => {
    const { data } = await supabase.from('system_settings').select('*').single()
    if (data) setSystemSettings(data)
  }, [])

  // Initial Load based on active tab
  useEffect(() => {
    if (activeTab === 'school') loadSchoolInfo()
    if (activeTab === 'academic') loadAcademicYears()
    if (activeTab === 'users') loadUsers()
    if (activeTab === 'fees') loadFees()
    if (activeTab === 'grades') loadGradeLevels()
    if (activeTab === 'notifications') loadNotifications()
    if (activeTab === 'system') loadSystemSettings()
  }, [activeTab, loadSchoolInfo, loadAcademicYears, loadUsers, loadFees, loadGradeLevels, loadNotifications, loadSystemSettings])

  // Save School Info
  const handleSaveSchool = async () => {
    setSaveStatus('saving')
    await supabase.from('school_settings').upsert({ id: 1, ...schoolInfo })
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  // Academic Year Handlers
  const handleSetActiveYear = async (id: string) => {
    // Set all to inactive first
    await supabase.from('academic_years').update({ is_active: false }).neq('id', '')
    // Set selected as active
    await supabase.from('academic_years').update({ is_active: true }).eq('id', id)
    loadAcademicYears()
  }

  const handleAddYear = async () => {
    if (!yearForm.name) return
    await supabase.from('academic_years').insert({ ...yearForm, is_active: false })
    setShowYearModal(false)
    setYearForm({ name: '', start_date: '', end_date: '' })
    loadAcademicYears()
  }

  const handleDeleteYear = async (id: string) => {
    if (confirm('Delete this academic year?')) {
      await supabase.from('academic_years').delete().eq('id', id)
      loadAcademicYears()
    }
  }

  // User Handlers
  const handleAddUser = async () => {
    if (!userForm.full_name || !userForm.email) return
    await supabase.from('profiles').insert({
      full_name: userForm.full_name,
      email: userForm.email,
      role: userForm.role,
      is_active: true
    })
    setShowUserModal(false)
    setUserForm({ full_name: '', email: '', role: 'student', password: '' })
    loadUsers()
  }

  const handleDeleteUser = async (id: string) => {
    if (confirm('Delete this user?')) {
      await supabase.from('profiles').delete().eq('id', id)
      loadUsers()
    }
  }

  // Fee Handlers
  const handleSaveFee = async () => {
    if (!feeForm.name || feeForm.amount <= 0) return
    if (editingFeeId) {
      await supabase.from('fee_structure').update(feeForm).eq('id', editingFeeId)
    } else {
      await supabase.from('fee_structure').insert(feeForm)
    }
    setShowFeeModal(false)
    setFeeForm({ name: '', amount: 0, grade_level: 'All', description: '', is_required: false })
    setEditingFeeId(null)
    loadFees()
  }

  const handleEditFee = (fee: FeeStructure) => {
    setFeeForm({ name: fee.name, amount: fee.amount, grade_level: fee.grade_level, description: fee.description, is_required: fee.is_required })
    setEditingFeeId(fee.id)
    setShowFeeModal(true)
  }

  const handleDeleteFee = async (id: string) => {
    if (confirm('Delete this fee?')) {
      await supabase.from('fee_structure').delete().eq('id', id)
      loadFees()
    }
  }

  // Grade Level Handler
  const handleToggleGrade = async (id: string, currentState: boolean) => {
    await supabase.from('grade_levels').update({ is_active: !currentState }).eq('id', id)
    loadGradeLevels()
  }

  // Save Notifications
  const handleSaveNotifications = async (key: string, value: boolean) => {
    const updated = { ...notifications, [key]: value }
    setNotifications(updated)
    await supabase.from('notification_settings').upsert({ id: 1, ...updated })
  }

  // Save System Settings
  const handleSaveSystemSettings = async () => {
    setSaveStatus('saving')
    await supabase.from('system_settings').upsert({ id: 1, ...systemSettings })
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  // Export Handler
  const handleExport = async (type: string) => {
    let data: any[] = []
    if (type === 'Students') {
      const { data: students } = await supabase.from('student_records').select('*')
      data = students || []
    } else if (type === 'Teachers') {
      const { data: teachers } = await supabase.from('profiles').select('*').eq('role', 'teacher')
      data = teachers || []
    } else if (type === 'Finance') {
      const { data: payments } = await supabase.from('payments').select('*')
      data = payments || []
    }
    
    if (data.length > 0) {
      const csv = [Object.keys(data[0]).join(','), ...data.map(row => Object.values(row).join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type.toLowerCase()}_export.csv`
      a.click()
    } else {
      alert(`No ${type} data to export.`)
    }
  }

  const handleBackup = async () => {
    // Export all data
    const tables = ['profiles', 'student_records', 'academic_years', 'fee_structure', 'payments', 'expenses']
    const backup: Record<string, any> = {}
    
    for (const table of tables) {
      const { data } = await supabase.from(table).select('*')
      backup[table] = data || []
    }
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const filteredUsers = userFilter === 'all' ? users : users.filter(u => u.role === userFilter)

  const tabs = [
    { id: 'school', label: 'School Info', icon: '🏫' },
    { id: 'academic', label: 'Academic Years', icon: '📅' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'fees', label: 'Fee Structure', icon: '💰' },
    { id: 'grades', label: 'Grade Levels', icon: '📚' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'system', label: 'System', icon: '⚙️' },
    { id: 'backup', label: 'Backup', icon: '💾' },
  ]

  return (
    <div className="flex-1 p-6" style={{ backgroundColor: '#F8FAF7' }}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">⚙️ Settings</h1>
        <p className="text-gray-500">Manage system configuration (all data persisted to database)</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-52 bg-white rounded-2xl p-3 shadow-sm h-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left mb-1 ${
                activeTab === tab.id ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={activeTab === tab.id ? { backgroundColor: '#5B8C51' } : {}}
            >
              <span>{tab.icon}</span>
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm">
          {/* School Info Tab */}
          {activeTab === 'school' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">School Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                  <input type="text" value={schoolInfo.name} onChange={e => setSchoolInfo({...schoolInfo, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-green-500" placeholder="Enter school name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Principal</label>
                  <input type="text" value={schoolInfo.principal} onChange={e => setSchoolInfo({...schoolInfo, principal: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-green-500" placeholder="Principal name" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input type="text" value={schoolInfo.address} onChange={e => setSchoolInfo({...schoolInfo, address: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-green-500" placeholder="School address" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={schoolInfo.phone} onChange={e => setSchoolInfo({...schoolInfo, phone: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-green-500" placeholder="Phone number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={schoolInfo.email} onChange={e => setSchoolInfo({...schoolInfo, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-green-500" placeholder="Email address" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input type="url" value={schoolInfo.website} onChange={e => setSchoolInfo({...schoolInfo, website: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-green-500" placeholder="Website URL" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Founded Year</label>
                  <input type="text" value={schoolInfo.founded_year} onChange={e => setSchoolInfo({...schoolInfo, founded_year: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-green-500" placeholder="e.g., 1995" />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={handleSaveSchool} className="px-6 py-2.5 rounded-xl text-white font-medium" style={{ backgroundColor: '#5B8C51' }}>
                  {saveStatus === 'saving' ? '⏳ Saving...' : saveStatus === 'saved' ? '✓ Saved!' : '💾 Save to Database'}
                </button>
              </div>
            </div>
          )}

          {/* Academic Years Tab */}
          {activeTab === 'academic' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Academic Years</h2>
                <button onClick={() => setShowYearModal(true)} className="px-4 py-2 rounded-xl text-white font-medium" style={{ backgroundColor: '#5B8C51' }}>+ Add Year</button>
              </div>
              <div className="space-y-3">
                {academicYears.map(year => (
                  <div key={year.id} className={`p-4 rounded-xl border-2 flex justify-between items-center ${year.is_active ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${year.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <div>
                        <p className="font-bold text-gray-800">{year.name}</p>
                        <p className="text-sm text-gray-500">{year.start_date} to {year.end_date}</p>
                      </div>
                      {year.is_active && <span className="px-2 py-1 rounded-full text-xs text-white" style={{ backgroundColor: '#5B8C51' }}>Current</span>}
                    </div>
                    <div className="flex gap-2">
                      {!year.is_active && <button onClick={() => handleSetActiveYear(year.id)} className="px-3 py-1.5 rounded-lg text-sm bg-blue-100 text-blue-700">Set Active</button>}
                      <button onClick={() => handleDeleteYear(year.id)} className="px-3 py-1.5 rounded-lg text-sm bg-red-100 text-red-700">🗑️</button>
                    </div>
                  </div>
                ))}
                {academicYears.length === 0 && <p className="text-center py-8 text-gray-500">Loading academic years...</p>}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">User Management</h2>
                <button onClick={() => setShowUserModal(true)} className="px-4 py-2 rounded-xl text-white font-medium" style={{ backgroundColor: '#5B8C51' }}>+ Add User</button>
              </div>
              <div className="flex gap-2 mb-4">
                {['all', 'admin', 'teacher', 'student', 'finance'].map(role => (
                  <button key={role} onClick={() => setUserFilter(role)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${userFilter === role ? 'text-white' : 'bg-gray-100 text-gray-600'}`} style={userFilter === role ? { backgroundColor: '#5B8C51' } : {}}>
                    {role === 'all' ? 'All' : role}
                  </button>
                ))}
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Role</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-500">Loading...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-500">No users found</td></tr>
                  ) : filteredUsers.map(user => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{user.full_name}</td>
                      <td className="py-3 px-4 text-gray-600">{user.email || '-'}</td>
                      <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs capitalize ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : user.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{user.role}</span></td>
                      <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td className="py-3 px-4"><button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">🗑️</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Fees Tab */}
          {activeTab === 'fees' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Fee Structure</h2>
                <button onClick={() => { setEditingFeeId(null); setFeeForm({ name: '', amount: 0, grade_level: 'All', description: '', is_required: false }); setShowFeeModal(true); }} className="px-4 py-2 rounded-xl text-white font-medium" style={{ backgroundColor: '#5B8C51' }}>+ Add Fee</button>
              </div>
              <div className="space-y-3">
                {fees.map(fee => (
                  <div key={fee.id} className="p-4 rounded-xl border border-gray-200 flex justify-between items-center hover:shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: '#E8F5E3' }}>💵</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-800">{fee.name}</p>
                          {fee.is_required && <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Required</span>}
                        </div>
                        <p className="text-sm text-gray-500">{fee.description} • {fee.grade_level}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xl font-bold" style={{ color: '#5B8C51' }}>₱{fee.amount.toLocaleString()}</p>
                      <button onClick={() => handleEditFee(fee)} className="p-2 hover:bg-gray-100 rounded-lg">✏️</button>
                      <button onClick={() => handleDeleteFee(fee.id)} className="p-2 hover:bg-red-100 rounded-lg text-red-600">🗑️</button>
                    </div>
                  </div>
                ))}
                {fees.length === 0 && <p className="text-center py-8 text-gray-500">Loading fees...</p>}
              </div>
              <div className="mt-6 p-4 rounded-xl bg-gray-50">
                <p className="text-gray-600">Total Required: <span className="font-bold">₱{fees.filter(f => f.is_required).reduce((s, f) => s + f.amount, 0).toLocaleString()}</span></p>
                <p className="text-gray-600">Total Optional: <span className="font-bold">₱{fees.filter(f => !f.is_required).reduce((s, f) => s + f.amount, 0).toLocaleString()}</span></p>
              </div>
            </div>
          )}

          {/* Grade Levels Tab */}
          {activeTab === 'grades' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Grade Levels</h2>
              <div className="grid grid-cols-2 gap-3">
                {gradeLevels.map(grade => (
                  <div key={grade.id} className={`p-4 rounded-xl border-2 flex justify-between items-center ${grade.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📚</span>
                      <span className="font-medium">{grade.name}</span>
                    </div>
                    <button onClick={() => handleToggleGrade(grade.id, grade.is_active)} className={`w-12 h-6 rounded-full relative ${grade.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${grade.is_active ? 'right-0.5' : 'left-0.5'}`}></div>
                    </button>
                  </div>
                ))}
                {gradeLevels.length === 0 && <p className="col-span-2 text-center py-8 text-gray-500">Loading grade levels...</p>}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Notification Settings</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">📧 Email Notifications</h3>
                  {[{ key: 'email_announcements', label: 'School Announcements' }, { key: 'email_grades', label: 'Grade Updates' }, { key: 'email_attendance', label: 'Attendance Alerts' }, { key: 'email_payments', label: 'Payment Reminders' }].map(item => (
                    <div key={item.key} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 mb-2">
                      <span>{item.label}</span>
                      <button onClick={() => handleSaveNotifications(item.key, !notifications[item.key as keyof typeof notifications])} className={`w-12 h-6 rounded-full relative ${notifications[item.key as keyof typeof notifications] ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${notifications[item.key as keyof typeof notifications] ? 'right-0.5' : 'left-0.5'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">📱 SMS Notifications</h3>
                  {[{ key: 'sms_urgent', label: 'Urgent Alerts' }, { key: 'sms_reminders', label: 'Payment Reminders' }].map(item => (
                    <div key={item.key} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 mb-2">
                      <span>{item.label}</span>
                      <button onClick={() => handleSaveNotifications(item.key, !notifications[item.key as keyof typeof notifications])} className={`w-12 h-6 rounded-full relative ${notifications[item.key as keyof typeof notifications] ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${notifications[item.key as keyof typeof notifications] ? 'right-0.5' : 'left-0.5'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">System Configuration</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select value={systemSettings.timezone} onChange={e => setSystemSettings({...systemSettings, timezone: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none">
                    <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select value={systemSettings.currency} onChange={e => setSystemSettings({...systemSettings, currency: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none">
                    <option value="PHP">Philippine Peso (₱)</option>
                    <option value="USD">US Dollar ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                  <select value={systemSettings.date_format} onChange={e => setSystemSettings({...systemSettings, date_format: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none">
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grading System</label>
                  <select value={systemSettings.grading_system} onChange={e => setSystemSettings({...systemSettings, grading_system: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none">
                    <option value="percentage">Percentage (0-100%)</option>
                    <option value="letter">Letter Grade (A-F)</option>
                    <option value="gpa">GPA (0-4.0)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Threshold (%)</label>
                  <input type="number" value={systemSettings.attendance_threshold} onChange={e => setSystemSettings({...systemSettings, attendance_threshold: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Late Payment Penalty (%)</label>
                  <input type="number" value={systemSettings.late_payment_penalty} onChange={e => setSystemSettings({...systemSettings, late_payment_penalty: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={handleSaveSystemSettings} className="px-6 py-2.5 rounded-xl text-white font-medium" style={{ backgroundColor: '#5B8C51' }}>
                  {saveStatus === 'saving' ? '⏳ Saving...' : saveStatus === 'saved' ? '✓ Saved!' : '💾 Save Settings'}
                </button>
              </div>
            </div>
          )}

          {/* Backup Tab */}
          {activeTab === 'backup' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Backup & Export</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border-2 border-dashed border-gray-300 text-center">
                  <span className="text-5xl block mb-4">💾</span>
                  <h3 className="font-bold text-gray-800 mb-2">Full Database Backup</h3>
                  <p className="text-sm text-gray-500 mb-4">Download all data as JSON</p>
                  <button onClick={handleBackup} className="px-6 py-2 rounded-xl text-white font-medium" style={{ backgroundColor: '#5B8C51' }}>Download Backup</button>
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-800">Export Data (CSV)</h3>
                  {['Students', 'Teachers', 'Finance'].map(type => (
                    <button key={type} onClick={() => handleExport(type)} className="w-full p-3 rounded-xl border border-gray-200 hover:bg-gray-50 flex justify-between items-center">
                      <span>📄 Export {type}</span>
                      <span className="text-gray-400">CSV</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Year Modal */}
      {showYearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Academic Year</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Year Name</label>
                <input type="text" value={yearForm.name} onChange={e => setYearForm({...yearForm, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" placeholder="e.g., 2027-2028" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input type="date" value={yearForm.start_date} onChange={e => setYearForm({...yearForm, start_date: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input type="date" value={yearForm.end_date} onChange={e => setYearForm({...yearForm, end_date: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowYearModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200">Cancel</button>
              <button onClick={handleAddYear} className="flex-1 py-2.5 rounded-xl text-white" style={{ backgroundColor: '#5B8C51' }}>Add Year</button>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input type="text" value={userForm.full_name} onChange={e => setUserForm({...userForm, full_name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none">
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                  <option value="finance">Finance</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowUserModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200">Cancel</button>
              <button onClick={handleAddUser} className="flex-1 py-2.5 rounded-xl text-white" style={{ backgroundColor: '#5B8C51' }}>Add User</button>
            </div>
          </div>
        </div>
      )}

      {/* Fee Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingFeeId ? 'Edit Fee' : 'Add Fee'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fee Name</label>
                <input type="text" value={feeForm.name} onChange={e => setFeeForm({...feeForm, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₱)</label>
                <input type="number" value={feeForm.amount} onChange={e => setFeeForm({...feeForm, amount: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Applies To</label>
                <select value={feeForm.grade_level} onChange={e => setFeeForm({...feeForm, grade_level: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none">
                  <option value="All">All Grade Levels</option>
                  <option value="Kinder">Kinder 1-2</option>
                  <option value="Grade 1-6">Grade 1-6</option>
                  <option value="Grade 7-12">Grade 7-12</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={feeForm.description} onChange={e => setFeeForm({...feeForm, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" rows={2}></textarea>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="required" checked={feeForm.is_required} onChange={e => setFeeForm({...feeForm, is_required: e.target.checked})} className="w-4 h-4" />
                <label htmlFor="required" className="text-sm">Required fee</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowFeeModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200">Cancel</button>
              <button onClick={handleSaveFee} className="flex-1 py-2.5 rounded-xl text-white" style={{ backgroundColor: '#5B8C51' }}>{editingFeeId ? 'Update' : 'Add Fee'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
