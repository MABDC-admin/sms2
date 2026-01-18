import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription'

interface AccountingUser {
  id: string
  full_name: string
  email: string
  phone: string
  avatar_url: string
  is_active: boolean
  created_at: string | null
}

export function AccountingListPage() {
  const [accountingUsers, setAccountingUsers] = useState<AccountingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<AccountingUser | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: ''
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadAccountingUsers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, avatar_url, is_active, created_at')
      .eq('role', 'accounting')
      .order('full_name')

    if (error) {
      console.error('Error loading accounting users:', error)
      setAccountingUsers([])
    } else {
      setAccountingUsers((data || []).map(item => ({
        id: item.id,
        full_name: item.full_name || 'Unknown',
        email: item.email || '',
        phone: item.phone || '',
        avatar_url: item.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${item.full_name || 'user'}&backgroundColor=transparent`,
        is_active: item.is_active ?? true,
        created_at: item.created_at
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAccountingUsers()
  }, [loadAccountingUsers])

  useRealtimeSubscription(
    { table: 'profiles', filter: 'role=eq.accounting' },
    loadAccountingUsers,
    []
  )

  function openCreateModal() {
    setEditingUser(null)
    setFormData({ full_name: '', email: '', phone: '', password: '' })
    setAvatarFile(null)
    setAvatarPreview(null)
    setShowModal(true)
  }

  function openEditModal(user: AccountingUser) {
    setEditingUser(user)
    setFormData({
      full_name: user.full_name,
      email: user.email || '',
      phone: user.phone || '',
      password: ''
    })
    setAvatarFile(null)
    setAvatarPreview(user.avatar_url)
    setShowModal(true)
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setAvatarPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  async function uploadAvatar(userId: string): Promise<string | null> {
    if (!avatarFile) return null
    try {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `accounting-avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true })

      if (uploadError) return null

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      return data.publicUrl
    } catch {
      return null
    }
  }

  async function handleSave() {
    if (!formData.full_name || !formData.email) return
    if (!editingUser && !formData.password) return

    setSaving(true)

    try {
      if (editingUser) {
        let newAvatarUrl = editingUser.avatar_url
        if (avatarFile) {
          const uploadedUrl = await uploadAvatar(editingUser.id)
          if (uploadedUrl) newAvatarUrl = uploadedUrl
        }

        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            avatar_url: newAvatarUrl
          })
          .eq('id', editingUser.id)

        if (error) throw error
      } else {
        // Create new accounting user via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
              role: 'accounting'
            },
            emailRedirectTo: `${window.location.origin}/`
          }
        })

        if (authError) throw authError

        if (authData.user) {
          let avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${formData.full_name}&backgroundColor=transparent`
          if (avatarFile) {
            const uploadedUrl = await uploadAvatar(authData.user.id)
            if (uploadedUrl) avatarUrl = uploadedUrl
          }

          await supabase.from('profiles').upsert({
            user_id: authData.user.id,
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            role: 'accounting',
            avatar_url: avatarUrl,
            is_active: true
          })
        }
      }

      await loadAccountingUsers()
      setShowModal(false)
    } catch (err: any) {
      alert(err.message || 'Failed to save accounting user')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this accounting user?')) return

    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      alert('Failed to delete accounting user')
      return
    }

    await loadAccountingUsers()
  }

  async function handleToggleStatus(user: AccountingUser) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !user.is_active })
      .eq('id', user.id)

    if (!error) await loadAccountingUsers()
  }

  return (
    <div className="flex-1 p-6" style={{ backgroundColor: '#F8FAF7' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">💰 Accounting</h1>
          <p className="text-gray-500">Manage accounting staff accounts</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium"
          style={{ backgroundColor: '#D97706' }}
        >
          + Add Accounting Staff
        </button>
      </div>

      {/* Accounting Users Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : accountingUsers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No accounting staff found</div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {accountingUsers.map((user) => (
            <div
              key={user.id}
              className={`rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow ${
                !user.is_active ? 'opacity-60' : ''
              }`}
              style={{ background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)' }}
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-white/30 overflow-hidden border-2 border-white/50">
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{user.full_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user.is_active ? 'bg-green-400/30 text-green-100' : 'bg-red-400/30 text-red-100'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4">
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-center gap-2 text-white/90">
                    <span>📧</span>
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-white/90">
                      <span>📱</span>
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(user)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium bg-white/20 hover:bg-white/30 text-white transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(user)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium bg-white/20 hover:bg-white/30 text-white transition-colors"
                  >
                    {user.is_active ? '⏸️ Disable' : '▶️ Enable'}
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="py-2 px-3 rounded-lg text-sm font-medium bg-red-400/30 hover:bg-red-400/50 text-white transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        Total: {accountingUsers.length} accounting staff
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingUser ? 'Edit Accounting Staff' : 'Add New Accounting Staff'}
            </h2>

            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 hover:border-amber-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                      📷
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <div className="text-sm text-gray-500">Click to upload photo</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none"
                  placeholder="accounting@school.com"
                  disabled={!!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none"
                    placeholder="Min 6 characters"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl text-white font-medium disabled:opacity-50"
                style={{ backgroundColor: '#D97706' }}
              >
                {saving ? 'Saving...' : editingUser ? 'Update' : 'Create Staff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
