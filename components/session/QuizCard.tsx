'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { QuizQuestion } from '@/types/database'
import { cn } from '@/lib/utils'

export function QuizCard({ questions }: { questions: QuizQuestion[] | null }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)

  if (!questions || questions.length === 0) return null

  const isFinished = showResult
  const question = questions[currentIdx]

  const handleSelect = (optionLabel: string) => {
    if (selected) return // already answered
    setSelected(optionLabel)
    if (optionLabel === question.answer) {
      setScore(s => s + 1)
    }
  }

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1)
      setSelected(null)
    } else {
      setShowResult(true)
    }
  }

  return (
    <Card className="flex flex-col h-full min-h-[300px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-semibold text-text-primary">Quiz</h2>
        {!isFinished && (
          <span className="text-sm font-medium text-text-secondary">
            {currentIdx + 1} / {questions.length}
          </span>
        )}
      </div>

      {isFinished ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="text-5xl mb-4 text-accent-blue font-display font-bold">
            {score} / {questions.length}
          </div>
          <h3 className="text-xl text-text-primary font-medium mb-6">
            {score === questions.length ? 'Perfect!' : 'Great effort!'}
          </h3>
          <Button onClick={() => {
            setCurrentIdx(0)
            setSelected(null)
            setScore(0)
            setShowResult(false)
          }}>
            Retake Quiz
          </Button>
        </div>
      ) : (
        <div className="flex flex-col flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
          <p className="text-text-primary font-medium mb-6">{question.question}</p>
          <div className="flex flex-col gap-3 flex-1">
            {question.options.map((option, i) => {
              const label = option.charAt(0) // "A", "B", "C", "D"
              const isSelected = selected === label
              const isCorrect = label === question.answer

              let optionClass = "bg-bg-base border-border hover:border-accent-blue/50 hover:bg-bg-elevated"

              if (selected) {
                if (isCorrect) {
                  optionClass = "bg-success/10 border-success text-success"
                } else if (isSelected && !isCorrect) {
                  optionClass = "bg-danger/10 border-danger text-danger"
                } else {
                  optionClass = "bg-bg-base border-border opacity-50"
                }
              }

              return (
                <button
                  key={i}
                  disabled={selected !== null}
                  onClick={() => handleSelect(label)}
                  className={cn(
                    "text-left p-3 rounded-lg border transition-all duration-200 text-sm",
                    optionClass,
                    !selected && "cursor-pointer"
                  )}
                >
                  {option}
                </button>
              )
            })}
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              disabled={!selected}
              onClick={handleNext}
              variant={selected ? 'primary' : 'secondary'}
            >
              {currentIdx === questions.length - 1 ? 'Finish' : 'Next Question'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}