import { supabase } from './lib/supabase.js'

function App() {
  const supabaseConfigured = Boolean(supabase)

  return (
    <main>
      <p className="eyebrow">Hackathon room</p>
      <h1>Contact</h1>
      <p>Shared to-dos for a team, coming online.</p>
      {supabaseConfigured && <p>Supabase client configured.</p>}
    </main>
  )
}

export default App
