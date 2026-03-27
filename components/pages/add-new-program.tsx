"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { ArrowLeft, Plus, X, Save, Eye, Upload, Image as ImageIcon, ChevronDownIcon, CheckIcon } from "lucide-react"
import dynamic from "next/dynamic"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

// Dynamically import RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(
  () => import("@/components/ui/rich-text-editor").then((mod) => ({ default: mod.RichTextEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="border border-border rounded-lg overflow-hidden theme-card">
        <div className="p-4 bg-muted/30 border-b border-border h-12" />
        <div className="bg-input min-h-[200px] flex items-center justify-center">
          <div className="theme-muted">Loading editor...</div>
        </div>
      </div>
    ),
  }
)

interface CourseOutlineItem {
  id: string
  day: string
  title: string
  content: string
}

interface Certificate {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  status: string
}

interface FAQ {
  id: string
  question: string
  answer: string
}

// Category to Reference Code mapping
const categoryToRefCode: Record<string, string> = {
  "Administration & Secretarial": "AD",
  "Artificial Intelligence (AI)": "AI",
  "Construction Management": "CN",
  "Contracts Management": "CM",
  "Customer Service": "CS",
  "Electrical Engineering": "EE",
  "Banking, Finance & Accounting": "FI",
  "Quality, Health & Safety": "HS",
  "Human Resources": "HR",
  "Information Technology": "IT",
  "Maintenance Management": "MN",
  "Management & Leadership": "ML",
  "Mechanical Engineering": "ME",
  "Oil & Gas": "OG",
  "Project Management": "PM",
  "Public Relations": "PR",
  "Purchasing Management": "MM",
  "Urban Planning & Development": "UP",
  "Police and Law Enforcement": "PL",
  "Ships & Port Management": "SP",
  "Law & Legal Training Programs": "LL",
  "Mining Engineering": "MN",
}

export default function AddNewProgram({ onBack, editId }: { onBack?: () => void; editId?: string | null }) {
  const isEditMode = !!editId
  const [formData, setFormData] = useState({
    refCode: "",
    programName: "",
    shortDescription: "",
    category: "",
    type: [] as string[],
    status: "Draft",
    duration: "",
    targetAudience: "",
    learningObjectives: "",
    trainingMethodology: "",
    introduction: "",
    description: "",
    organisationalImpact: "",
    personalImpact: "",
    whoShouldAttend: "",
  })

  const [courseOutline, setCourseOutline] = useState<CourseOutlineItem[]>([
    {
      id: "1",
      day: "Module 1",
      title: "",
      content: "",
    },
  ])

  const [selectedCertificateIds, setSelectedCertificateIds] = useState<string[]>([])
  const [availableCertificates, setAvailableCertificates] = useState<Certificate[]>([])
  const [certificateSearchOpen, setCertificateSearchOpen] = useState(false)
  const [certificateSearch, setCertificateSearch] = useState("")
  const [loadingCertificates, setLoadingCertificates] = useState(true)

  // Fetch available certificates
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoadingCertificates(true)
        const response = await fetch('/api/admin/certificates?limit=1000&status=Active')
        const result = await response.json()
        
        if (result.success) {
          setAvailableCertificates(result.data.map((c: any) => ({
            id: String(c.id),
            name: c.name,
            description: c.description,
            imageUrl: c.imageUrl,
            status: c.status,
          })))
        }
      } catch (err) {
        console.error('Error fetching certificates:', err)
        setAvailableCertificates([])
      } finally {
        setLoadingCertificates(false)
      }
    }
    
    fetchCertificates()
  }, [])

  const [faqs, setFAQs] = useState<FAQ[]>([{ id: "1", question: "", answer: "" }])
  
  const [mainCourseImage, setMainCourseImage] = useState<File | null>(null)
  const [mainCourseImagePreview, setMainCourseImagePreview] = useState<string | null>(null)
  const [cardImage, setCardImage] = useState<File | null>(null)
  const [cardImagePreview, setCardImagePreview] = useState<string | null>(null)
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [refCodeError, setRefCodeError] = useState<string | null>(null)
  const [isCheckingRefCode, setIsCheckingRefCode] = useState(false)

  // Load program data if editing
  useEffect(() => {
    if (editId) {
      const loadProgram = async () => {
        try {
          setLoadingData(true)
          const response = await fetch(`/api/admin/programs/${editId}`)
          const result = await response.json()
          
          if (result.success && result.data) {
            const program = result.data
            
            setFormData({
              refCode: program.refCode || "",
              programName: program.programName || "",
              shortDescription: program.shortDescription || "",
              category: program.category || "",
              type: program.type || [],
              status: program.status || "Draft",
              duration: program.duration || "",
              targetAudience: program.targetAudience || "",
              learningObjectives: program.learningObjectives || "",
              trainingMethodology: program.trainingMethodology || "",
              introduction: program.introduction || "",
              description: program.description || "",
              organisationalImpact: program.organisationalImpact || "",
              personalImpact: program.personalImpact || "",
              whoShouldAttend: program.whoShouldAttend || "",
            })
            
            if (program.mainCourseImageUrl) {
              setMainCourseImagePreview(program.mainCourseImageUrl)
            }
            if (program.cardImageUrl) {
              setCardImagePreview(program.cardImageUrl)
            }
            
            // Load course outline
            if (program.courseOutline && program.courseOutline.length > 0) {
              setCourseOutline(program.courseOutline.map((item: any, index: number) => ({
                id: String(index + 1),
                day: item.day || `Day ${index + 1}`,
                title: item.title || "",
                content: item.content || "",
              })))
            }
            
            // Load certificate IDs
            if (program.certificateIds && program.certificateIds.length > 0) {
              setSelectedCertificateIds(program.certificateIds.map((id: any) => String(id)))
            }
            
            // Load FAQs
            if (program.faqs && program.faqs.length > 0) {
              setFAQs(program.faqs.map((faq: any, index: number) => ({
                id: String(index + 1),
                question: faq.question || "",
                answer: faq.answer || "",
              })))
            }
          } else {
            console.error('Failed to load program:', result.error)
            alert('Failed to load program data. Please try again.')
          }
        } catch (err) {
          console.error('Error loading program:', err)
          alert('Error loading program data. Please try again.')
        } finally {
          setLoadingData(false)
        }
      }
      loadProgram()
    }
  }, [editId])

  // Function to check if reference code already exists
  const checkReferenceCodeExists = useCallback(async (refCode: string): Promise<boolean> => {
    if (!refCode || !refCode.trim()) {
      return false
    }

    // In edit mode, skip check if it's the same code
    if (isEditMode && editId) {
      return false
    }

    try {
      setIsCheckingRefCode(true)
      const response = await fetch('/api/admin/programs')
      const result = await response.json()
      
      if (result.success) {
        const exists = result.data.some((program: any) => 
          program.refCode && program.refCode.trim().toUpperCase() === refCode.trim().toUpperCase() &&
          (!isEditMode || program.id !== editId)
        )
        return exists
      }
      return false
    } catch (error) {
      console.error('Error checking reference code:', error)
      return false
    } finally {
      setIsCheckingRefCode(false)
    }
  }, [isEditMode, editId])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Clear error when refCode changes
    if (field === "refCode") {
      setRefCodeError(null)
    }
  }

  // Store original refCode when editing
  const [originalRefCode, setOriginalRefCode] = useState<string>("")

  // Load original refCode when editing
  useEffect(() => {
    if (isEditMode && editId && formData.refCode) {
      setOriginalRefCode(formData.refCode)
    }
  }, [isEditMode, editId])

  // Debounced validation for reference code
  useEffect(() => {
    const trimmedRefCode = formData.refCode.trim()
    
    if (!trimmedRefCode) {
      setRefCodeError(null)
      return
    }

    // Skip validation in edit mode if code hasn't changed from original
    if (isEditMode && trimmedRefCode.toUpperCase() === originalRefCode.toUpperCase()) {
      setRefCodeError(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      const exists = await checkReferenceCodeExists(trimmedRefCode)
      if (exists) {
        setRefCodeError("This reference code already exists. Please use a different code.")
      } else {
        setRefCodeError(null)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [formData.refCode, isEditMode, originalRefCode, checkReferenceCodeExists])

  const handleTypeChange = (typeValue: string) => {
    setFormData((prev) => {
      const currentTypes = prev.type || []
      if (currentTypes.includes(typeValue)) {
        // Remove if already selected
        return { ...prev, type: currentTypes.filter((t) => t !== typeValue) }
      } else {
        // Add if not selected
        return { ...prev, type: [...currentTypes, typeValue] }
      }
    })
  }

  const courseTypes = [
    { value: "Public Program", label: "Public Course" },
    { value: "Signature Program", label: "Signature Course" },
  ]

  const handleImageUpload = (type: "main" | "card", file: File | null) => {
    if (!file) return

    if (type === "main") {
      setMainCourseImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setMainCourseImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setCardImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCardImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageRemove = (type: "main" | "card") => {
    if (type === "main") {
      setMainCourseImage(null)
      setMainCourseImagePreview(null)
    } else {
      setCardImage(null)
      setCardImagePreview(null)
    }
  }


  const addCourseOutlineItem = () => {
    const newItem: CourseOutlineItem = {
      id: Date.now().toString(),
      day: `Day ${courseOutline.length + 1}`,
      title: "",
      content: "",
    }
    setCourseOutline([...courseOutline, newItem])
  }

  const removeCourseOutlineItem = (id: string) => {
    setCourseOutline(courseOutline.filter((item) => item.id !== id))
  }

  const updateCourseOutlineItem = (id: string, field: string, value: string) => {
    setCourseOutline(
      courseOutline.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const toggleCertificateSelection = (certificateId: string) => {
    setSelectedCertificateIds((prev) => {
      if (prev.includes(certificateId)) {
        return prev.filter((id) => id !== certificateId)
      } else {
        return [...prev, certificateId]
      }
    })
  }

  const removeCertificate = (certificateId: string) => {
    setSelectedCertificateIds((prev) => prev.filter((id) => id !== certificateId))
  }

  // Filter certificates based on search
  const filteredCertificates = useMemo(() => {
    if (!certificateSearch) return availableCertificates
    
    const searchLower = certificateSearch.toLowerCase()
    return availableCertificates.filter((cert) =>
      cert.name.toLowerCase().includes(searchLower) ||
      (cert.description && cert.description.toLowerCase().includes(searchLower))
    )
  }, [availableCertificates, certificateSearch])

  // Get selected certificates for display
  const selectedCertificates = useMemo(() => {
    return availableCertificates.filter((cert) => selectedCertificateIds.includes(cert.id))
  }, [availableCertificates, selectedCertificateIds])

  const addFAQ = () => {
    setFAQs([...faqs, { id: Date.now().toString(), question: "", answer: "" }])
  }

  const removeFAQ = (id: string) => {
    setFAQs(faqs.filter((faq) => faq.id !== id))
  }

  const updateFAQ = (id: string, field: string, value: string) => {
    setFAQs(faqs.map((faq) => (faq.id === id ? { ...faq, [field]: value } : faq)))
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that at least one course type is selected
    if (formData.type.length === 0) {
      alert("Please select at least one course type")
      return
    }
    
    // Validate reference code is provided
    if (!formData.refCode || !formData.refCode.trim()) {
      setRefCodeError("Reference code is required")
      alert("Please enter a reference code")
      return
    }
    
    // Check if reference code already exists
    const codeExists = await checkReferenceCodeExists(formData.refCode.trim())
    if (codeExists) {
      setRefCodeError("This reference code already exists. Please use a different code.")
      alert("This reference code already exists. Please use a different code.")
      return
    }
    
    setIsSubmitting(true)
    setSubmitError(null)
    setRefCodeError(null)

    try {
      // TODO: Handle image uploads separately (upload to cloud storage first)
      // For now, we'll use imagePreview URLs as placeholders
      const mainCourseImageUrl = mainCourseImagePreview
      const cardImageUrl = cardImagePreview

      const payload = {
        id: editId,
        ...formData,
        courseOutline: courseOutline.map(item => ({
          day: item.day,
          title: item.title,
          content: item.content,
        })),
        certificateIds: selectedCertificateIds,
        faqs: faqs.map(faq => ({
          question: faq.question,
          answer: faq.answer,
        })),
        mainCourseImageUrl,
        cardImageUrl,
      }

      const response = await fetch('/api/admin/programs', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isEditMode ? 'update' : 'create'} program`)
      }

      alert(`Program ${isEditMode ? 'updated' : 'created'} successfully!`)
      if (onBack) onBack()
    } catch (error) {
      console.error('Error creating program:', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to create program. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 space-y-6 theme-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-muted rounded-lg transition-colors theme-primary"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-4xl font-bold theme-text mb-2">{isEditMode ? 'Edit Course' : 'Add New Course'}</h1>
            <p className="theme-muted">{isEditMode ? 'Update course details and information' : 'Create a new training course with comprehensive details'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-2 theme-card border border-border rounded-lg font-semibold theme-text hover:bg-muted transition-all flex items-center gap-2">
            <Eye size={18} />
            Preview
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg font-semibold hover:shadow-lg glow-electric transition-all flex items-center gap-2 disabled:opacity-50"
            disabled={isSubmitting}
          >
            <Save size={18} />
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Course' : 'Save Course'}
          </button>
        </div>
      </div>

      {loadingData && isEditMode && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="theme-muted">Loading course data...</p>
          </div>
        </div>
      )}

      {!loadingData && (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="theme-card rounded-xl p-6 space-y-6">
          <h2 className="text-2xl font-bold theme-text border-b border-border pb-3">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold theme-text mb-2">
                Reference Code <span className="text-destructive">*</span>
                {isCheckingRefCode && (
                  <span className="ml-2 text-xs theme-muted">(Checking...)</span>
                )}
              </label>
              <input
                type="text"
                value={formData.refCode}
                onChange={(e) => handleInputChange("refCode", e.target.value)}
                className={`w-full px-4 py-2 bg-input border rounded-lg theme-text placeholder-muted-foreground focus:outline-none focus:ring-1 transition-all ${
                  refCodeError 
                    ? 'border-destructive focus:border-destructive focus:ring-destructive' 
                    : 'border-border focus:border-primary focus:ring-primary'
                }`}
                placeholder="Enter reference code (e.g., PM001, HR023)"
                required
              />
              {refCodeError && (
                <p className="mt-1 text-xs text-destructive">{refCodeError}</p>
              )}
              {!refCodeError && formData.refCode && !isCheckingRefCode && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-400">Reference code is available</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold theme-text mb-2">
                Category <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg theme-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                required
              >
                <option value="">Choose Category</option>
                <option value="Administration & Secretarial">Administration & Secretarial</option>
                <option value="Artificial Intelligence (AI)">Artificial Intelligence (AI)</option>
                <option value="Banking, Finance & Accounting">Banking, Finance & Accounting</option>
                <option value="Construction Management">Construction Management</option>
                <option value="Contracts Management">Contracts Management</option>
                <option value="Customer Service">Customer Service</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Quality, Health & Safety">Quality, Health & Safety</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Law & Legal Training Programs">Law & Legal Training Programs</option>
                <option value="Maintenance Management">Maintenance Management</option>
                <option value="Management & Leadership">Management & Leadership</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Mining Engineering">Mining Engineering</option>
                <option value="Oil & Gas">Oil & Gas</option>
                <option value="Police and Law Enforcement">Police and Law Enforcement</option>
                <option value="Project Management">Project Management</option>
                <option value="Public Relations">Public Relations</option>
                <option value="Purchasing Management">Purchasing Management</option>
                <option value="Ships & Port Management">Ships & Port Management</option>
                <option value="Urban Planning & Development">Urban Planning & Development</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold theme-text mb-2">
                Course Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.programName}
                onChange={(e) => handleInputChange("programName", e.target.value)}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg theme-text placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="Enter course name"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold theme-text mb-2">
                Short Description
              </label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                rows={3}
                maxLength={200}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg theme-text placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                placeholder="Enter a brief 2-3 line description of the course (max 200 characters)..."
              />
              <p className="text-xs theme-muted mt-1">
                {formData.shortDescription.length}/200 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold theme-text mb-2">
                Course Type <span className="text-destructive">*</span>
              </label>
              <Popover open={typeDropdownOpen} onOpenChange={setTypeDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={typeDropdownOpen}
                    className="w-full justify-between bg-input hover:bg-input/80 border-border text-foreground hover:text-foreground h-11"
                  >
                    <span className="truncate text-left">
                      {formData.type.length === 0
                        ? "Select course types..."
                        : formData.type.length === 1
                        ? courseTypes.find((t) => t.value === formData.type[0])?.label || "Selected"
                        : `${formData.type.length} types selected`}
                    </span>
                    <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border-border" align="start">
                  <div className="p-2">
                    <div className="space-y-2">
                      {courseTypes.map((courseType) => (
                        <label
                          key={courseType.value}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                        >
                          <Checkbox
                            checked={formData.type.includes(courseType.value)}
                            onCheckedChange={() => handleTypeChange(courseType.value)}
                            className="border-2 border-gray-400 dark:border-gray-500 bg-background data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span className="text-foreground font-medium text-sm">{courseType.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {formData.type.length === 0 && (
                <p className="text-xs text-destructive mt-1">Please select at least one course type</p>
              )}
              {formData.type.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.type.map((selectedType) => {
                    const typeLabel = courseTypes.find((t) => t.value === selectedType)?.label
                    return (
                      <span
                        key={selectedType}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium"
                      >
                        {typeLabel}
                        <button
                          type="button"
                          onClick={() => handleTypeChange(selectedType)}
                          className="hover:text-primary/80"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold theme-text mb-2">
                Duration <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => handleInputChange("duration", e.target.value)}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg theme-text placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="e.g., 5 days"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold theme-text mb-2">
                Status <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="w-full px-4 py-2 bg-input border border-border rounded-lg theme-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                required
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </div>

          </div>
        </div>

        {/* Introduction - Rich Text Editor */}
        <div className="theme-card rounded-xl p-6 space-y-4">
          <h2 className="text-2xl font-bold theme-text border-b border-border pb-3">
            Introduction <span className="text-destructive">*</span>
          </h2>
          <RichTextEditor
            value={formData.introduction}
            onChange={(value) => handleInputChange("introduction", value)}
            placeholder="Write a comprehensive introduction to the course..."
          />
        </div>

        {/* Learning Objectives */}
        <div className="theme-card rounded-xl p-6 space-y-4">
          <h2 className="text-2xl font-bold theme-text border-b border-border pb-3">
            Learning Objectives <span className="text-destructive">*</span>
          </h2>
          <RichTextEditor
            value={formData.learningObjectives}
            onChange={(value) => handleInputChange("learningObjectives", value)}
            placeholder="Enter learning objectives for the course..."
          />
        </div>

        {/* Training Methodology */}
        <div className="theme-card rounded-xl p-6 space-y-4">
          <h2 className="text-2xl font-bold theme-text border-b border-border pb-3">
            Training Methodology <span className="text-destructive">*</span>
          </h2>
          <RichTextEditor
            value={formData.trainingMethodology}
            onChange={(value) => handleInputChange("trainingMethodology", value)}
            placeholder="Describe the training methodology..."
          />
        </div>

        {/* Organisational Impact */}
        <div className="theme-card rounded-xl p-6 space-y-4">
          <h2 className="text-2xl font-bold theme-text border-b border-border pb-3">
            Organisational Impact
          </h2>
          <RichTextEditor
            value={formData.organisationalImpact}
            onChange={(value) => handleInputChange("organisationalImpact", value)}
            placeholder="Describe the organizational impact and benefits..."
          />
        </div>

        {/* Personal Impact */}
        <div className="theme-card rounded-xl p-6 space-y-4">
          <h2 className="text-2xl font-bold theme-text border-b border-border pb-3">
            Personal Impact
          </h2>
          <RichTextEditor
            value={formData.personalImpact}
            onChange={(value) => handleInputChange("personalImpact", value)}
            placeholder="Describe the personal impact and benefits for participants..."
          />
        </div>

        {/* Who should Attend */}
        <div className="theme-card rounded-xl p-6 space-y-4">
          <h2 className="text-2xl font-bold theme-text border-b border-border pb-3">
            Who should Attend?
          </h2>
          <RichTextEditor
            value={formData.whoShouldAttend}
            onChange={(value) => handleInputChange("whoShouldAttend", value)}
            placeholder="Describe who should attend this course..."
          />
        </div>

        {/* Course Images */}
        <div className="theme-card rounded-xl p-6 space-y-6">
          <h2 className="text-2xl font-bold theme-text border-b border-border pb-3">
            Course Images
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Course Image */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold theme-text">
                Main Course Image (horizontal) <span className="text-destructive">*</span>
              </label>
              <div className="space-y-3">
                {mainCourseImagePreview ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                    <img
                      src={mainCourseImagePreview}
                      alt="Main course preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageRemove("main")}
                      className="absolute top-2 right-2 p-1.5 bg-destructive/90 text-white rounded-full hover:bg-destructive transition-colors"
                      title="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted/30">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-10 h-10 mb-3 theme-muted" />
                      <p className="mb-2 text-sm theme-text">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs theme-muted">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            alert("File size should be less than 10MB")
                            return
                          }
                          handleImageUpload("main", file)
                        }
                      }}
                    />
                  </label>
                )}
                {mainCourseImage && (
                  <p className="text-xs theme-muted text-center">
                    {mainCourseImage.name} ({(mainCourseImage.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>

            {/* Card Image */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold theme-text">
                Card Image (square) <span className="text-destructive">*</span>
              </label>
              <div className="space-y-3">
                {cardImagePreview ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                    <img
                      src={cardImagePreview}
                      alt="Card preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageRemove("card")}
                      className="absolute top-2 right-2 p-1.5 bg-destructive/90 text-white rounded-full hover:bg-destructive transition-colors"
                      title="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted/30">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-10 h-10 mb-3 theme-muted" />
                      <p className="mb-2 text-sm theme-text">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs theme-muted">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            alert("File size should be less than 10MB")
                            return
                          }
                          handleImageUpload("card", file)
                        }
                      }}
                    />
                  </label>
                )}
                {cardImage && (
                  <p className="text-xs theme-muted text-center">
                    {cardImage.name} ({(cardImage.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Course Outline */}
        <div className="theme-card rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-2xl font-bold theme-text">Course Outline</h2>
            <button
              type="button"
              onClick={addCourseOutlineItem}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              Add Module
            </button>
          </div>

          <div className="space-y-4">
            {courseOutline.map((item, index) => (
              <div
                key={item.id}
                className="p-4 bg-muted/30 border border-border rounded-lg space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold theme-text">{item.day}</h3>
                  {courseOutline.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCourseOutlineItem(item.id)}
                      className="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold theme-text mb-2">Module Title</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateCourseOutlineItem(item.id, "title", e.target.value)}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg theme-text placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="Enter day title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold theme-text mb-2">Module Content</label>
                  <RichTextEditor
                    value={item.content}
                    onChange={(value) => updateCourseOutlineItem(item.id, "content", value)}
                    placeholder="Enter day content/topics..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="theme-card rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-2xl font-bold theme-text">Certifications</h2>
          </div>

          <div className="space-y-4">
            {/* Certificate Selection Dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold theme-text">
                Select Certifications
              </label>
              {loadingCertificates ? (
                <div className="w-full px-4 py-2 bg-input border border-border rounded-lg theme-text">
                  Loading certificates...
                </div>
              ) : availableCertificates.length === 0 ? (
                <div className="w-full px-4 py-2 bg-input border border-border rounded-lg theme-text">
                  No certificates available. Please create certificates first.
                </div>
              ) : (
                <Popover open={certificateSearchOpen} onOpenChange={setCertificateSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={certificateSearchOpen}
                      className="w-full justify-between bg-input border-border theme-text h-11 font-normal"
                    >
                      <span className="truncate">
                        {selectedCertificates.length > 0
                          ? `${selectedCertificates.length} certificate${selectedCertificates.length > 1 ? 's' : ''} selected`
                          : "Select certificates..."}
                      </span>
                      <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search certificates..."
                        value={certificateSearch}
                        onValueChange={setCertificateSearch}
                      />
                      <CommandList>
                        <CommandEmpty>No certificate found matching "{certificateSearch}".</CommandEmpty>
                        <CommandGroup>
                          {filteredCertificates.map((certificate) => (
                            <CommandItem
                              key={certificate.id}
                              value={certificate.name}
                              onSelect={() => {
                                toggleCertificateSelection(certificate.id)
                              }}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <Checkbox
                                  checked={selectedCertificateIds.includes(certificate.id)}
                                  onCheckedChange={() => toggleCertificateSelection(certificate.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{certificate.name}</div>
                                  {certificate.description && (
                                    <div className="text-xs line-clamp-1">
                                      {certificate.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Selected Certificates Display */}
            {selectedCertificates.length > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-semibold theme-text">
                  Selected Certificates ({selectedCertificates.length})
                </label>
                <div className="space-y-2">
                  {selectedCertificates.map((certificate) => (
                    <div
                      key={certificate.id}
                      className="p-4 bg-muted/30 border border-border rounded-lg flex items-start justify-between gap-4"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold theme-text mb-1">{certificate.name}</h4>
                        {certificate.description && (
                          <p className="text-sm theme-muted line-clamp-2">{certificate.description}</p>
                        )}
                        {certificate.imageUrl && (
                          <div className="mt-2 w-24 h-16 rounded overflow-hidden border border-border">
                            <img
                              src={certificate.imageUrl}
                              alt={certificate.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCertificate(certificate.id)}
                        className="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors flex-shrink-0"
                        title="Remove certificate"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FAQs */}
        <div className="theme-card rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-2xl font-bold theme-text">Frequently Asked Questions (FAQs)</h2>
            <button
              type="button"
              onClick={addFAQ}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              Add FAQ
            </button>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="p-4 bg-muted/30 border border-border rounded-lg space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold theme-text">FAQ</h3>
                  {faqs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFAQ(faq.id)}
                      className="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold theme-text mb-2">Question</label>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFAQ(faq.id, "question", e.target.value)}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg theme-text placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="Enter question..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold theme-text mb-2">Answer</label>
                  <textarea
                    value={faq.answer}
                    onChange={(e) => updateFAQ(faq.id, "answer", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg theme-text placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                    placeholder="Enter answer..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        {/* Error Message */}
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pb-8">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 theme-card border border-border rounded-lg font-semibold theme-text hover:bg-muted transition-all"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg font-semibold hover:shadow-lg glow-electric transition-all flex items-center gap-2 disabled:opacity-50"
            disabled={isSubmitting}
          >
            <Save size={18} />
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Course' : 'Save Course'}
          </button>
        </div>
      </form>
      )}
    </div>
  )
}
