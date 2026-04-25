'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile)
        setError(null)
      } else {
        setError('Please upload a PDF file')
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile)
        setError(null)
      } else {
        setError('Please upload a PDF file')
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload PDF')
      }

      // Redirect to session page
      router.push(`/session/${data.session_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <a href="/" className="text-purple-300 hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 className="text-2xl font-bold text-white ml-4">Upload PDF</h1>
        </div>

        {/* Upload Area */}
        <div className="max-w-2xl mx-auto">
          <div
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              dragActive 
                ? 'border-purple-400 bg-purple-500/20' 
                : 'border-white/20 bg-white/5'
            } ${file ? 'border-green-400 bg-green-500/10' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              onChange={handleChange}
              className="hidden"
            />

            {file ? (
              <div className="space-y-4">
                <div className="text-6xl">📄</div>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-purple-300 text-sm">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => {
                    setFile(null)
                    if (inputRef.current) inputRef.current.value = ''
                  }}
                  className="text-purple-300 hover:text-white text-sm"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-6xl">📁</div>
                <p className="text-white text-lg">Drag & drop your PDF here</p>
                <p className="text-purple-300">or</p>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Browse Files
                </button>
                <p className="text-purple-400 text-sm mt-4">
                  Supported format: PDF
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-400 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`w-full mt-6 py-4 rounded-xl font-semibold transition-all ${
              file && !uploading
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90'
                : 'bg-white/10 text-white/50 cursor-not-allowed'
            }`}
          >
            {uploading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing PDF...
              </span>
            ) : (
              'Upload & Generate Study Materials'
            )}
          </button>

          {/* Info */}
          <div className="mt-8 grid md:grid-cols-3 gap-4 text-center">
            {[
              { icon: '📝', title: 'Auto-Summary', desc: '3-sentence overview' },
              { icon: '🃏', title: 'Flashcards', desc: '8-15 cards generated' },
              { icon: '❓', title: 'Quiz', desc: '3 practice questions' }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-4">
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="text-white font-medium text-sm">{item.title}</p>
                <p className="text-purple-300 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}