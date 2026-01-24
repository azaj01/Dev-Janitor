import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Terminal, Package, Trash2, Cpu, Settings } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'

function App() {
  const [greetMsg, setGreetMsg] = useState('')
  const [name, setName] = useState('')

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke('greet', { name }))
  }

  return (
    <div className="flex h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      {/* Sidebar */}
      <motion.nav
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-20 flex flex-col items-center py-6 border-r border-[var(--border-glass)] backdrop-blur-md bg-[var(--color-bg-surface-glass)]"
      >
        <div className="mb-8 p-2 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]">
          <Sparkles className="w-6 h-6 text-white" />
        </div>

        <div className="flex flex-col gap-6">
          <NavIcon icon={<Terminal />} active />
          <NavIcon icon={<Package />} />
          <NavIcon icon={<Trash2 />} />
          <NavIcon icon={<Cpu />} />
        </div>

        <div className="mt-auto">
          <NavIcon icon={<Settings />} />
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-10">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]"
          >
            Dev Janitor v2
          </motion.h1>
          <p className="text-[var(--color-text-secondary)] mt-2">
            AI-Native Development Environment Manager
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card title="System Status" value="Healthy" icon={<Sparkles />} />
          <Card title="Tools Detected" value="0" icon={<Terminal />} />
          <Card title="Disk Freed" value="0 MB" icon={<Trash2 />} />
        </section>

        {/* Temporary Greet Interaction */}
        <div className="mt-10 p-6 rounded-2xl border border-[var(--border-glass)] bg-[var(--color-bg-surface-glass)]">
          <form
            className="flex gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              greet()
            }}
          >
            <input
              id="greet-input"
              className="flex-1 bg-black/20 border border-[var(--border-glass)] rounded-lg px-4 py-2 outline-none focus:border-[var(--color-primary)] transition-colors"
              onChange={(e) => setName(e.currentTarget.value)}
              placeholder="Enter a name..."
            />
            <button
              type="submit"
              className="px-6 py-2 bg-[var(--color-primary)] text-black font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Greet
            </button>
          </form>
          <p className="mt-4 text-[var(--color-text-secondary)]">{greetMsg}</p>
        </div>
      </main>
    </div>
  )
}

function NavIcon({ icon, active }: { icon: React.ReactNode, active?: boolean }) {
  return (
    <div className={`p-3 rounded-xl transition-all cursor-pointer ${active ? 'bg-[var(--color-primary)] text-black shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'text-[var(--color-text-muted)] hover:text-white hover:bg-white/5'}`}>
      {React.cloneElement(icon as React.ReactElement, { size: 20 })}
    </div>
  )
}

function Card({ title, value, icon }: { title: string, value: string, icon: any }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-6 rounded-2xl border border-[var(--border-glass)] bg-[var(--color-bg-surface-glass)] backdrop-blur-md relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-32 bg-[var(--color-primary)] opacity-[0.03] blur-[50px] rounded-full translate-x-10 -translate-y-10 group-hover:opacity-[0.08] transition-opacity" />

      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[var(--color-text-secondary)] font-medium">{title}</h3>
        <div className="p-2 rounded-lg bg-white/5 text-[var(--color-primary)]">
          {React.cloneElement(icon, { size: 18 })}
        </div>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </motion.div>
  )
}

export default App
