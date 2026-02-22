import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import Register from './pages/Register'
import Phase1 from './pages/Phase1'
import Phase2 from './pages/Phase2'
import Phase3 from './pages/Phase3'
import Phase4 from './pages/Phase4'
import Phase5 from './pages/Phase5'
import Phase5Location2 from './pages/Phase5Location2'
import Phase6 from './pages/Phase6'

import Admin from './pages/Admin'
import Layout from './components/Layout'

export const API_URL = import.meta.env.VITE_API_URL || '/api'

function App() {
  const [team, setTeam] = useState(() => {
    const saved = localStorage.getItem('codehunt_team')
    return saved ? JSON.parse(saved) : null
  })
  const [syncing, setSyncing] = useState(true)

  useEffect(() => {
    if (team) {
      localStorage.setItem('codehunt_team', JSON.stringify(team))
    }
  }, [team])

  // Re-fetch team data from server on load to sync localStorage with latest state
  useEffect(() => {
    if (team && team.teamName) {
      fetch(`${API_URL}/teams/${team.teamName}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setTeam(data)
        })
        .catch(() => { })
        .finally(() => setSyncing(false))
    } else {
      setSyncing(false)
    }
  }, [])

  if (syncing) {
    return (
      <Layout team={team}>
        <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" />
          <p>Loading...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout team={team}>
      <Routes>
        <Route path="/" element={<LandingPage team={team} setTeam={setTeam} />} />
        <Route path="/register" element={<Register team={team} setTeam={setTeam} />} />
        <Route path="/phase1" element={<Phase1 team={team} setTeam={setTeam} />} />
        <Route path="/phase2" element={<Phase2 team={team} setTeam={setTeam} />} />
        <Route path="/phase3" element={<Phase3 team={team} setTeam={setTeam} />} />
        <Route path="/phase4" element={<Phase4 team={team} setTeam={setTeam} />} />
        <Route path="/phase5" element={<Phase5 team={team} setTeam={setTeam} />} />
        <Route path="/phase5-location2" element={<Phase5Location2 />} />
        <Route path="/phase6" element={<Phase6 team={team} setTeam={setTeam} />} />

        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Layout>
  )
}

export default App
