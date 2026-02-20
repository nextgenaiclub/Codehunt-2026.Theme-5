import { useState } from 'react'
import { Users, Check, AlertCircle } from 'lucide-react'
import { API_URL } from '../App'

const THEMES = [
    'AI in Healthcare',
    'Generative AI & Creativity',
    'Computer Science Fundamentals',
    'AI in Education & Learning',
    'AI in Smart Cities'
]

export default function Register({ team, setTeam }) {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [errors, setErrors] = useState({})

    const [formData, setFormData] = useState({
        teamName: '',
        teamLeader: '',
        teamMembers: '',
        email: '',
        theme: ''
    })

    if (success) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="success-icon"><Check size={60} /></div>
                <h2 style={{ color: '#22c55e', marginBottom: '20px' }}>Registration Successful!</h2>
                <p style={{ fontSize: '1.1rem', marginBottom: '5px' }}>
                    Welcome to CodeHunt-2026, <strong>{formData.teamName}</strong>!
                </p>
                <p style={{ fontSize: '1rem', marginBottom: '20px', color: '#b3b3b3' }}>
                    Theme: {formData.theme}
                </p>
                <div style={{
                    display: 'inline-block',
                    padding: '25px 40px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '2px solid rgba(139, 92, 246, 0.5)',
                    borderRadius: '15px',
                    marginBottom: '20px',
                    maxWidth: '500px',
                    textAlign: 'left'
                }}>
                    <p style={{ color: '#a78bfa', fontFamily: 'Orbitron', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center' }}>
                        🧩 STAGE 1 RIDDLE - Find Your Next Location
                    </p>
                    <p style={{ color: '#e2e8f0', fontStyle: 'italic', lineHeight: '1.8', marginBottom: '15px' }}>
                        Where rules are read and justice taught,<br />
                        The number seven matters more than you thought.<br />
                        Safety stands silent, red and bright,<br />
                        Check just behind to find your next light.
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        <strong>Hinglish:</strong> Kanoon ki baatein, rules ka scene,<br />
                        Seven ka number makes it clean.<br />
                        Red safety guard jo corner mein khada,<br />
                        Uske peeche hi raaz hai pada.
                    </p>
                </div>
                <br />
                <p style={{ marginTop: '10px', color: '#FFD700' }}>Scan the Phase 1 QR code to continue.</p>
            </div>
        )
    }

    // If already registered
    if (team && team.teamId) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="success-icon"><Check size={60} /></div>
                <h2 style={{ color: '#22c55e', marginBottom: '20px' }}>Already Registered!</h2>
                <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>
                    Team <strong>{team.teamName}</strong> is registered.
                </p>
                <p style={{ color: '#FFD700' }}>Scan the Phase 1 QR code to continue.</p>
            </div>
        )
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.teamName.trim()) newErrors.teamName = 'Team name is required'
        if (!formData.teamLeader.trim()) newErrors.teamLeader = 'Team leader name is required'

        const members = formData.teamMembers.split(',').map(m => m.trim()).filter(m => m)
        if (members.length < 3 || members.length > 4) {
            newErrors.teamMembers = 'Must have 3-4 team members (comma-separated)'
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) newErrors.email = 'Invalid email format'

        if (!formData.theme) newErrors.theme = 'Please select a theme'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return

        setLoading(true)

        try {
            const res = await fetch(`${API_URL}/teams/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (!res.ok) {
                setErrors({ submit: data.error })
                setLoading(false)
                return
            }

            setTeam(data.team)
            setSuccess(true)
        } catch (err) {
            setErrors({ submit: 'Failed to connect to server. Make sure backend is running.' })
        }

        setLoading(false)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    return (
        <div className="container">
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Users size={50} style={{ color: '#FFD700', marginBottom: '15px' }} />
                    <h1>Team Registration</h1>
                    <p style={{ fontSize: '1.1rem', marginTop: '15px' }}>
                        Register your team for CodeHunt-2026
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="card">
                    <h3 style={{ marginBottom: '25px' }}>Team Details</h3>

                    {errors.submit && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
                            <AlertCircle size={18} style={{ marginRight: '10px', color: '#ef4444' }} />
                            {errors.submit}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Team Name *</label>
                        <input
                            type="text"
                            name="teamName"
                            className="form-input"
                            placeholder="Enter unique team name"
                            value={formData.teamName}
                            onChange={handleChange}
                        />
                        {errors.teamName && <p className="form-error">{errors.teamName}</p>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Team Leader Name *</label>
                        <input
                            type="text"
                            name="teamLeader"
                            className="form-input"
                            placeholder="Enter team leader's full name"
                            value={formData.teamLeader}
                            onChange={handleChange}
                        />
                        {errors.teamLeader && <p className="form-error">{errors.teamLeader}</p>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Team Members (3-4 members, comma-separated) *</label>
                        <input
                            type="text"
                            name="teamMembers"
                            className="form-input"
                            placeholder="e.g., John Doe, Jane Smith, Alex Johnson"
                            value={formData.teamMembers}
                            onChange={handleChange}
                        />
                        {errors.teamMembers && <p className="form-error">{errors.teamMembers}</p>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email / Contact *</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            placeholder="Enter email address"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {errors.email && <p className="form-error">{errors.email}</p>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Select Theme *</label>
                        <select
                            name="theme"
                            className="form-input"
                            value={formData.theme}
                            onChange={handleChange}
                            style={{
                                appearance: 'none',
                                cursor: 'pointer',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23FFD700' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 15px center',
                                paddingRight: '40px'
                            }}
                        >
                            <option value="" disabled>-- Choose a theme --</option>
                            {THEMES.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        {errors.theme && <p className="form-error">{errors.theme}</p>}
                    </div>

                    <button type="submit" className="btn btn-primary btn-large" disabled={loading} style={{ width: '100%', marginTop: '20px' }}>
                        {loading ? 'Registering...' : 'Register Team'}
                    </button>
                </form>
            </div>
        </div>
    )
}
