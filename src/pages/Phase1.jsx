import { useState } from 'react'
import { Sparkles, Check, AlertCircle, ImageIcon } from 'lucide-react'
import { API_URL } from '../App'

export default function Phase1({ team, setTeam }) {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [errors, setErrors] = useState({})

    const [formData, setFormData] = useState({
        driveLink: 'https://drive.google.com/drive/u/0/folders/1f8Xltto4DgaZB3YfnCiuncOqdUQs7Ffk',
        aiPrompt: ''
    })

    // Not registered
    if (!team || !team.teamId) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <AlertCircle size={60} style={{ color: '#FFD700', marginBottom: '20px' }} />
                <h2>Please Register First</h2>
                <p>You need to register your team before accessing Phase 1.</p>
            </div>
        )
    }

    // If already completed
    if (team.currentPhase > 1) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="success-icon">
                    <Check size={60} />
                </div>
                <h2 style={{ color: '#22c55e', marginBottom: '20px' }}>Phase 1 Completed!</h2>
                <p>You've already completed this phase.</p>
                <div style={{
                    display: 'inline-block',
                    padding: '20px 40px',
                    background: 'rgba(255, 215, 0, 0.1)',
                    border: '2px solid #FFD700',
                    borderRadius: '15px',
                    marginTop: '20px'
                }}>
                    <p style={{ color: '#FFD700', fontFamily: 'Orbitron', fontSize: '0.85rem', marginBottom: '8px' }}>
                        NEXT LOCATION
                    </p>
                    <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#fff' }}>Inside the Canteen Area</h2>
                </div>
            </div>
        )
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.aiPrompt.toUpperCase().includes('VU2050')) {
            newErrors.aiPrompt = 'Prompt must contain keyword "VU2050"'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return

        setLoading(true)

        try {
            const res = await fetch(`${API_URL}/phase1/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId: team.teamId,
                    driveLink: formData.driveLink,
                    aiPrompt: formData.aiPrompt
                })
            })

            const data = await res.json()

            if (!res.ok) {
                setErrors({ submit: data.error })
                setLoading(false)
                return
            }

            // Refresh team data
            const teamRes = await fetch(`${API_URL}/teams/${team.teamName}`)
            const teamData = await teamRes.json()

            if (teamRes.ok) setTeam(teamData)
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

    if (success) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="success-icon">
                    <Check size={60} />
                </div>
                <h2 style={{ color: '#22c55e', marginBottom: '20px' }}>Phase 1 Complete!</h2>
                <p>Great work, {team.teamName}!</p>
                <div style={{
                    display: 'inline-block',
                    padding: '20px 40px',
                    background: 'rgba(255, 215, 0, 0.1)',
                    border: '2px solid #FFD700',
                    borderRadius: '15px',
                    marginTop: '20px',
                    marginBottom: '20px'
                }}>
                    <p style={{ color: '#FFD700', fontFamily: 'Orbitron', fontSize: '0.85rem', marginBottom: '8px' }}>
                        NEXT LOCATION
                    </p>
                    <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#fff' }}>Inside the Canteen Area</h2>
                </div>
                <br />
                <p style={{ marginTop: '10px', color: '#FFD700' }}>Scan the next QR code to continue.</p>
            </div>
        )
    }

    return (
        <div className="container">
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Sparkles size={50} style={{ color: '#FFD700', marginBottom: '15px' }} />
                    <h1>Phase 1: AI Image Generation</h1>
                    <p style={{ fontSize: '1.1rem', marginTop: '15px' }}>
                        Create an AI-generated image showcasing
                    </p>
                    <h2 style={{ color: '#fff', marginTop: '10px' }}>"Vishwakarma University in 2050"</h2>
                    <p style={{ fontSize: '1rem', marginTop: '10px', color: '#a78bfa' }}>
                        Team: {team.teamName} | Theme: {team.theme}
                    </p>
                </div>

                {/* Instructions */}
                <div className="card" style={{ marginBottom: '30px' }}>
                    <h3 style={{ marginBottom: '15px' }}>
                        <ImageIcon size={20} style={{ marginRight: '10px' }} />
                        Instructions
                    </h3>
                    <ul style={{ paddingLeft: '20px', lineHeight: 2 }}>
                        <li>Use any AI tool: DALL-E, Midjourney, Stable Diffusion, Leonardo AI, etc.</li>
                        <li>Theme: Imagine VU campus in the year 2050 - futuristic, innovative, tech-forward</li>
                        <li>Upload your "VU IN 2050" image to the shared Google Drive folder below</li>
                        <li>Your prompt MUST contain the keyword "VU2050"</li>
                    </ul>
                </div>

                {/* Submission Form */}
                <form onSubmit={handleSubmit} className="card">
                    <h3 style={{ marginBottom: '25px' }}>Submit Your AI Image</h3>

                    {errors.submit && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
                            <AlertCircle size={18} style={{ marginRight: '10px', color: '#ef4444' }} />
                            {errors.submit}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Upload Your Generated Image Here *</label>
                        <a
                            href="https://drive.google.com/drive/u/0/folders/1f8Xltto4DgaZB3YfnCiuncOqdUQs7Ffk"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'block',
                                padding: '12px 20px',
                                background: 'rgba(96, 165, 250, 0.1)',
                                border: '1px solid #60a5fa',
                                borderRadius: '8px',
                                color: '#60a5fa',
                                textDecoration: 'none',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                fontSize: '1rem'
                            }}
                        >
                            Click Here to Upload Image to Google Drive
                        </a>
                    </div>

                    <div className="form-group">
                        <label className="form-label">AI Prompt Used (must contain "VU2050") *</label>
                        <textarea
                            name="aiPrompt"
                            className="form-textarea"
                            placeholder="Enter the exact prompt you used to generate your image..."
                            value={formData.aiPrompt}
                            onChange={handleChange}
                        />
                        {errors.aiPrompt && <p className="form-error">{errors.aiPrompt}</p>}
                        {formData.aiPrompt.toUpperCase().includes('VU2050') &&
                            <p className="form-success">✓ Contains VU2050 keyword</p>
                        }
                    </div>

                    <button type="submit" className="btn btn-primary btn-large" disabled={loading} style={{ width: '100%', marginTop: '20px' }}>
                        {loading ? 'Submitting...' : 'Submit Phase 1'}
                    </button>
                </form>
            </div>
        </div>
    )
}
