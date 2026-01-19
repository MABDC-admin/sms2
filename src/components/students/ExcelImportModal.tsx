import { useState, useRef, useCallback, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabaseClient'

interface ImportResult {
  row: number
  status: 'success' | 'error' | 'warning'
  message: string
  action?: 'created' | 'updated'
  studentName?: string
}

interface ParsedStudent {
  row: number
  lrn: string
  firstName: string
  middleName: string
  lastName: string
  fullName: string
  birthDate: string | null
  age: number | null
  gender: string
  motherContact: string
  mothersMaidenName: string
  fatherContact: string
  fatherName: string
  philAddress: string
  uaeAddress: string
  previousSchool: string
  gradeLevel: string
  gradeLevelId?: string
  errors: string[]
  warnings: string[]
}

interface GradeLevel {
  id: string
  name: string
  short_name: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
  schoolYear: string
}

// Template columns for download
const TEMPLATE_COLUMNS = [
  'LEVEL', 'LRN', 'STUDENT NAME', 'BIRTH DATE', 'AGE', 'GENDER',
  'MOTHER CONTACT #', 'MOTHERS MAIDEN NAME', 'FATHER CONTACT #', 'FATHER',
  'PHIL. ADDRESS', 'UAE ADDRESS', 'PREVIOUS SCHOOL'
]

const EXAMPLE_DATA = [
  ['Grade 1', '123456789012', 'DELA CRUZ, JUAN SANTOS', '28-Oct-2015', '', 'MALE', '+971501234567', 'SANTOS, MARIA', '+971509876543', 'DELA CRUZ, PEDRO', 'Brgy. Sample, Manila, Philippines', 'Dubai, UAE', 'Sample Elementary School'],
  ['K', '', 'REYES, ANNA MARIE', '15-Jan-2019', '', 'F', '0501234567', 'GARCIA, ROSE', '', 'REYES, JOSE', 'Quezon City, Philippines', 'Abu Dhabi, UAE', ''],
  ['G11', '234567890123', 'SANTOS, MARK ANTHONY JR', '05-Mar-2008', '', 'M', '+639171234567', 'CRUZ, ELENA', '+639181234567', 'SANTOS, ANTONIO', 'Cebu City, Philippines', 'Sharjah, UAE', 'Previous High School']
]

export function ExcelImportModal({ isOpen, onClose, onImportComplete, schoolYear }: Props) {
  const [, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([])
  const [results, setResults] = useState<ImportResult[]>([])
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([])
  const [step, setStep] = useState<'upload' | 'preview' | 'results'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load grade levels on mount
  const loadGradeLevels = useCallback(async () => {
    const { data } = await supabase
      .from('grade_levels')
      .select('id, name, short_name')
      .order('order_index')
    if (data) setGradeLevels(data)
  }, [])

  // Initialize - load grade levels when modal opens
  useEffect(() => {
    if (isOpen) {
      loadGradeLevels()
    }
  }, [isOpen, loadGradeLevels])

  // Parse date from various formats
  const parseDate = (value: any): string | null => {
    if (!value) return null

    // Excel serial date
    if (typeof value === 'number') {
      const excelEpoch = new Date(1899, 11, 30)
      const date = new Date(excelEpoch.getTime() + value * 86400000)
      return date.toISOString().split('T')[0]
    }

    const str = String(value).trim()
    if (!str) return null

    // Try DD-MMM-YY or DD-MMM-YYYY (e.g., 28-Oct-19 or 28-Oct-2019)
    const dmmyMatch = str.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/)
    if (dmmyMatch) {
      const day = parseInt(dmmyMatch[1])
      const monthStr = dmmyMatch[2]
      let year = parseInt(dmmyMatch[3])
      
      // 2-digit year logic
      if (year < 100) {
        year = year <= 50 ? 2000 + year : 1900 + year
      }
      
      const months: { [key: string]: number } = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
      }
      const month = months[monthStr.toLowerCase()]
      if (month !== undefined) {
        const date = new Date(year, month, day)
        return date.toISOString().split('T')[0]
      }
    }

    // Try MM/DD/YYYY
    const mdyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (mdyMatch) {
      const month = parseInt(mdyMatch[1]) - 1
      const day = parseInt(mdyMatch[2])
      const year = parseInt(mdyMatch[3])
      const date = new Date(year, month, day)
      return date.toISOString().split('T')[0]
    }

    // Try YYYY-MM-DD (ISO format)
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str
    }

    return null
  }

  // Parse student name (LASTNAME, FIRSTNAME MIDDLENAME)
  const parseName = (name: string): { firstName: string, middleName: string, lastName: string } => {
    if (!name) return { firstName: '', middleName: '', lastName: '' }
    
    const trimmed = name.trim().toUpperCase()
    
    // Check for comma separator
    if (trimmed.includes(',')) {
      const [lastPart, firstMiddle] = trimmed.split(',').map(s => s.trim())
      const parts = (firstMiddle || '').split(/\s+/).filter(Boolean)
      const firstName = parts[0] || ''
      const middleName = parts.slice(1).join(' ')
      return { firstName, middleName, lastName: lastPart }
    }
    
    // No comma - assume FIRSTNAME MIDDLENAME LASTNAME
    const parts = trimmed.split(/\s+/).filter(Boolean)
    if (parts.length === 1) {
      return { firstName: parts[0], middleName: '', lastName: '' }
    } else if (parts.length === 2) {
      return { firstName: parts[0], middleName: '', lastName: parts[1] }
    } else {
      return { firstName: parts[0], middleName: parts.slice(1, -1).join(' '), lastName: parts[parts.length - 1] }
    }
  }

  // Calculate age based on cutoff date
  const calculateAge = (birthDate: string | null, gradeLevel: string): number | null => {
    if (!birthDate) return null
    
    const birth = new Date(birthDate)
    // Kindergarten: October 31, 2025; Others: January 1, 2025
    const isKinder = gradeLevel.toLowerCase().includes('kinder') || gradeLevel.toLowerCase() === 'k'
    const cutoffDate = isKinder ? new Date(2025, 9, 31) : new Date(2025, 0, 1)
    
    let age = cutoffDate.getFullYear() - birth.getFullYear()
    const monthDiff = cutoffDate.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && cutoffDate.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  // Match grade level to database
  const matchGradeLevel = (level: string): GradeLevel | null => {
    if (!level) return null
    const normalized = level.trim().toUpperCase()
    
    // Grade level mapping
    const mappings: { [key: string]: string[] } = {
      'Kinder 1': ['K', 'K1', 'KINDER 1', 'KINDERGARTEN 1', 'KINDER1'],
      'Kinder 2': ['K2', 'KINDER 2', 'KINDERGARTEN 2', 'KINDER2'],
      'Grade 1': ['G1', 'GRADE 1', 'GRADE1', '1'],
      'Grade 2': ['G2', 'GRADE 2', 'GRADE2', '2'],
      'Grade 3': ['G3', 'GRADE 3', 'GRADE3', '3'],
      'Grade 4': ['G4', 'GRADE 4', 'GRADE4', '4'],
      'Grade 5': ['G5', 'GRADE 5', 'GRADE5', '5'],
      'Grade 6': ['G6', 'GRADE 6', 'GRADE6', '6'],
      'Grade 7': ['G7', 'GRADE 7', 'GRADE7', '7'],
      'Grade 8': ['G8', 'GRADE 8', 'GRADE8', '8'],
      'Grade 9': ['G9', 'GRADE 9', 'GRADE9', '9'],
      'Grade 10': ['G10', 'GRADE 10', 'GRADE10', '10'],
      'Grade 11': ['G11', 'GRADE 11', 'GRADE11', '11'],
      'Grade 12': ['G12', 'GRADE 12', 'GRADE12', '12']
    }
    
    for (const [gradeName, aliases] of Object.entries(mappings)) {
      if (aliases.includes(normalized) || normalized === gradeName.toUpperCase()) {
        return gradeLevels.find(g => g.name === gradeName) || null
      }
    }
    
    return null
  }

  // Validate phone number
  const validatePhone = (phone: string): boolean => {
    if (!phone) return true // Optional
    const digits = phone.replace(/\D/g, '')
    return digits.length >= 9 && digits.length <= 15
  }

  // Validate LRN
  const validateLRN = (lrn: string): boolean => {
    if (!lrn) return true // Optional - will generate temp
    const digits = lrn.replace(/\D/g, '')
    return digits.length === 12
  }

  // Parse Excel file
  const parseExcel = async (file: File) => {
    setParsing(true)
    console.log('Parsing Excel file:', file.name)
    
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array', cellDates: true })
      console.log('Workbook sheets:', workbook.SheetNames)
      
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]
      console.log('Total rows found:', rows.length)
    
    // Find header row (contains 'STUDENT NAME' or 'LRN')
    let headerRowIndex = 0
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = rows[i]?.map(c => String(c || '').toUpperCase()) || []
      if (row.includes('STUDENT NAME') || row.includes('LRN') || row.includes('LEVEL')) {
        headerRowIndex = i
        break
      }
    }
    
    const headers = (rows[headerRowIndex] || []).map(h => String(h || '').toUpperCase().trim())
    
    // Column indices
    const cols = {
      level: headers.findIndex(h => h === 'LEVEL' || h === 'GRADE'),
      lrn: headers.findIndex(h => h === 'LRN'),
      name: headers.findIndex(h => h.includes('STUDENT NAME') || h === 'NAME'),
      birthDate: headers.findIndex(h => h.includes('BIRTH') || h === 'DOB'),
      age: headers.findIndex(h => h === 'AGE'),
      gender: headers.findIndex(h => h === 'GENDER' || h === 'SEX'),
      motherContact: headers.findIndex(h => h.includes('MOTHER') && h.includes('CONTACT')),
      mothersMaidenName: headers.findIndex(h => h.includes('MOTHER') && h.includes('MAIDEN')),
      fatherContact: headers.findIndex(h => h.includes('FATHER') && h.includes('CONTACT')),
      fatherName: headers.findIndex(h => h === 'FATHER' || (h.includes('FATHER') && !h.includes('CONTACT'))),
      philAddress: headers.findIndex(h => h.includes('PHIL') && h.includes('ADDRESS')),
      uaeAddress: headers.findIndex(h => h.includes('UAE') && h.includes('ADDRESS')),
      previousSchool: headers.findIndex(h => h.includes('PREVIOUS') || h.includes('SCHOOL'))
    }
    
    const parsed: ParsedStudent[] = []
    
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.every(c => !c)) continue // Skip empty rows
      
      const getValue = (idx: number): string => {
        if (idx < 0) return ''
        return String(row[idx] || '').trim()
      }
      
      const rawName = getValue(cols.name)
      if (!rawName) continue // Skip rows without student name
      
      const { firstName, middleName, lastName } = parseName(rawName)
      const rawLevel = getValue(cols.level)
      const gradeMatch = matchGradeLevel(rawLevel)
      const rawBirthDate = row[cols.birthDate]
      const parsedBirthDate = parseDate(rawBirthDate)
      const rawGender = getValue(cols.gender).toUpperCase()
      const gender = rawGender === 'M' ? 'MALE' : rawGender === 'F' ? 'FEMALE' : rawGender
      const rawLRN = getValue(cols.lrn).replace(/\D/g, '')
      
      const errors: string[] = []
      const warnings: string[] = []
      
      // Validate required fields
      if (!rawName) errors.push('Student name is required')
      if (!rawLevel) errors.push('Grade level is required')
      if (!gradeMatch && rawLevel) errors.push(`Grade level "${rawLevel}" not found`)
      if (rawLRN && !validateLRN(rawLRN)) errors.push('LRN must be 12 digits')
      if (gender && !['MALE', 'FEMALE'].includes(gender)) errors.push('Gender must be MALE or FEMALE')
      
      const motherContact = getValue(cols.motherContact)
      const fatherContact = getValue(cols.fatherContact)
      if (motherContact && !validatePhone(motherContact)) warnings.push('Invalid mother contact format')
      if (fatherContact && !validatePhone(fatherContact)) warnings.push('Invalid father contact format')
      
      // Calculate age if not provided
      let age: number | null = null
      const rawAge = getValue(cols.age)
      if (rawAge) {
        age = parseInt(rawAge)
        if (isNaN(age)) age = null
      }
      if (!age && parsedBirthDate) {
        age = calculateAge(parsedBirthDate, rawLevel)
        if (age) warnings.push(`Age auto-calculated: ${age}`)
      }
      
      if (!rawLRN) {
        warnings.push('LRN will be auto-generated (TEMP-XXX)')
      }
      
      parsed.push({
        row: i + 1,
        lrn: rawLRN || `TEMP-${Date.now()}-${i}`,
        firstName,
        middleName,
        lastName,
        fullName: `${lastName}, ${firstName}${middleName ? ' ' + middleName : ''}`,
        birthDate: parsedBirthDate,
        age,
        gender,
        motherContact,
        mothersMaidenName: getValue(cols.mothersMaidenName),
        fatherContact,
        fatherName: getValue(cols.fatherName),
        philAddress: getValue(cols.philAddress),
        uaeAddress: getValue(cols.uaeAddress),
        previousSchool: getValue(cols.previousSchool),
        gradeLevel: gradeMatch?.name || rawLevel,
        gradeLevelId: gradeMatch?.id,
        errors,
        warnings
      })
    }
    
    console.log('Parsed students:', parsed.length)
    setParsedData(parsed)
    setParsing(false)
    setStep('preview')
    } catch (error) {
      console.error('Error parsing Excel:', error)
      alert('Error parsing Excel file. Please check the format.')
      setParsing(false)
    }
  }

  // Download template
  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_COLUMNS, ...EXAMPLE_DATA])
    
    // Set column widths
    ws['!cols'] = TEMPLATE_COLUMNS.map(() => ({ wch: 20 }))
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students')
    XLSX.writeFile(wb, 'Student_Import_Template.xlsx')
  }

  // Import students to database
  const importStudents = async () => {
    setImporting(true)
    const importResults: ImportResult[] = []
    
    // Ensure school year exists
    let { data: yearData } = await supabase
      .from('academic_years')
      .select('id')
      .eq('name', schoolYear)
      .single()
    
    if (!yearData) {
      // Create the school year
      const { data: newYear, error: yearError } = await supabase
        .from('academic_years')
        .insert({
          name: schoolYear,
          start_date: `${schoolYear.split('-')[0]}-06-01`,
          end_date: `${schoolYear.split('-')[1]}-03-31`,
          is_active: true
        })
        .select()
        .single()
      
      if (yearError) {
        importResults.push({ row: 0, status: 'error', message: `Failed to create school year: ${yearError.message}` })
        setResults(importResults)
        setStep('results')
        setImporting(false)
        return
      }
      yearData = newYear
    }
    
    for (const student of parsedData) {
      if (student.errors.length > 0) {
        importResults.push({
          row: student.row,
          status: 'error',
          message: student.errors.join('; '),
          studentName: student.fullName
        })
        continue
      }
      
      try {
        // Check if student exists by LRN
        const { data: existing } = await supabase
          .from('student_records')
          .select('id, lrn')
          .eq('lrn', student.lrn)
          .maybeSingle()
        
        const studentData = {
          lrn: student.lrn,
          student_name: student.fullName,
          first_name: student.firstName,
          middle_name: student.middleName,
          last_name: student.lastName,
          birth_date: student.birthDate,
          age: student.age,
          gender: student.gender,
          mother_contact: student.motherContact,
          mother_maiden_name: student.mothersMaidenName,
          father_contact: student.fatherContact,
          father_name: student.fatherName,
          phil_address: student.philAddress,
          uae_address: student.uaeAddress,
          previous_school: student.previousSchool,
          level: student.gradeLevel,
          grade_level_id: student.gradeLevelId,
          school_year: schoolYear,
          status: 'active' as const
        }
        
        if (existing) {
          // Update existing student
          const { error } = await supabase
            .from('student_records')
            .update(studentData)
            .eq('id', existing.id)
          
          if (error) throw error
          
          importResults.push({
            row: student.row,
            status: student.warnings.length > 0 ? 'warning' : 'success',
            message: student.warnings.length > 0 ? `Updated. ${student.warnings.join('; ')}` : 'Updated successfully',
            action: 'updated',
            studentName: student.fullName
          })
        } else {
          // Create new student
          const { error } = await supabase
            .from('student_records')
            .insert(studentData)
          
          if (error) throw error
          
          importResults.push({
            row: student.row,
            status: student.warnings.length > 0 ? 'warning' : 'success',
            message: student.warnings.length > 0 ? `Created. ${student.warnings.join('; ')}` : 'Created successfully',
            action: 'created',
            studentName: student.fullName
          })
        }
      } catch (err: any) {
        importResults.push({
          row: student.row,
          status: 'error',
          message: err.message || 'Unknown error',
          studentName: student.fullName
        })
      }
    }
    
    setResults(importResults)
    setStep('results')
    setImporting(false)
  }

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile)
      parseExcel(droppedFile)
    } else {
      alert('Please upload an Excel file (.xlsx or .xls)')
    }
  }, [gradeLevels])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      parseExcel(selected)
    }
  }

  const resetModal = () => {
    setFile(null)
    setParsedData([])
    setResults([])
    setStep('upload')
  }

  const handleClose = () => {
    resetModal()
    onClose()
    if (results.some(r => r.status === 'success' || r.action)) {
      onImportComplete()
    }
  }

  if (!isOpen) return null

  // Stats
  const totalRows = parsedData.length
  const validRows = parsedData.filter(p => p.errors.length === 0).length
  const errorRows = parsedData.filter(p => p.errors.length > 0).length
  const warningRows = parsedData.filter(p => p.warnings.length > 0 && p.errors.length === 0).length

  const successCount = results.filter(r => r.status === 'success').length
  const createdCount = results.filter(r => r.action === 'created').length
  const updatedCount = results.filter(r => r.action === 'updated').length
  const failedCount = results.filter(r => r.status === 'error').length
  const warningCount = results.filter(r => r.status === 'warning').length

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Excel Import</h2>
              <p className="text-sm text-gray-500">Import students from Excel file</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Download Template */}
              <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-800">📥 Download Template</h3>
                  <p className="text-sm text-blue-600">Use our template to ensure correct format</p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download Template
                </button>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                  isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="text-5xl mb-4">📁</div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {parsing ? 'Parsing file...' : 'Drag & drop Excel file here'}
                </p>
                <p className="text-sm text-gray-500">or click to browse</p>
                <p className="text-xs text-gray-400 mt-2">Supports .xlsx and .xls files up to 10MB</p>
              </div>

              {/* Format Guidelines */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-medium text-gray-800 mb-3">📋 Required Columns</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span><strong>LEVEL</strong> - K, G1, Grade 1, etc.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span><strong>STUDENT NAME</strong> - LASTNAME, FIRSTNAME</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500">○</span>
                    <span><strong>LRN</strong> - 12 digits (optional)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500">○</span>
                    <span><strong>BIRTH DATE</strong> - 28-Oct-19 or MM/DD/YYYY</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-800">{totalRows}</div>
                  <div className="text-sm text-gray-500">Total Rows</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{validRows}</div>
                  <div className="text-sm text-green-600">Valid</div>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{warningRows}</div>
                  <div className="text-sm text-yellow-600">Warnings</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{errorRows}</div>
                  <div className="text-sm text-red-600">Errors</div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border rounded-xl overflow-hidden">
                <div className="max-h-80 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Row</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">LRN</th>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Grade</th>
                        <th className="px-3 py-2 text-left">Age</th>
                        <th className="px-3 py-2 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.map((student) => (
                        <tr key={student.row} className={student.errors.length > 0 ? 'bg-red-50' : student.warnings.length > 0 ? 'bg-yellow-50' : ''}>
                          <td className="px-3 py-2">{student.row}</td>
                          <td className="px-3 py-2">
                            {student.errors.length > 0 ? '❌' : student.warnings.length > 0 ? '⚠️' : '✅'}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">{student.lrn.substring(0, 12)}{student.lrn.length > 12 ? '...' : ''}</td>
                          <td className="px-3 py-2">{student.fullName}</td>
                          <td className="px-3 py-2">{student.gradeLevel}</td>
                          <td className="px-3 py-2">{student.age || '-'}</td>
                          <td className="px-3 py-2 text-xs">
                            {student.errors.length > 0 && (
                              <span className="text-red-600">{student.errors.join('; ')}</span>
                            )}
                            {student.warnings.length > 0 && student.errors.length === 0 && (
                              <span className="text-yellow-600">{student.warnings.join('; ')}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {errorRows > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  ⚠️ {errorRows} row(s) have errors and will be skipped during import.
                </div>
              )}
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-4">
              {/* Results Stats */}
              <div className="grid grid-cols-5 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-800">{results.length}</div>
                  <div className="text-sm text-gray-500">Processed</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{successCount + warningCount}</div>
                  <div className="text-sm text-green-600">Success</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{createdCount}</div>
                  <div className="text-sm text-blue-600">Created</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{updatedCount}</div>
                  <div className="text-sm text-purple-600">Updated</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                  <div className="text-sm text-red-600">Failed</div>
                </div>
              </div>

              {/* Results Table */}
              <div className="border rounded-xl overflow-hidden">
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Row</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Student</th>
                        <th className="px-3 py-2 text-left">Action</th>
                        <th className="px-3 py-2 text-left">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, idx) => (
                        <tr key={idx} className={result.status === 'error' ? 'bg-red-50' : result.status === 'warning' ? 'bg-yellow-50' : 'bg-green-50'}>
                          <td className="px-3 py-2">{result.row}</td>
                          <td className="px-3 py-2">
                            {result.status === 'error' ? '❌' : result.status === 'warning' ? '⚠️' : '✅'}
                          </td>
                          <td className="px-3 py-2">{result.studentName || '-'}</td>
                          <td className="px-3 py-2 capitalize">{result.action || '-'}</td>
                          <td className="px-3 py-2 text-xs">{result.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {warningRows > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                  ⚠️ Note: All imported students need section assignment before enrollment is complete.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            {step === 'upload' && 'Select an Excel file to import'}
            {step === 'preview' && `${validRows} students ready to import`}
            {step === 'results' && `Import complete: ${successCount + warningCount} successful`}
          </div>
          <div className="flex gap-3">
            {step !== 'upload' && step !== 'results' && (
              <button onClick={resetModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                ← Back
              </button>
            )}
            {step === 'preview' && (
              <button
                onClick={importStudents}
                disabled={importing || validRows === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {importing ? '⏳ Importing...' : `📥 Import ${validRows} Students`}
              </button>
            )}
            {step === 'results' && (
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                ✓ Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
