'use client'

import React, { useState, ReactNode } from 'react'

/**
 * Utility function for conditional class joining.
 * Defined locally to avoid import dependency errors.
 */
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

/**
 * Types
 */
interface MindMapData {
  central: { id: string; label: string; type: 'root' }
  branches: Array<{
    id: string
    label: string
    color: 'blue' | 'violet' | 'green' | 'amber' | 'orange'
    leaves: Array<{ id: string; label: string; important?: boolean }>
  }>
}

interface TabProps {
  id: string
  label: string
  icon: string
}

const TABS: TabProps[] = [
  { id: 'summary', label: 'Summary', icon: '📖' },
  { id: 'mindmap', label: 'Mind Map', icon: '🗺️' },
  { id: 'bionic', label: 'Bionic', icon: '👁️' },
  { id: 'podcast', label: 'Podcast', icon: '🎧' },
  { id: 'flashcards', label: 'Flashcards', icon: '🃏' },
  { id: 'quiz', label: 'Quiz', icon: '❓' },
  { id: 'chat', label: 'Chat', icon: '💬' },
]

interface SessionTabsProps {
  summaryContent: ReactNode
  flashcardsContent: ReactNode
  quizContent: ReactNode
  chatContent: ReactNode
  overview?: string
  keyConcepts?: Array<{ term: string; definition: string }>
  actionItems?: Array<{ text: string; due: string | null }>
  quiz?: Array<{ question: string; options: string[]; answer: string }>
  sessionId: string
}

/**
 * Main App Component
 * Exported as default to resolve "type is invalid" React errors.
 */
export default function App(props: SessionTabsProps) {
  return <SessionTabs {...props} />
}

export function SessionTabs({
  summaryContent,
  flashcardsContent,
  quizContent,
  chatContent,
  overview = '',
  keyConcepts = [],
  actionItems = [],
  sessionId,
}: SessionTabsProps) {
  const [activeTab, setActiveTab] = useState('summary')

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            )}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'summary' && summaryContent}
        {activeTab === 'flashcards' && flashcardsContent}
        {activeTab === 'quiz' && quizContent}
        {activeTab === 'chat' && chatContent}
        {activeTab === 'mindmap' && (
          <MindMapView 
            sessionId={sessionId} 
            overview={overview} 
            keyConcepts={keyConcepts} 
          />
        )}
        {activeTab === 'bionic' && (
          <BionicView 
            overview={overview} 
            keyConcepts={keyConcepts} 
            actionItems={actionItems} 
          />
        )}
        {activeTab === 'podcast' && (
          <PodcastView 
            sessionId={sessionId} 
            overview={overview} 
            keyConcepts={keyConcepts} 
            actionItems={actionItems} 
          />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// FEATURE VIEWS
// ============================================================================

function MindMapView({ 
  sessionId, 
  overview, 
  keyConcepts 
}: { 
  sessionId: string
  overview: string
  keyConcepts: Array<{ term: string; definition: string }>
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null)

  const generateMindMapLocally = () => {
    if (!overview && keyConcepts.length === 0) {
      setError('No content available to generate mind map')
      return
    }

    const centralLabel = overview.split('.').slice(0, 1)[0]?.slice(0, 30) || 'Study Guide'
    
    const branches = keyConcepts.slice(0, 5).map((concept, idx) => ({
      id: `b${idx}`,
      label: concept.term.slice(0, 25),
      color: (['blue', 'violet', 'green', 'amber', 'orange'][idx % 5]) as any,
      leaves: [
        { 
          id: `l${idx}-1`, 
          label: concept.definition.slice(0, 60), 
          important: concept.definition.toLowerCase().includes('important')
        }
      ]
    }))

    setMindMapData({
      central: { id: 'root', label: centralLabel, type: 'root' },
      branches
    })
  }

  const generateMindMapFromAPI = async () => {
    setLoading(true)
    setError(null)
    try {
      // Logic for actual API call would go here
      // For this preview, we'll simulate a 1s delay then generate locally
      await new Promise(resolve => setTimeout(resolve, 1000))
      generateMindMapLocally()
    } catch (err) {
      setError('Failed to reach server')
    } finally {
      setLoading(false)
    }
  }

  if (!mindMapData) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">🗺️ Mind Map</h3>
          <p className="text-slate-500 mb-6 text-sm">Visualizing connections helps with spatial memory and focus.</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={generateMindMapLocally}
              className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium"
            >
              Quick Preview
            </button>
            <button 
              onClick={generateMindMapFromAPI}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Thinking...' : 'AI Generate'}
            </button>
          </div>
          {error && <p className="text-red-500 mt-4 text-xs">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <h3 className="text-lg font-bold text-center mb-8">{mindMapData.central.label}</h3>
        <div className="grid gap-6">
          {mindMapData.branches.map((branch) => (
            <div key={branch.id} className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700">
              <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-blue-500" />
              <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2">{branch.label}</h4>
              <div className="space-y-2">
                {branch.leaves.map((leaf) => (
                  <div key={leaf.id} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-sm">
                    {leaf.important && <span className="mr-2 text-xs font-bold text-amber-500 uppercase tracking-tighter">★</span>}
                    {leaf.label}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button 
          onClick={() => setMindMapData(null)}
          className="mt-8 w-full py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Reset View
        </button>
      </div>
    </div>
  )
}

function BionicView({ overview, keyConcepts, actionItems }: any) {
  const [bionicHtml, setBionicHtml] = useState('')

  const generateBionic = () => {
    const text = overview + ' ' + keyConcepts.map((c: any) => `${c.term}: ${c.definition}`).join(' ')
    const words = text.split(/\s+/)
    const formatted = words.map(word => {
      if (word.length <= 3) return `<b style="opacity: 0.9">${word}</b>`
      const half = Math.ceil(word.length / 2)
      return `<b style="opacity: 0.9">${word.slice(0, half)}</b>${word.slice(half)}`
    }).join(' ')
    setBionicHtml(formatted)
  }

  if (!bionicHtml) {
    return (
      <div className="text-center p-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
        <h3 className="text-xl font-bold mb-2">👁️ Bionic Reading</h3>
        <p className="text-slate-500 text-sm mb-6">Enhance reading speed and focus by guiding the eyes with artificial fixation points.</p>
        <button onClick={generateBionic} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium">
          Enable Bionic Mode
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold">Bionic Reading View</h3>
        <button onClick={() => setBionicHtml('')} className="text-xs text-slate-400 underline">Disable</button>
      </div>
      <div 
        className="leading-relaxed text-slate-700 dark:text-slate-300 space-y-4"
        dangerouslySetInnerHTML={{ __html: bionicHtml }}
      />
    </div>
  )
}

function PodcastView({ overview, keyConcepts }: any) {
  const [playing, setPlaying] = useState(false)
  
  const handleToggle = () => {
    if (!playing) {
      const text = `Summarizing your study session. ${overview}. Here are the main concepts: ${keyConcepts.map((c: any) => c.term).join(', ')}.`
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.onend = () => setPlaying(false)
      window.speechSynthesis.speak(utterance)
      setPlaying(true)
    } else {
      window.speechSynthesis.cancel()
      setPlaying(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30">
      <div className={cn(
        "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all",
        playing ? "bg-orange-500 animate-pulse" : "bg-orange-100 dark:bg-orange-900/50"
      )}>
        <span className="text-3xl">{playing ? '⏸' : '🎧'}</span>
      </div>
      <h3 className="text-xl font-bold mb-2">Podcast Audio Guide</h3>
      <p className="text-slate-500 text-sm text-center mb-8 max-w-sm">Great for auditory learners. Listen to a generated audio summary of your notes.</p>
      <button 
        onClick={handleToggle}
        className={cn(
          "px-8 py-3 rounded-full font-bold transition-all",
          playing ? "bg-slate-800 text-white" : "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
        )}
      >
        {playing ? 'Stop Audio' : 'Play Summary'}
      </button>
    </div>
  )
}