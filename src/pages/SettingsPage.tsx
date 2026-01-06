import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

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
  user_id: string
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

interface MenuPermission {
  menu_key: string
  is_enabled: boolean
}

type SettingsTab = 'school' | 'academic' | 'users' | 'fees' | 'grades' | 'notifications' | 'system' | 'backup'

const ALL_MENU_KEYS = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'grade-levels', label: 'Grade Levels', icon: '📚' },
  { key: 'students', label: 'Students', icon: '👤' },
  { key: 'records', label: 'Records', icon: '📋' },
  { key: 'teachers', label: 'Teachers', icon: '🅿️' },
  { key: 'classes', label: 'Classes', icon: '📖' },
  { key: 'attendance', label: 'Attendance', icon: '✅' },
  { key: 'calendar', label: 'Calendar', icon: '📅' },
  { key: 'chat', label: 'Chat', icon: '💬' },
  { key: 'finance', label: 'Finance', icon: '💳' },
  { key: 'reports', label: 'Reports', icon: '📊' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
]

export function SettingsPage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>('school')
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // School Info
  const [schoolInfo, setSchoolInfo] = useState({
    name: '', address: '', phone: '', email: '', website: '', principal: '', founded_year: ''
  })

  // Academic Years
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [showYearModal, setShowYearModal] = useState(false)
  const [yearForm, setYearForm] = useState({ name: '', start_date: '', end_date: '' })

  // Users
  const [users, setUsers] = useState<UserAccount[]>([])
  const [userFilter, setUserFilter] = useState('all')
  const [showUserModal, setShowUserModal] = useState(false)
  const [userForm, setUserForm] = useState({ full_name: '', email: '', role: 'student', password: '' })
  
  // Permission Management
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null)
  const [userPermissions, setUserPermissions] = useState<MenuPermission[]>([])
  const [savingPermissions, setSavingPermissions] = useState(false)

  // Fees
  const [fees, setFees] = useState<FeeStructure[]>([])
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [feeForm, setFeeForm] = useState({ name: '', amount: 0, grade_level: 'All', description: '', is_required: false })
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null)

  // Grade Levels
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([])

  // Notifications
  const [notifications, setNotifications] = useState({
    email_announcements: true, email_grades: true, email_attendance: false, email_payments: true,
    sms_urgent: true, sms_reminders: false,
  })

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    timezone: 'Asia/Manila', currency: 'PHP', date_format: 'MM/DD/YYYY',
    grading_system: 'percentage', attendance_threshold: 80, late_payment_penalty: 5,
  })

  // Role-based tab visibility
  const getVisibleTabs = () => {
    const allTabs = [
      { id: 'school', label: 'School Info', icon: '🏫', roles: ['admin', 'principal', 'registrar'] },
      { id: 'academic', label: 'Academic Years', icon: '📅', roles: ['admin', 'principal', 'registrar'] },
      { id: 'users', label: 'Users', icon: '👥', roles: ['admin', 'principal', 'registrar'] },
      { id: 'fees', label: 'Fee Structure', icon: '💰', roles: ['admin', 'principal', 'accounting'] },
      { id: 'grades', label: 'Grade Levels', icon: '📚', roles: ['admin', 'principal', 'registrar'] },
      { id: 'notifications', label: 'Notifications', icon: '🔔', roles: ['admin', 'principal', 'registrar', 'accounting'] },
      { id: 'system', label: 'System', icon: '⚙️', roles: ['admin', 'principal'] },
      { id: 'backup', label: 'Backup', icon: '💾', roles: ['admin'] },
    ]
    return allTabs.filter(tab => tab.roles.includes(profile?.role || ''))
  }

  const tabs = getVisibleTabs()

  // Load functions
  const loadSchoolInfo = useCallback(async () => {
    const { data } = await supabase.from('school_settings').select('*').single()
    if (data) setSchoolInfo({ name: data.name || '', address: data.address || '', phone: data.phone || '', email: data.email || '', website: data.website || '', principal: data.principal || '', founded_year: data.founded_year || '' })
  }, [])

  const loadAcademicYears = useCallback(async () => {
    const { data } = await supabase.from('academic_years').select('*').order('start_date', { ascending: false })
    setAcademicYears(data || [])
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('id, user_id, full_name, email, role, is_active').order('full_name')
    setUsers(data?.map(u => ({ ...u, email: u.email || '', is_active: u.is_active ?? true })) || [])
    setLoading(false)
  }, [])

  const loadFees = useCallback(async () => {
    const { data } = await supabase.from('fee_structure').select('*').order('name')
    setFees(data || [])
  }, [])

  const loadGradeLevels = useCallback(async () => {
    const { data } = await supabase.from('grade_levels').select('*').order('id')
    setGradeLevels(data || [])
  }, [])

  const loadNotifications = useCallback(async () => {
    const { data } = await supabase.from('notification_settings').select('*').single()
    if (data) setNotifications(data)
  }, [])

  const loadSystemSettings = useCallback(async () => {
    const { data } = await supabase.from('system_settings').select('*').single()
    if (data) setSystemSettings(data)
  }, [])

  useEffect(() => {
    if (activeTab === 'school') loadSchoolInfo()
    if (activeTab === 'academic') loadAcademicYears()
    if (activeTab === 'users') loadUsers()
    if (activeTab === 'fees') loadFees()
    if (activeTab === 'grades') loadGradeLevels()
    if (activeTab === 'notifications') loadNotifications()
    if (activeTab === 'system') loadSystemSettings()
  }, [activeTab, loadSchoolInfo, loadAcademicYears, loadUsers, loadFees, loadGradeLevels, loadNotifications, loadSystemSettings])

  // Handlers
  const handleSaveSchool = async () => {
    setSaveStatus('saving')
    await supabase.from('school_settings').upsert({ id: 1, ...schoolInfo })
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  const handleSetActiveYear = async (id: string) => {
    await supabase.from('academic_years').update({ is_active: false }).neq('id', '')
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

  const handleAddUser = async () => {
    if (!userForm.full_name || !userForm.email) return
    await supabase.from('profiles').insert({ full_name: userForm.full_name, email: userForm.email, role: userForm.role, is_active: true })
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

  // Permission Management
  const openPermissionModal = async (user: UserAccount) => {
    setSelectedUser(user)
    const { data } = await supabase.from('user_menu_permissions').select('menu_key, is_enabled').eq('user_id', user.user_id)
    const permissions = ALL_MENU_KEYS.map(menu => {
      const existing = data?.find(p => p.menu_key === menu.key)
      return { menu_key: menu.key, is_enabled: existing?.is_enabled ?? true }
    })
    setUserPermissions(permissions)
    setShowPermissionModal(true)
  }

  const togglePermission = (menuKey: string) => {
    setUserPermissions(prev => prev.map(p => p.menu_key === menuKey ? { ...p, is_enabled: !p.is_enabled } : p))
  }

  const savePermissions = async () => {
    if (!selectedUser) return
    setSavingPermissions(true)
    
    // Delete existing and insert new
    await supabase.from('user_menu_permissions').delete().eq('user_id', selectedUser.user_id)
    
    const inserts = userPermissions.map(p => ({
      user_id: selectedUser.user_id,
      menu_key: p.menu_key,
      is_enabled: p.is_enabled
    }))
    
    await supabase.from('user_menu_permissions').insert(inserts)
    setSavingPermissions(false)
    setShowPermissionModal(false)
  }

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

  const handleToggleGrade = async (id: string, currentState: boolean) => {
    await supabase.from('grade_levels').update({ is_active: !currentState }).eq('id', id)
    loadGradeLevels()
  }

  const handleSaveNotifications = async (key: string, value: boolean) => {
    const updated = { ...notifications, [key]: value }
    setNotifications(updated)
    await supabase.from('notification_settings').upsert({ id: 1, ...updated })
  }

  const handleSaveSystemSettings = async () => {
    setSaveStatus('saving')
    await supabase.from('system_settings').upsert({ id: 1, ...systemSettings })
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

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

  return (
    <div className="flex-1 p-6" style={{ backgroundColor: '#F8FAF7' }}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">⚙️ Settings</h1>
        <p className="text-gray-500">Manage system configuration</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-52 bg-white rounded-2xl p-3 shadow-sm h-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left mb-1 ${activeTab === tab.id ? 'text-white' : 'text-gray-600 hover:bg-gray-50'}`}
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
                <div><label className="block text-sm font-medium text-gray-700 mb-1">School Name</label><input type="text" value={schoolInfo.name} onChange={e => setSchoolInfo({...schoolInfo, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-green-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Principal</label><input type="text" value={schoolInfo.principal} onChange={e => setSchoolInfo({...schoolInfo, principal: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-green-500" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" value={schoolInfo.address} onChange={e => setSchoolInfo({...schoolInfo, address: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-green-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={schoolInfo.phone} onChange={e => setSchoolInfo({...schoolInfo, phone: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-green-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={schoolInfo.email} onChange={e => setSchoolInfo({...schoolInfo, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-green-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Website</label><input type="url" value={schoolInfo.website} onChange={e => setSchoolInfo({...schoolInfo, website: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-green-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Founded Year</label><input type="text" value={schoolInfo.founded_year} onChange={e => setSchoolInfo({...schoolInfo, founded_year: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-green-500" /></div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={handleSaveSchool} className="px-6 py-2.5 rounded-xl text-white font-medium" style={{ backgroundColor: '#5B8C51' }}>{saveStatus === 'saving' ? '⏳ Saving...' : saveStatus === 'saved' ? '✓ Saved!' : '💾 Save'}</button>
              </div>
            </div>
          )}

          {/* Academic Years Tab */}
          {activeTab === 'academic' && (
            <div>
              <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-800">Academic Years</h2><button onClick={() => setShowYearModal(true)} className="px-4 py-2 rounded-xl text-white font-medium" style={{ backgroundColor: '#5B8C51' }}>+ Add Year</button></div>
              <div className="space-y-3">
                {academicYears.length === 0 ? <p className="text-center py-8 text-gray-500">No academic years found</p> : academicYears.map(year => (
                  <div key={year.id} className={`p-4 rounded-xl border-2 flex justify-between items-center ${year.is_active ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${year.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div><div><p className="font-bold text-gray-800">{year.name}</p><p className="text-sm text-gray-500">{year.start_date} to {year.end_date}</p></div>{year.is_active && <span className="px-2 py-1 rounded-full text-xs text-white" style={{ backgroundColor: '#5B8C51' }}>Current</span>}</div>
                    <div className="flex gap-2">{!year.is_active && <button onClick={() => handleSetActiveYear(year.id)} className="px-3 py-1.5 rounded-lg text-sm bg-blue-100 text-blue-700">Set Active</button>}<button onClick={() => handleDeleteYear(year.id)} className="px-3 py-1.5 rounded-lg text-sm bg-red-100 text-red-700">🗑️</button></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-800">User Management</h2><button onClick={() => setShowUserModal(true)} className="px-4 py-2 rounded-xl text-white font-medium" style={{ backgroundColor: '#5B8C51' }}>+ Add User</button></div>
              <div className="flex gap-2 mb-4">
                {['all', 'admin', 'principal', 'registrar', 'accounting', 'teacher', 'student', 'finance'].map(role => (
                  <button key={role} onClick={() => setUserFilter(role)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${userFilter === role ? 'text-white' : 'bg-gray-100 text-gray-600'}`} style={userFilter === role ? { backgroundColor: '#5B8C51' } : {}}>{role === 'all' ? 'All' : role}</button>
                ))}
              </div>
              <table className="w-full">
                <thead><tr className="border-b"><th className="text-left py-3 px-4 text-sm text-gray-600">Name</th><th className="text-left py-3 px-4 text-sm text-gray-600">Email</th><th className="text-left py-3 px-4 text-sm text-gray-600">Role</th><th className="text-left py-3 px-4 text-sm text-gray-600">Status</th><th className="text-left py-3 px-4 text-sm text-gray-600">Actions</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={5} className="py-8 text-center text-gray-500">Loading...</td></tr> : filteredUsers.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-gray-500">No users found</td></tr> : filteredUsers.map(user => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{user.full_name}</td>
                      <td className="py-3 px-4 text-gray-600">{user.email || '-'}</td>
                      <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs capitalize ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : user.role === 'principal' ? 'bg-indigo-100 text-indigo-700' : user.role === 'registrar' ? 'bg-teal-100 text-teal-700' : user.role === 'accounting' ? 'bg-amber-100 text-amber-700' : user.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{user.role}</span></td>
                      <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td className="py-3 px-4 flex gap-2">
                        {profile?.role === 'admin' && user.role !== 'admin' && <button onClick={() => openPermissionModal(user)} className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-sm">🔑 Permissions</button>}
                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Fees Tab */}
          {activeTab === 'fees' && (
            <div>
              <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-800">Fee Structure</h2><button onClick={() => { setEditingFeeId(null); setFeeForm({ name: '', amount: 0, grade_level: 'All', description: '', is_required: false }); setShowFeeModal(true); }} className="px-4 py-2 rounded-xl text-white font-medium" style={{ backgroundColor: '#5B8C51' }}>+ Add Fee</button></div>
              <div className="space-y-3">
                {fees.length === 0 ? <p className="text-center py-8 text-gray-500">No fees found</p> : fees.map(fee => (
                  <div key={fee.id} className="p-4 rounded-xl border border-gray-200 flex justify-between items-center hover:shadow-sm">
                    <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: '#E8F5E3' }}>💵</div><div><div className="flex items-center gap-2"><p className="font-bold text-gray-800">{fee.name}</p>{fee.is_required && <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Required</span>}</div><p className="text-sm text-gray-500">{fee.description} • {fee.grade_level}</p></div></div>
                    <div className="flex items-center gap-4"><p className="text-xl font-bold" style={{ color: '#5B8C51' }}>₱{fee.amount.toLocaleString()}</p><button onClick={() => handleEditFee(fee)} className="p-2 hover:bg-gray-100 rounded-lg">✏️</button><button onClick={() => handleDeleteFee(fee.id)} className="p-2 hover:bg-red-100 rounded-lg text-red-600">🗑️</button></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grade Levels Tab */}
          {activeTab === 'grades' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Grade Levels</h2>
              <div className="grid grid-cols-2 gap-3">
                {gradeLevels.length === 0 ? <p className="col-span-2 text-center py-8 text-gray-500">No grade levels found</p> : gradeLevels.map(grade => (
                  <div key={grade.id} className={`p-4 rounded-xl border-2 flex justify-between items-center ${grade.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-3"><span className="text-xl">📚</span><span className="font-medium">{grade.name}</span></div>
                    <button onClick={() => handleToggleGrade(grade.id, grade.is_active)} className={`w-12 h-6 rounded-full relative ${grade.is_active ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${grade.is_active ? 'right-0.5' : 'left-0.5'}`}></div></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Notification Settings</h2>
              <div className="space-y-6">
                <div><h3 className="font-semibold text-gray-700 mb-3">📧 Email Notifications</h3>
                  {[{ key: 'email_announcements', label: 'School Announcements' }, { key: 'email_grades', label: 'Grade Updates' }, { key: 'email_attendance', label: 'Attendance Alerts' }, { key: 'email_payments', label: 'Payment Reminders' }].map(item => (
                    <div key={item.key} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 mb-2"><span>{item.label}</span><button onClick={() => handleSaveNotifications(item.key, !notifications[item.key as keyof typeof notifications])} className={`w-12 h-6 rounded-full relative ${notifications[item.key as keyof typeof notifications] ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${notifications[item.key as keyof typeof notifications] ? 'right-0.5' : 'left-0.5'}`}></div></button></div>
                  ))}
                </div>
                <div><h3 className="font-semibold text-gray-700 mb-3">📱 SMS Notifications</h3>
                  {[{ key: 'sms_urgent', label: 'Urgent Alerts' }, { key: 'sms_reminders', label: 'Payment Reminders' }].map(item => (
                    <div key={item.key} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 mb-2"><span>{item.label}</span><button onClick={() => handleSaveNotifications(item.key, !notifications[item.key as keyof typeof notifications])} className={`w-12 h-6 rounded-full relative ${notifications[item.key as keyof typeof notifications] ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${notifications[item.key as keyof typeof notifications] ? 'right-0.5' : 'left-0.5'}`}></div></button></div>
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
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label><select value={systemSettings.timezone} onChange={e => setSystemSettings({...systemSettings, timezone: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none"><option value="Asia/Manila">Asia/Manila (GMT+8)</option><option value="America/New_York">America/New_York (EST)</option><option value="Europe/London">Europe/London (GMT)</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Currency</label><select value={systemSettings.currency} onChange={e => setSystemSettings({...systemSettings, currency: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none"><option value="PHP">Philippine Peso (₱)</option><option value="USD">US Dollar ($)</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label><select value={systemSettings.date_format} onChange={e => setSystemSettings({...systemSettings, date_format: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none"><option value="MM/DD/YYYY">MM/DD/YYYY</option><option value="DD/MM/YYYY">DD/MM/YYYY</option><option value="YYYY-MM-DD">YYYY-MM-DD</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Grading System</label><select value={systemSettings.grading_system} onChange={e => setSystemSettings({...systemSettings, grading_system: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none"><option value="percentage">Percentage (0-100%)</option><option value="letter">Letter Grade (A-F)</option><option value="gpa">GPA (0-4.0)</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Attendance Threshold (%)</label><input type="number" value={systemSettings.attendance_threshold} onChange={e => setSystemSettings({...systemSettings, attendance_threshold: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Late Payment Penalty (%)</label><input type="number" value={systemSettings.late_payment_penalty} onChange={e => setSystemSettings({...systemSettings, late_payment_penalty: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" /></div>
              </div>
              <div className="mt-6 flex justify-end"><button onClick={handleSaveSystemSettings} className="px-6 py-2.5 rounded-xl text-white font-medium" style={{ backgroundColor: '#5B8C51' }}>{saveStatus === 'saving' ? '⏳ Saving...' : saveStatus === 'saved' ? '✓ Saved!' : '💾 Save Settings'}</button></div>
            </div>
          )}

          {/* Backup Tab */}
          {activeTab === 'backup' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Backup & Export</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border-2 border-dashed border-gray-300 text-center"><span className="text-5xl block mb-4">💾</span><h3 className="font-bold text-gray-800 mb-2">Full Database Backup</h3><p className="text-sm text-gray-500 mb-4">Download all data as JSON</p><button onClick={handleBackup} className="px-6 py-2 rounded-xl text-white font-medium" style={{ backgroundColor: '#5B8C51' }}>Download Backup</button></div>
                <div className="space-y-3"><h3 className="font-bold text-gray-800">Export Data (CSV)</h3>{['Students', 'Teachers', 'Finance'].map(type => (<button key={type} onClick={() => handleExport(type)} className="w-full p-3 rounded-xl border border-gray-200 hover:bg-gray-50 flex justify-between items-center"><span>📄 Export {type}</span><span className="text-gray-400">CSV</span></button>))}</div>
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
              <div><label className="block text-sm font-medium mb-1">Year Name</label><input type="text" value={yearForm.name} onChange={e => setYearForm({...yearForm, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" placeholder="e.g., 2027-2028" /></div>
              <div><label className="block text-sm font-medium mb-1">Start Date</label><input type="date" value={yearForm.start_date} onChange={e => setYearForm({...yearForm, start_date: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" /></div>
              <div><label className="block text-sm font-medium mb-1">End Date</label><input type="date" value={yearForm.end_date} onChange={e => setYearForm({...yearForm, end_date: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" /></div>
            </div>
            <div className="flex gap-3 mt-6"><button onClick={() => setShowYearModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200">Cancel</button><button onClick={handleAddYear} className="flex-1 py-2.5 rounded-xl text-white" style={{ backgroundColor: '#5B8C51' }}>Add Year</button></div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add User</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Full Name</label><input type="text" value={userForm.full_name} onChange={e => setUserForm({...userForm, full_name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" /></div>
              <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" /></div>
              <div><label className="block text-sm font-medium mb-1">Role</label><select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none"><option value="student">Student</option><option value="teacher">Teacher</option><option value="registrar">Registrar</option><option value="accounting">Accounting</option><option value="finance">Finance</option><option value="admin">Admin</option><option value="principal">Principal</option></select></div>
            </div>
            <div className="flex gap-3 mt-6"><button onClick={() => setShowUserModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200">Cancel</button><button onClick={handleAddUser} className="flex-1 py-2.5 rounded-xl text-white" style={{ backgroundColor: '#5B8C51' }}>Add User</button></div>
          </div>
        </div>
      )}

      {/* Fee Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingFeeId ? 'Edit Fee' : 'Add Fee'}</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Fee Name</label><input type="text" value={feeForm.name} onChange={e => setFeeForm({...feeForm, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" /></div>
              <div><label className="block text-sm font-medium mb-1">Amount (₱)</label><input type="number" value={feeForm.amount} onChange={e => setFeeForm({...feeForm, amount: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" /></div>
              <div><label className="block text-sm font-medium mb-1">Grade Level</label><input type="text" value={feeForm.grade_level} onChange={e => setFeeForm({...feeForm, grade_level: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" /></div>
              <div><label className="block text-sm font-medium mb-1">Description</label><input type="text" value={feeForm.description} onChange={e => setFeeForm({...feeForm, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={feeForm.is_required} onChange={e => setFeeForm({...feeForm, is_required: e.target.checked})} /><label className="text-sm">Required Fee</label></div>
            </div>
            <div className="flex gap-3 mt-6"><button onClick={() => setShowFeeModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200">Cancel</button><button onClick={handleSaveFee} className="flex-1 py-2.5 rounded-xl text-white" style={{ backgroundColor: '#5B8C51' }}>{editingFeeId ? 'Update' : 'Add Fee'}</button></div>
          </div>
        </div>
      )}

      {/* Permission Modal */}
      {showPermissionModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">Manage Permissions</h2>
            <p className="text-gray-500 text-sm mb-4">{selectedUser.full_name} ({selectedUser.role})</p>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {ALL_MENU_KEYS.map(menu => {
                const perm = userPermissions.find(p => p.menu_key === menu.key)
                return (
                  <div key={menu.key} className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-2"><span>{menu.icon}</span><span className="font-medium">{menu.label}</span></div>
                    <button onClick={() => togglePermission(menu.key)} className={`w-12 h-6 rounded-full relative ${perm?.is_enabled ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${perm?.is_enabled ? 'right-0.5' : 'left-0.5'}`}></div></button>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-3 mt-6"><button onClick={() => setShowPermissionModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200">Cancel</button><button onClick={savePermissions} disabled={savingPermissions} className="flex-1 py-2.5 rounded-xl text-white" style={{ backgroundColor: '#5B8C51' }}>{savingPermissions ? 'Saving...' : 'Save Permissions'}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
