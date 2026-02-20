import { useState, useEffect, useCallback } from 'react'
import { Code, Clock, Check, X, AlertCircle, RotateCcw } from 'lucide-react'
import { API_URL } from '../App'

export default function Phase3({ team, setTeam }) {
    const [questions, setQuestions] = useState([])
    const [answers, setAnswers] = useState({})
    const [timeLeft, setTimeLeft] = useState(480) // 8 minutes
    const [loading, setLoading] = useState(true)
    const [submitted, setSubmitted] = useState(false)
    const [results, setResults] = useState(null)

    // All hooks MUST be before any conditional returns (React hooks rule)
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await fetch(`${API_URL}/phase3/questions`)
                const data = await res.json()
                if (Array.isArray(data)) {
                    setQuestions(data)
                } else {
                    console.error('Invalid questions format', data)
                }
                setLoading(false)
            } catch (err) {
                console.error('Failed to load questions')
                setLoading(false)
            }
        }
        fetchQuestions()
    }, [])

    const handleSubmit = useCallback(async () => {
        if (submitted) return
        setSubmitted(true)
        setLoading(true)

        const answersArray = questions.map((_, i) => answers[i] ?? -1)

        try {
            const res = await fetch(`${API_URL}/phase3/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId: team?.teamId, answers: answersArray })
            })
            const data = await res.json()

            if (!res.ok) {
                console.error('Submit error:', data.error)
                setSubmitted(false)
                setLoading(false)
                return
            }

            setResults(data)

            if (data.passed) {
                try {
                    const teamRes = await fetch(`${API_URL}/teams/${team.teamName}`)
                    const teamData = await teamRes.json()
                    if (teamRes.ok) {
                        setTeam(teamData)
                    }
                } catch (e) {
                    console.error('Failed to refresh team')
                }
            }
        } catch (err) {
            console.error('Submit failed:', err)
            setSubmitted(false)
        }
        setLoading(false)
    }, [answers, questions, team, submitted, setTeam])

    useEffect(() => {
        if (submitted || loading) return
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleSubmit()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [submitted, loading, handleSubmit])

    // Redirect checks
    if (!team) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <AlertCircle size={60} style={{ color: '#FFD700', marginBottom: '20px' }} />
                <h2>Please Register First</h2>
            </div>
        )
    }

    if (!results && team.currentPhase > 3) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="success-icon"><Check size={60} /></div>
                <h2 style={{ color: '#22c55e', marginBottom: '20px' }}>Phase 3 Completed!</h2>
                <div style={{
                    display: 'inline-block',
                    padding: '20px 40px',
                    background: 'rgba(255, 215, 0, 0.1)',
                    border: '2px solid #FFD700',
                    borderRadius: '15px',
                    marginTop: '20px'
                }}>
                    <p style={{ color: '#FFD700', fontFamily: 'Orbitron', fontSize: '0.85rem', marginBottom: '8px' }}>
                        📍 NEXT LOCATION
                    </p>
                    <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#fff' }}>Room 2101 and 2102 Labs</h2>
                </div>
            </div>
        )
    }

    if (!results && team.currentPhase < 3) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <AlertCircle size={60} style={{ color: '#FFD700', marginBottom: '20px' }} />
                <h2>Phase Locked</h2>
                <p>Complete the previous phase first.</p>
            </div>
        )
    }

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const highlightCode = (code) => {
        return code
            .replace(/(".*?")/g, '<span class="code-string">$1</span>')
            .replace(/(\d+)/g, '<span class="code-number">$1</span>')
    }

    if (loading && !results) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="spinner" />
                <p>Loading code challenges...</p>
            </div>
        )
    }

    if (!loading && !results && questions.length === 0) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <AlertCircle size={60} style={{ color: '#ef4444', marginBottom: '20px' }} />
                <h2>No Questions Available</h2>
                <p>Unable to load questions. Please refresh or contact support.</p>
                <button onClick={() => window.location.reload()} className="btn btn-primary">Refresh Page</button>
            </div>
        )
    }

    if (results) {
        return (
            <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div className="score-circle" style={{ '--score': (results.score || 0) * 2 }}>
                        <span className="score-number">{results.score || 0}/5</span>
                    </div>

                    {results.passed ? (
                        <>
                            <h2 style={{ color: '#22c55e', marginBottom: '20px' }}>Excellent! You Passed!</h2>
                            <p style={{ marginBottom: '30px' }}>You scored {results.score}/5 (minimum 3 required)</p>
                        </>
                    ) : (
                        <>
                            <h2 style={{ color: '#ef4444', marginBottom: '20px' }}>Not Quite!</h2>
                            <p style={{ marginBottom: '30px' }}>You scored {results.score}/5 (need 3 to pass)</p>
                        </>
                    )}
                </div>

                {results.questions && results.results && (
                    <>
                        <h3 style={{ marginBottom: '20px' }}>Your Results</h3>
                        {results.questions.map((q, i) => (
                            <div key={q.id} className="quiz-question" style={{
                                borderColor: results.results[i]?.isCorrect ? '#22c55e' : '#ef4444'
                            }}>
                                <div className="quiz-question-number">Question {i + 1}</div>
                                <div className="code-block">
                                    <pre className="code-content" dangerouslySetInnerHTML={{ __html: highlightCode(q.code) }} />
                                </div>
                                {q.question && <p style={{ color: '#FFD700', marginBottom: '15px' }}>{q.question}</p>}
                                <p style={{
                                    color: results.results[i]?.isCorrect ? '#22c55e' : '#ef4444',
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem'
                                }}>
                                    {results.results[i]?.isCorrect ? 'Correct' : 'Incorrect'}
                                </p>
                            </div>
                        ))}
                    </>
                )}

                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    {results.passed ? (
                        <>
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
                                <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#fff' }}>Room 2101 and 2102 Labs</h2>
                            </div>
                            <br />
                            <p style={{ color: '#FFD700', fontSize: '1.1rem' }}>Scan the next QR code to continue.</p>
                        </>
                    ) : (
                        <div style={{ marginTop: '20px' }}>
                            <p style={{ color: '#ef4444', marginBottom: '15px' }}>
                                You need at least 3 correct answers to proceed.
                            </p>
                            <button
                                onClick={() => {
                                    setResults(null)
                                    setSubmitted(false)
                                    setAnswers({})
                                    setTimeLeft(480)
                                }}
                                className="btn btn-secondary"
                            >
                                <RotateCcw size={18} style={{ marginRight: '8px' }} />
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <Code size={50} style={{ color: '#FFD700', marginBottom: '15px' }} />
                <h1>Phase 3: Code Output Prediction</h1>
                <p style={{ fontSize: '1.1rem', marginTop: '10px' }}>Analyze the logic and predict the output</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div className={`timer ${timeLeft < 120 ? 'warning' : ''}`}>
                    <Clock size={24} style={{ marginRight: '10px' }} />
                    {formatTime(timeLeft)}
                </div>
                <div style={{ fontFamily: 'Orbitron', color: '#FFD700' }}>
                    {Object.keys(answers).length} / {questions.length} Answered
                </div>
            </div>

            {questions.map((q, i) => (
                <div key={q.id} className="quiz-question">
                    <div className="quiz-question-number">Question {i + 1}</div>
                    <div className="code-block">
                        <pre className="code-content" dangerouslySetInnerHTML={{ __html: highlightCode(q.code) }} />
                    </div>
                    {q.question && <p style={{ color: '#FFD700', marginBottom: '15px' }}>{q.question}</p>}
                    <div className="quiz-options">
                        {q.options.map((opt, j) => (
                            <div
                                key={j}
                                className={`quiz-option ${answers[i] === j ? 'selected' : ''}`}
                                onClick={() => setAnswers(prev => ({ ...prev, [i]: j }))}
                            >
                                <span className="quiz-radio" />
                                <span className="quiz-option-text">{opt}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <button onClick={handleSubmit} className="btn btn-primary btn-large">
                    Submit All Answers <Check size={20} />
                </button>
            </div>
        </div>
    )
}
