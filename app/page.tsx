'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [isHovering, setIsHovering] = useState<string | null>(null)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Scribe
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Your AI-powered study assistant. Record lectures or upload PDFs to generate 
            summaries, flashcards, and get instant answers.
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Live Recording Card */}
          <div
            className={`group relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 cursor-pointer transition-all duration-300 ${
              isHovering === 'record' ? 'scale-105 border-purple-400' : ''
            }`}
            onMouseEnter={() => setIsHovering('record')}
            onMouseLeave={() => setIsHovering(null)}
          >
            <Link href="/record" className="block">
              <div className="text-6xl mb-4">🎙️</div>
              <h2 className="text-2xl font-bold text-white mb-3">Live Recording</h2>
              <p className="text-purple-200">
                Record your lecture in real-time. Scribe will transcribe and summarize 
                the content automatically.
              </p>
              <div className="mt-6 flex items-center text-purple-300 group-hover:text-purple-200">
                <span>Start Recording</span>
                <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          </div>

          {/* PDF Upload Card */}
          <div
            className={`group relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 cursor-pointer transition-all duration-300 ${
              isHovering === 'pdf' ? 'scale-105 border-purple-400' : ''
            }`}
            onMouseEnter={() => setIsHovering('pdf')}
            onMouseLeave={() => setIsHovering(null)}
          >
            <Link href="/upload" className="block">
              <div className="text-6xl mb-4">📄</div>
              <h2 className="text-2xl font-bold text-white mb-3">PDF Upload</h2>
              <p className="text-purple-200">
                Upload your PDF documents (textbooks, reviewers, slides) and get 
                instant summaries and study materials.
              </p>
              <div className="mt-6 flex items-center text-purple-300 group-hover:text-purple-200">
                <span>Upload PDF</span>
                <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { icon: '📝', title: 'Auto-Summarize', desc: 'Get 3-sentence overviews' },
            { icon: '🃏', title: 'Flashcards', desc: '8-15 cards per session' },
            { icon: '❓', title: 'Quiz Mode', desc: 'Test your knowledge' },
            { icon: '💬', title: 'AI Chat', desc: 'Ask anything about your material' }
          ].map((feature, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
              <p className="text-purple-300 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}