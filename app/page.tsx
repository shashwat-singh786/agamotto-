import Link from "next/link"
import AnimatedText from "@/components/animated-text"
import { Shield, Zap, Brain, Activity, Lock, Clock } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Real-time Detection",
    description: "Automatically detect suspicious activity across all monitored cameras with sub-second latency.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Zap,
    title: "Instant Alerts",
    description: "Receive immediate email and dashboard notifications the moment a threat is identified.",
    color: "bg-red-50 text-red-600",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    description: "Gemini-powered video intelligence annotates events, generates summaries, and flags key moments.",
    color: "bg-green-50 text-green-600",
  },
]

const stats = [
  { label: "Events Analyzed", value: "10K+", icon: Activity },
  { label: "Uptime", value: "99.9%", icon: Clock },
  { label: "Detection Accuracy", value: "97%", icon: Shield },
  { label: "Camera Feeds", value: "∞", icon: Lock },
]

export default async function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 bg-white border-b border-slate-200">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide border border-blue-100 mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          AI-Powered Surveillance · Live
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-4">
          Agamotto
        </h1>
        <AnimatedText />
        <p className="mt-4 max-w-xl text-slate-500 text-lg leading-relaxed">
          Enterprise-grade security monitoring with Gemini AI. Detect threats in real time, analyse footage automatically, and stay one step ahead.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <Link
            href="/sign-in"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg text-base font-semibold shadow-sm hover:bg-blue-700 transition-colors duration-200"
          >
            Get Started
          </Link>
          <Link
            href="/pages/upload"
            className="inline-flex items-center px-6 py-3 bg-white text-slate-700 rounded-lg text-base font-medium border border-slate-200 hover:bg-slate-50 transition-colors duration-200"
          >
            Try Demo
          </Link>
        </div>

        {/* Mock Dashboard Preview */}
        <div className="mt-16 w-full max-w-4xl rounded-2xl border border-slate-200 shadow-xl bg-slate-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-slate-200">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-4 text-xs text-slate-400 font-mono">agamotto — dashboard</span>
          </div>
          <div className="grid grid-cols-3 gap-3 p-6">
            {["Camera 01 · Lobby", "Camera 02 · Entrance", "Camera 03 · Parking"].map((cam, i) => (
              <div key={i} className="bg-slate-800 rounded-lg aspect-video flex items-end overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
                <div className="relative p-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-slate-300 font-medium">{cam}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 pb-6 grid grid-cols-4 gap-3">
            {["12 Alerts", "3 Flagged", "6 Cameras", "99.9% Up"].map((stat, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                <p className="text-xs text-slate-500">{stat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
          Everything you need for <span className="text-blue-600">smart security</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description, color }) => (
            <div key={title} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className={`inline-flex p-3 rounded-lg ${color} mb-4`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Strip */}
      <section className="bg-blue-600 py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center text-white">
              <Icon className="h-6 w-6 mx-auto mb-2 opacity-80" />
              <p className="text-3xl font-extrabold">{value}</p>
              <p className="text-blue-100 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}