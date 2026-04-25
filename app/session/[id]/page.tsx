'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Session {
  id: string
  source: 'pdf' | 'recording'
  status: 'processing' | 'done' | 'error'
  pdf_name?: string
  created_at: string
}

interface Summary {
  overview: string
  key_concepts: Array<{ term: string; definition: string }>
  action_items: Array<{ text: string; due: string | null }>
  quiz: Array<{
    question: string
    options: string[]
    answer: string
  }>
  flashcards: Array<{ front: string; back: string; topic: string }>
}

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [session, setSession] = useState<Session | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'flashcards' | 'quiz'>('overview')
  const [currentCard, setCurrentCard] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({})
  const [showQuizResults, setShowQuizResults] = useState(false)

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`)
        const data = await res.json()
        setSession(data.session)
        setSummary(data.summary)
      } catch (err) {
        console.error('Failed to fetch session:', err)
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      fetchSession()
    }
  }, [sessionId])

  const handleQuizAnswer = (questionIndex: number, answer: string) => {
    setQuizAnswers(prev => ({ ...prev, [questionIndex]: answer }))
  }

  const calculateQuizScore = () => {
    if (!summary) return 0
    let correct = 0
    summary.quiz.forEach((q, i) => {
      if (quizAnswers[i] === q.answer) correct++
    })
    return correct
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">📚</div>
          <p className="text-purple-200">Loading session...</p>
        </div>
      </main>
    )
  }

  if (session?.status === 'processing') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-6xl mb-4">⚡</div>
          <h2 className="text-2xl font-bold text-white mb-2">Processing Your Study Materials</h2>
          <p className="text-purple-200">This may take a minute...</p>
        </div>
      </main>
    )
  }

  if (!session || !summary) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-white mb-2">Session Not Found</h2>
          <Link href="/" className="text-purple-300 hover:text-white">Go Home</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link href="/" className="text-purple-300 hover:text-white">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-white">
                {session.source === 'pdf' ? session.pdf_name : 'Lecture Recording'}
              </h1>
              <p className="text-purple-300 text-sm">
                {new Date(session.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Link
            href={`/chat/${sessionId}`}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center"
          >
            <span className="mr-2">💬</span>
            Chat
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          {(['overview', 'flashcards', 'quiz'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setCurrentCard(0)
                setShowAnswer(false)
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-purple-200 hover:bg-white/20'
              }`}
            >
              {tab === 'overview' && '📝 Overview'}
              {tab === 'flashcards' && '🃏 Flashcards'}
              {tab === 'quiz' && '❓ Quiz'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Overview */}
              <div className="bg-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Summary</h2>
                <p className="text-purple-100 leading-relaxed">{summary.overview}</p>
              </div>

              {/* Key Concepts */}
              <div className="bg-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Key Concepts</h2>
                <div className="space-y-4">
                  {summary.key_concepts.map((concept, i) => (
                    <div key={i} className="border-l-4 border-purple-400 pl-4">
                      <h3 className="text-white font-medium">{concept.term}</h3>
                      <p className="text-purple-200 text-sm">{concept.definition}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Items */}
              {summary.action_items.length > 0 && (
                <div className="bg-white/10 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Action Items</h2>
                  <div className="space-y-3">
                    {summary.action_items.map((item, i) => (
                      <div key={i} className="flex items-center text-purple-100">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3" />
                        <span>{item.text}</span>
                        {item.due && (
                          <span className="ml-2 text-yellow-400 text-sm">({item.due})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Flashcards Tab */}
          {activeTab === 'flashcards' && (
            <div className="bg-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">
                  Flashcards ({currentCard + 1}/{summary.flashcards.length})
                </h2>
                <span className="text-purple-300">{summary.flashcards[currentCard]?.topic}</span>
              </div>

              {/* Flashcard */}
              <div 
                className="min-h-[300px] bg-white/5 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer"
                onClick={() => setShowAnswer(!showAnswer)}
              >
                <p className="text-white text-xl text-center mb-6">
                  {summary.flashcards[currentCard]?.front}
                </p>
                
                {showAnswer && (
                  <div className="border-t border-white/20 pt-6 mt-4 w-full">
                    <p className="text-purple-200 text-center text-lg">
                      {summary.flashcards[currentCard]?.back}
                    </p>
                  </div>
                )}
                
                {!showAnswer && (
                  <p className="text-purple-400 text-sm">Click to reveal answer</p>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => {
                    setCurrentCard(c => Math.max(0, c - 1))
                    setShowAnswer(false)
                  }}
                  disabled={currentCard === 0}
                  className="px-6 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    setCurrentCard(c => Math.min(summary.flashcards.length - 1, c + 1))
                    setShowAnswer(false)
                  }}
                  disabled={currentCard === summary.flashcards.length - 1}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Quiz Tab */}
          {activeTab === 'quiz' && (
            <div className="bg-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Practice Quiz</h2>
                {showQuizResults && (
                  <span className="text-xl font-bold text-green-400">
                    Score: {calculateQuizScore()}/{summary.quiz.length}
                  </span>
                )}
              </div>

              <div className="space-y-8">
                {summary.quiz.map((q, qi) => (
                  <div key={qi} className="border border-white/10 rounded-xl p-4">
                    <p className="text-white font-medium mb-4">
                      {qi + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((option, oi) => {
                        const letter = String.fromCharCode(65 + oi)
                        const isSelected = quizAnswers[qi] === letter
                        const isCorrect = q.answer === letter
                        
                        let bgClass = 'bg-white/5 hover:bg-white/10'
                        if (showQuizResults) {
                          if (isCorrect) bgClass = 'bg-green-500/30 border-green-400'
                          else if (isSelected && !isCorrect) bgClass = 'bg-red-500/30 border-red-400'
                        } else if (isSelected) {
                          bgClass = 'bg-purple-600/30 border-purple-400'
                        }

                        return (
                          <button
                            key={oi}
                            onClick={() => !showQuizResults && handleQuizAnswer(qi, letter)}
                            disabled={showQuizResults}
                            className={`w-full text-left p-3 rounded-lg border border-white/10 transition-colors ${bgClass}`}
                          >
                            <span className="text-purple-200">{option}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quiz Actions */}
              <div className="mt-6 flex justify-center space-x-4">
                {!showQuizResults ? (
                  <button
                    onClick={() => setShowQuizResults(true)}
                    disabled={Object.keys(quizAnswers).length !== summary.quiz.length}
                    className="px-8 py-3 bg-purple-600 text-white rounded-lg disabled:opacity-50"
                  >
                    Check Answers
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setQuizAnswers({})
                      setShowQuizResults(false)
                    }}
                    className="px-8 py-3 bg-white/10 text-white rounded-lg"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}