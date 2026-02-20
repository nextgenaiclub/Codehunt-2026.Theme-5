import { useState, useEffect } from 'react'
import { Bug, Check, AlertCircle, Lightbulb, Key } from 'lucide-react'
import { API_URL } from '../App'

export default function Phase4({ team, setTeam }) {
    const [code, setCode] = useState('')
    const [answer, setAnswer] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState(null)
    const [attempts, setAttempts] = useState(0)
    const [hint, setHint] = useState(null)

    // Fetch code - MUST be before any conditional returns (React hooks rule)
    useEffect(() => {
        const fetchCode = async () => {
            try {
                const res = await fetch(`${API_URL}/phase4/code`)
                const data = await res.json()
                if (data.code) {
                    setCode(data.code)
                    setLoading(false)
                } else {
                    console.error('Invalid code data:', data)
                    setLoading(false)
                }
            } catch (err) {
                console.error('Failed to load code')
                setLoading(false)
            }
        }
        fetchCode()
    }, [])

    // Redirect checks
    if (!team) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <AlertCircle size={60} style={{ color: '#FFD700', marginBottom: '20px' }} />
                <h2>Please Register First</h2>
            </div>
        )
    }

    if (result?.success) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="success-icon"><Key size={60} /></div>
                <h2 style={{ color: '#22c55e', marginBottom: '20px' }}>Code Debugged Successfully!</h2>
                <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
                    You fixed all the bugs and found the correct output!
                </p>
                <div style={{
                    display: 'inline-block',
                    padding: '30px 50px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '3px solid rgba(139, 92, 246, 0.5)',
                    borderRadius: '20px',
                    marginBottom: '40px',
                    maxWidth: '550px',
                    textAlign: 'left'
                }}>
                    <p style={{ color: '#a78bfa', fontFamily: 'Orbitron', fontSize: '0.9rem', marginBottom: '15px', textAlign: 'center' }}>
                        🧩 STAGE 5 RIDDLE - Find Your Next Location
                    </p>
                    <p style={{ color: '#e2e8f0', fontStyle: 'italic', lineHeight: '1.8', marginBottom: '15px', fontSize: '1.1rem' }}>
                        Walk past the slope, take a steady climb,<br />
                        Where green ideas met management in time.<br />
                        A wall that shows the campus name,<br />
                        Look near the symbol of college fame.
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        <strong>Hinglish:</strong> Slope cross karke thoda aage jao,<br />
                        Management aur eco ka combo pao.<br />
                        Deewar pe jahan college ka sign,<br />
                        Logo ke paas milega tumhara next line.
                    </p>
                </div>
                <br />
                <p style={{ color: '#FFD700', fontSize: '1.1rem' }}>Scan the next QR code to continue.</p>
            </div>
        )
    }

    if (team.currentPhase > 4) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="success-icon"><Check size={60} /></div>
                <h2 style={{ color: '#22c55e', marginBottom: '20px' }}>Phase 4 Completed!</h2>
                <div style={{
                    display: 'inline-block',
                    padding: '25px 40px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '2px solid rgba(139, 92, 246, 0.5)',
                    borderRadius: '15px',
                    marginTop: '20px',
                    maxWidth: '500px',
                    textAlign: 'left'
                }}>
                    <p style={{ color: '#a78bfa', fontFamily: 'Orbitron', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center' }}>
                        🧩 STAGE 5 RIDDLE - Find Your Next Location
                    </p>
                    <p style={{ color: '#e2e8f0', fontStyle: 'italic', lineHeight: '1.8', marginBottom: '15px' }}>
                        Walk past the slope, take a steady climb,<br />
                        Where green ideas met management in time.<br />
                        A wall that shows the campus name,<br />
                        Look near the symbol of college fame.
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        <strong>Hinglish:</strong> Slope cross karke thoda aage jao,<br />
                        Management aur eco ka combo pao.<br />
                        Deewar pe jahan college ka sign,<br />
                        Logo ke paas milega tumhara next line.
                    </p>
                </div>
            </div>
        )
    }

    if (team.currentPhase < 4) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <AlertCircle size={60} style={{ color: '#FFD700', marginBottom: '20px' }} />
                <h2>Phase Locked</h2>
                <p>Complete the previous phase first.</p>
            </div>
        )
    }

    const handleSubmit = async () => {
        if (!answer.trim()) return

        setSubmitting(true)

        try {
            const res = await fetch(`${API_URL}/phase4/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId: team.teamId, answer })
            })
            const data = await res.json()

            if (!res.ok) {
                if (data.error === 'Not on Phase 4' || data.error?.includes('completed')) {
                    const teamRes = await fetch(`${API_URL}/teams/${team.teamName}`)
                    if (teamRes.ok) {
                        const teamData = await teamRes.json()
                        setTeam(teamData)
                        return
                    }
                }

                setResult({ success: false, message: data.error || 'Submission failed' })
                if (data.attempts) setAttempts(data.attempts)
                setSubmitting(false)
                return
            }

            if (data.correct) {
                setResult({ success: true, message: data.message })
                const teamRes = await fetch(`${API_URL}/teams/${team.teamName}`)
                const teamData = await teamRes.json()
                setTeam(teamData)
            } else {
                setResult({ success: false, message: data.message })
                setAttempts(data.attempts)
                if (data.hint) setHint(data.hint)
            }
        } catch (err) {
            setResult({ success: false, message: 'Failed to submit' })
        }

        setSubmitting(false)
    }

    const highlightCode = (codeStr) => {
        return codeStr
            .replace(/(".*?")/g, '<span class="code-string">$1</span>')
            .replace(/(\d+)/g, '<span class="code-number">$1</span>')
            .replace(/(\/\/.*)/g, '<span class="code-comment">$1</span>')
    }

    if (loading) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="spinner" />
                <p>Loading challenge...</p>
            </div>
        )
    }

    return (
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <Bug size={50} style={{ color: '#FFD700', marginBottom: '15px' }} />
                <h1>Phase 4: Debug & Discover</h1>
                <p style={{ fontSize: '1.1rem', marginTop: '10px' }}>
                    Fix the bugs to reveal the Room Number
                </p>
            </div>

            <div className="card" style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px' }}>
                    <Bug size={20} style={{ marginRight: '10px' }} />
                    Buggy C Program
                </h3>
                <p style={{ marginBottom: '20px' }}>
                    This code contains <strong style={{ color: '#FFD700' }}>3 bugs</strong>.
                    Find them, fix them mentally, and determine the correct output of the fixed code.
                </p>

                <div className="code-block" style={{ marginBottom: '0' }}>
                    <pre className="code-content" dangerouslySetInnerHTML={{ __html: highlightCode(code) }} />
                </div>
            </div>

            {/* Hint Box */}
            {hint && (
                <div className="hint-box">
                    <div className="hint-box-title">
                        <Lightbulb size={18} style={{ marginRight: '8px' }} />
                        Hint
                    </div>
                    <p className="hint-box-text">{hint}</p>
                </div>
            )}

            {/* Answer Input */}
            <div className="card">
                <h3 style={{ marginBottom: '20px' }}>
                    <Key size={20} style={{ marginRight: '10px' }} />
                    Enter the Correct Output
                </h3>

                {result && !result.success && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        padding: '15px',
                        marginBottom: '20px'
                    }}>
                        <AlertCircle size={18} style={{ marginRight: '10px', color: '#ef4444' }} />
                        {result.message} (Attempt {attempts})
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label">Output</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Enter the correct output"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        style={{ maxWidth: '300px' }}
                    />
                </div>

                <button onClick={handleSubmit} className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Checking...' : 'Submit Answer'}
                </button>
            </div>

            {/* Bug Types to Look For */}
            <div className="card" style={{ marginTop: '30px' }}>
                <h3 style={{ marginBottom: '15px' }}>Common Bug Types</h3>
                <ul style={{ paddingLeft: '20px', lineHeight: 2 }}>
                    <li>Syntax errors (missing punctuation)</li>
                    <li>Logic errors (wrong operators)</li>
                    <li>Semantic errors (incorrect comparisons)</li>
                </ul>
            </div>
        </div>
    )
}
