'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { UploadCloud, File, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.')
      return
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File must be smaller than 20MB.')
      return
    }
    setFile(f)
    if (!title) {
      setTitle(f.name.replace(/\.pdf$/i, ''))
    }
    setError(null)
  }

  const handleUpload = async () => {
    if (!file) return
    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title || file.name)
    formData.append('subject', subject)

    try {
      const res = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      router.push(`/session/${data.session_id}`)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-bg-base">
      <TopBar title="Upload PDF" />
      
      <div className="flex-1 max-w-2xl w-full mx-auto p-4 md:p-8 overflow-y-auto">
        <h1 className="font-display text-3xl font-bold text-text-primary mb-2">Upload Material</h1>
        <p className="text-text-secondary mb-8">We&apos;ll extract the text and generate your study guide.</p>
        
        <Card className="flex flex-col gap-6 p-6">
          {!file ? (
            <div 
              className={cn(
                "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-colors cursor-pointer",
                isDragging ? "border-accent-orange bg-accent-orange/5" : "border-border hover:border-border-subtle hover:bg-bg-elevated/50"
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="h-16 w-16 bg-bg-elevated rounded-full flex items-center justify-center mb-4 text-text-muted">
                <UploadCloud className="h-8 w-8" />
              </div>
              <h3 className="text-text-primary font-medium mb-1">Click or drag PDF here</h3>
              <p className="text-text-secondary text-sm">Maximum file size 20MB</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="application/pdf"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 border border-border rounded-xl bg-bg-elevated">
              <div className="h-12 w-12 bg-accent-orange/10 text-accent-orange rounded-lg flex items-center justify-center shrink-0">
                <File className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium truncate">{file.name}</p>
                <p className="text-text-secondary text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button 
                onClick={() => setFile(null)}
                className="text-text-muted hover:text-danger p-2"
                disabled={isUploading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {error && <p className="text-danger text-sm">{error}</p>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 4: Dynamics" disabled={isUploading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Subject (Optional)</label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Physics 101" disabled={isUploading} />
            </div>
          </div>

          <Button 
            className="w-full mt-4" 
            variant="pdf" 
            size="lg"
            disabled={!file || isUploading}
            onClick={handleUpload}
          >
            {isUploading ? (
              <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Processing PDF...</span>
            ) : "Generate Study Guide"}
          </Button>
        </Card>
      </div>
    </div>
  )
}