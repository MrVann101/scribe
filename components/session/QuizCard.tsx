'use client'

// components/session/QuizCard.tsx
// MCQ with answer reveal, score at end

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Trophy } from 'lucide-react'
import type { QuizQuestion } from '@/types/database'

interface QuizCardProps {
  questions: QuizQuestion[]
}

export function QuizCard({ questions }: QuizCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  if (questions.length === 0) {
    return (
      <Card>
        <p className="text-gray-400 text-center py-8">No quiz available for this session.</p>
      </Card>
    )
  }

  const currentQuestion = questions[currentIndex]

  const handleSelect = (answer: string) => {
    if (showResult) return
    
    setSelectedAnswer(answer)
    setShowResult(true)
    
    if (answer === currentQuestion.answer) {
      setScore(prev => prev + 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setIsComplete(true)
    }
  }

  if (isComplete) {
    return (
      <Card>
        <div className="text-center py-8">
          <Trophy className="h-16 w-16 text-amber-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h3>
          <p className="text-gray-400 mb-4">
            You got {score} out of {questions.length} correct
          </p>
          <button
            onClick={() => {
              setCurrentIndex(0)
              setSelectedAnswer(null)
              setShowResult(false)
              setScore(0)
              setIsComplete(false)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-400">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className="text-sm text-gray-400">Score: {score}</span>
      </div>

      <h4 className="text-lg font-medium text-white mb-4">{currentQuestion.question}</h4>

      <div className="space-y-2">
        {currentQuestion.options.map((option, index) => {
          const optionLetter = ['A', 'B', 'C', 'D'][index]
          const isCorrect = optionLetter === currentQuestion.answer
          const isSelected = optionLetter === selectedAnswer

          let bgClass = 'bg-white/5 hover:bg-white/10'
          if (showResult) {
            if (isCorrect) {
              bgClass = 'bg-green-600/20 border border-green-500'
            } else if (isSelected && !isCorrect) {
              bgClass = 'bg-red-600/20 border border-red-500'
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleSelect(optionLetter)}
              disabled={showResult}
              className={cn(
                'w-full p-3 rounded-lg text-left text-sm transition-colors',
                bgClass,
                !showResult && 'cursor-pointer'
              )}
            >
              <span className="font-medium text-gray-300">{option}</span>
              
              {showResult && isCorrect && (
                <CheckCircle className="inline-block h-4 w-4 text-green-400 ml-2" />
              )}
              {showResult && isSelected && !isCorrect && (
                <XCircle className="inline-block h-4 w-4 text-red-400 ml-2" />
              )}
            </button>
          )
        })}
      </div>

      {showResult && (
        <button
          onClick={handleNext}
          className="w-full mt-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
        </button>
      )}
    </Card>
  )
}

export default QuizCard