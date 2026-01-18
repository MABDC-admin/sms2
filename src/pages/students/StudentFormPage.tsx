import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

interface GradeLevel {
  id: string
  name: string
}

export function StudentFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([])

  const [formData, setFormData] = useState({
    student_name: '',
    email: '',
    birth_date: '',
    gender: 'male',
    phone_number: '',
    phil_address: '',
    level: '',
    school_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
  })

  useEffect(() => {
    loadGradeLevels()
    if (isEdit && id) loadStudent()
  }, [id])

  async function loadGradeLevels() {
    const { data } = await supabase.from('grade_levels').select('id, name').order('order_index')
    setGradeLevels(data || [])
  }

  async function loadStudent() {
    if (!id) return
    setLoading(true)
    const { data: student } = await supabase
      .from('student_records')
      .select('*')
      .eq('id', id)
      .single()

    if (student) {
      setFormData({
        student_name: student.student_name || '',
        email: student.email || '',
        birth_date: student.birth_date || '',
        gender: student.gender || 'male',
        phone_number: student.phone_number || '',
        phil_address: student.phil_address || '',
        level: student.level || '',
        school_year: student.school_year || ''
      })
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    if (isEdit && id) {
      // Update existing student
      await supabase.from('student_records').update({
        student_name: formData.student_name,
        birth_date: formData.birth_date || null,
        gender: formData.gender,
        phone_number: formData.phone_number,
        phil_address: formData.phil_address,
        level: formData.level,
        email: formData.email
      }).eq('id', id)
    } else {
      // Create new student
      await supabase.from('student_records').insert({
        student_name: formData.student_name,
        email: formData.email,
        birth_date: formData.birth_date || null,
        gender: formData.gender,
        phone_number: formData.phone_number,
        phil_address: formData.phil_address,
        level: formData.level,
        school_year: formData.school_year,
        lrn: `LRN-${Date.now()}`
      })
    }

    setSaving(false)
    navigate('/students')
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/students" className="text-gray-400 hover:text-gray-600">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">
          {isEdit ? 'Edit Student' : 'Add New Student'}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={formData.student_name}
              onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
            <select
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
            >
              <option value="">Select Grade</option>
              {gradeLevels.map(gl => (
                <option key={gl.id} value={gl.name}>{gl.name}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={formData.phil_address}
              onChange={(e) => setFormData({ ...formData, phil_address: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-100">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl text-white font-medium disabled:opacity-50"
            style={{ backgroundColor: '#5B8C51' }}
          >
            {saving ? 'Saving...' : isEdit ? 'Update Student' : 'Create Student'}
          </button>
          <Link
            to="/students"
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
