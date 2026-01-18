import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription'

interface Admin {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  is_active: boolean | null
  created_at: string | null
}

export function AdminsListPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
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

  const loadAdmins = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, avatar_url, is_active, created_at')
      .eq('role', 'admin')
      .order('full_name')

    if (error) {
      console.error('Error loading admins:', error)
      setAdmins([])
    } else {
      setAdmins((data || []).map(item => ({
        ...item,
        full_name: item.full_name || 'Unknown',
        email: item.email || '',
        phone: item.phone || '',
        avatar_url: item.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${item.full_name || 'user'}&backgroundColor=transparent`,
        is_active: item.is_active ?? true
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAdmins()
  }, [loadAdmins])

  useRealtimeSubscription(
    { table: 'profiles', filter: 'role=eq.admin' },
    loadAdmins,
    []
  )

  function openCreateModal() {
    setEditingAdmin(null)
    setFormData({ full_name: '', email: '', phone: '', password: '' })
    setAvatarFile(null)
    setAvatarPreview(null)
    setShowModal(true)
  }

  function openEditModal(admin: Admin) {
    setEditingAdmin(admin)
    setFormData({
      full_name: admin.full_name || '',
      email: admin.email || '',
      phone: admin.phone || '',
      password: ''
    })
    setAvatarFile(null)
    setAvatarPreview(admin.avatar_url)
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

  async function uploadAvatar(adminId: string): Promise<string | null> {
    if (!avatarFile) return null
    try {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${adminId}-${Date.now()}.${fileExt}`
      const filePath = `admin-avatars/${fileName}`

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
    if (!editingAdmin && !formData.password) return

    setSaving(true)

    try {
      if (editingAdmin) {
        let newAvatarUrl = editingAdmin.avatar_url
        if (avatarFile) {
          const uploadedUrl = await uploadAvatar(editingAdmin.id)
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
          .eq('id', editingAdmin.id)

        if (error) throw error
      } else {
        // Create new admin via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
              role: 'admin'
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
            role: 'admin',
            avatar_url: avatarUrl,
            is_active: true
          })
        }
      }

      await loadAdmins()
      setShowModal(false)
    } catch (err: any) {
      alert(err.message || 'Failed to save admin')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this admin?')) return

    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      alert('Failed to delete admin')
      return
    }

    await loadAdmins()
  }

  async function handleToggleStatus(admin: Admin) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !admin.is_active })
      .eq('id', admin.id)

    if (!error) await loadAdmins()
  }

  return (
    <div className="flex-1 p-6" style={{ backgroundColor: '#F8FAF7' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🛡️ Admins</h1>
          <p className="text-gray-500">Manage system administrators</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium"
          style={{ backgroundColor: '#5B8C51' }}
        >
          + Add Admin
        </button>
      </div>

      {/* Admins Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : admins.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No admins found</div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className={`rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow ${
                !admin.is_active ? 'opacity-60' : ''
              }`}
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-white/30 overflow-hidden border-2 border-white/50">
                    <img
                      src={admin.avatar_url || ''}
                      alt={admin.full_name || 'Admin'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{admin.full_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      admin.is_active ? 'bg-green-400/30 text-green-100' : 'bg-red-400/30 text-red-100'
                    }`}>
                      {admin.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4">
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-center gap-2 text-white/90">
                    <span>📧</span>
                    <span className="truncate">{admin.email}</span>
                  </div>
                  {admin.phone && (
                    <div className="flex items-center gap-2 text-white/90">
                      <span>📱</span>
                      <span>{admin.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(admin)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium bg-white/20 hover:bg-white/30 text-white transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(admin)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium bg-white/20 hover:bg-white/30 text-white transition-colors"
                  >
                    {admin.is_active ? '⏸️ Disable' : '▶️ Enable'}
                  </button>
                  <button
                    onClick={() => handleDelete(admin.id)}
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
        Total: {admins.length} admin(s)
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
            </h2>

            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 hover:border-green-500 transition-colors"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none"
                  placeholder="admin@school.com"
                  disabled={!!editingAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {!editingAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none"
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
                style={{ backgroundColor: '#5B8C51' }}
              >
                {saving ? 'Saving...' : editingAdmin ? 'Update' : 'Create Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
