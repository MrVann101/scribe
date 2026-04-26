import { TopBar } from '@/components/layout/TopBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card } from '@/components/ui/Card'
import { Mic, FileText } from 'lucide-react'
import Link from 'next/link'

export default function NewSessionPage() {
  return (
    <div className="flex h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <TopBar title="New Session" />
        
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary">Create a session</h1>
            <p className="text-text-secondary mt-1">How would you like to capture your material?</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/record" className="block group">
              <Card className="h-full border-2 border-transparent hover:border-accent-blue/50 transition-all cursor-pointer flex flex-col items-center text-center p-8 bg-accent-blue/5">
                <div className="h-20 w-20 rounded-full bg-accent-blue/20 text-accent-blue flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Mic className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-display font-semibold text-text-primary mb-2">Record Lecture</h3>
                <p className="text-text-secondary text-sm">
                  Live transcription with auto-translation from Bisaya to English. Best for in-person classes.
                </p>
              </Card>
            </Link>

            <Link href="/upload" className="block group">
              <Card className="h-full border-2 border-transparent hover:border-accent-orange/50 transition-all cursor-pointer flex flex-col items-center text-center p-8 bg-accent-orange/5">
                <div className="h-20 w-20 rounded-full bg-accent-orange/20 text-accent-orange flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileText className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-display font-semibold text-text-primary mb-2">Upload PDF</h3>
                <p className="text-text-secondary text-sm">
                  Upload a textbook chapter, reviewer, or lecture slides to generate a study guide instantly.
                </p>
              </Card>
            </Link>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
