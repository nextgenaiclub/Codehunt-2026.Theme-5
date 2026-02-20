import { useState, useEffect } from 'react'
import { Brain, Check, X, AlertCircle, Sparkles, RotateCcw } from 'lucide-react'
import { API_URL } from '../App'

function HintPoem() {
    return (
        <>
            <p style={{ color: '#e2e8f0', fontStyle: 'italic', lineHeight: '1.8', marginBottom: '15px' }}>
                When hunger hits and crowds collide,<br />
                The biggest food stop stands with pride.<br />
                Near the number four, always alive,<br />
                Plates and plans here truly thrive.
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                <strong>Hinglish:</strong> Jab bhookh lage aur crowd ho tight,<br />
                Sabse badi canteen stays in sight.<br />
                Four ke paas jo hamesha alive,<br />
                Khana aur clues dono yahin survive.
            </p>
        </>
    )
}

export default function Phase5({ team, setTeam }) {
    const [riddles, setRiddles] = useState([])
    const [currentRiddle, setCurrentRiddle] = useState(0)
    const [answers, setAnswers] = useState({})
    const [textAnswer, setTextAnswer] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState(null)
    const [completed, setCompleted] = useState(false)
    const [failed, setFailed] = useState(false)
    const [failMessage, setFailMessage] = useState('')
    const [score, setScore] = useState(0)
    const [showClue, setShowClue] = useState(false)

    // Fetch riddles - MUST be before any conditional returns
    useEffect(() => {
        const fetchRiddles = async () => {
            try {
                const res = await fetch(`${API_URL}/phase5/riddles`)
                const data = await res.json()
                if (Array.isArray(data)) {
                    setRiddles(data)
                } else {
                    console.error('Invalid riddles data:', data)
                }
                setLoading(false)
            } catch (err) {
                console.error('Failed to load riddles')
                setLoading(false)
            }
        }
        fetchRiddles()
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

    if (completed) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="success-icon"><Sparkles size={60} /></div>
                <h2 style={{ color: '#22c55e', marginBottom: '20px' }}>Phase 5 Cleared!</h2>
                <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
                    You scored {score}/{riddles.length}. Great job!
                </p>

                {!showClue ? (
                    <button
                        onClick={() => setShowClue(true)}
                        className="btn btn-primary btn-large"
                        style={{ fontSize: '1.1rem', padding: '15px 40px' }}
                    >
                        Reveal Next Phase Clue
                    </button>
                ) : (
                    <>
                        <div style={{
                            maxWidth: '500px',
                            margin: '0 auto 30px',
                            padding: '25px 30px',
                            background: 'rgba(139, 92, 246, 0.1)',
                            border: '2px solid rgba(139, 92, 246, 0.4)',
                            borderRadius: '15px',
                            textAlign: 'left'
                        }}>
                            <p style={{ color: '#a78bfa', fontFamily: 'Orbitron', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center' }}>
                                FINAL CLUE
                            </p>
                            <HintPoem />
                        </div>
                        <p style={{ color: '#FFD700', fontSize: '1.1rem' }}>Solve the riddle, find the location, and scan the QR code to start Phase 6!</p>
                    </>
                )}
            </div>
        )
    }

    if (failed) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <X size={60} style={{ color: '#ef4444', marginBottom: '20px' }} />
                <h2 style={{ color: '#ef4444', marginBottom: '20px' }}>Phase 5 Not Passed</h2>
                <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                    You scored {score}/{riddles.length}.
                </p>
                <p style={{ fontSize: '1.1rem', marginBottom: '30px', color: '#b3b3b3' }}>
                    {failMessage}
                </p>
                <button
                    onClick={() => {
                        setFailed(false)
                        setAnswers({})
                        setCurrentRiddle(0)
                        setScore(0)
                        setTextAnswer('')
                        setResult(null)
                    }}
                    className="btn btn-primary btn-large"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', padding: '15px 40px' }}
                >
                    <RotateCcw size={20} /> Try Again
                </button>
            </div>
        )
    }

    if (team.currentPhase > 5) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="success-icon"><Check size={60} /></div>
                <h2 style={{ color: '#22c55e', marginBottom: '20px' }}>Phase 5 Completed!</h2>

                {!showClue ? (
                    <button
                        onClick={() => setShowClue(true)}
                        className="btn btn-primary btn-large"
                        style={{ fontSize: '1.1rem', padding: '15px 40px' }}
                    >
                        Reveal Next Phase Clue
                    </button>
                ) : (
                    <>
                        <div style={{
                            maxWidth: '500px',
                            margin: '0 auto 30px',
                            padding: '25px 30px',
                            background: 'rgba(139, 92, 246, 0.1)',
                            border: '2px solid rgba(139, 92, 246, 0.4)',
                            borderRadius: '15px',
                            textAlign: 'left'
                        }}>
                            <p style={{ color: '#a78bfa', fontFamily: 'Orbitron', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center' }}>
                                FINAL CLUE
                            </p>
                            <HintPoem />
                        </div>
                        <p style={{ color: '#FFD700', fontSize: '1.1rem' }}>Solve the riddle, find the location, and scan the QR code to start Phase 6!</p>
                    </>
                )}
            </div>
        )
    }

    if (team.currentPhase < 5) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <AlertCircle size={60} style={{ color: '#FFD700', marginBottom: '20px' }} />
                <h2>Phase Locked</h2>
                <p>Complete the previous phase first.</p>
            </div>
        )
    }

    const checkAnswer = async (answer) => {
        if (submitting) return
        setSubmitting(true)

        const riddle = riddles[currentRiddle]
        try {
            const res = await fetch(`${API_URL}/phase5/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId: team.teamId,
                    riddleId: riddle.id,
                    answer: answer
                })
            })
            const data = await res.json()

            const updatedAnswers = {
                ...answers,
                [riddle.id]: { answer, correct: data.correct }
            }
            setAnswers(updatedAnswers)

            if (data.correct) {
                setScore(prev => prev + 1)
            }

            // Move to next after brief delay
            setTimeout(() => {
                if (currentRiddle < riddles.length - 1) {
                    setCurrentRiddle(curr => curr + 1)
                    setTextAnswer('')
                } else {
                    submitPhaseCompletion(updatedAnswers)
                }
                setSubmitting(false)
            }, 1000)

        } catch (err) {
            console.error('Answer check failed', err)
            setSubmitting(false)
        }
    }

    const submitPhaseCompletion = async (allAnswers) => {
        try {
            const res = await fetch(`${API_URL}/phase5/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId: team.teamId,
                    answers: allAnswers
                })
            })

            const data = await res.json()
            if (data.success) {
                setScore(data.score)
                setCompleted(true)
                // Refresh team data
                const teamRes = await fetch(`${API_URL}/teams/${team.teamName}`)
                const teamData = await teamRes.json()
                setTeam(teamData)
            } else {
                setScore(data.score || 0)
                setFailMessage(data.message || 'All challenges must be correct to pass. Try again!')
                setFailed(true)
            }
        } catch (err) {
            console.error('Completion failed', err)
        }
    }

    const handleTextSubmit = (e) => {
        e.preventDefault()
        if (!textAnswer.trim()) return
        checkAnswer(textAnswer)
    }

    if (loading) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="spinner" />
                <p>Loading challenges...</p>
            </div>
        )
    }

    if (riddles.length === 0) return null

    const riddle = riddles[currentRiddle]

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <Brain size={50} style={{ color: '#FFD700', marginBottom: '15px' }} />
                <h1>Phase 5: The Mental Gym</h1>
                <p style={{ fontSize: '1.2rem', marginTop: '10px' }}>
                    Challenge {currentRiddle + 1} of {riddles.length}
                </p>

                {/* Progress Bar */}
                <div style={{
                    width: '100%',
                    height: '6px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '3px',
                    margin: '20px auto',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${((currentRiddle) / riddles.length) * 100}%`,
                        height: '100%',
                        background: '#FFD700',
                        transition: 'width 0.3s ease'
                    }} />
                </div>
            </div>

            <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ marginBottom: '30px' }}>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.8', whiteSpace: 'pre-line', fontFamily: 'monospace' }}>{riddle.riddle}</p>
                </div>

                {riddle.type === 'mcq' ? (
                    <div className="quiz-options">
                        {riddle.options.map((option, idx) => (
                            <button
                                key={idx}
                                className={`quiz-option ${submitting && answers[riddle.id]?.answer === idx ?
                                    (answers[riddle.id]?.correct ? 'correct' : 'wrong') : ''
                                    }`}
                                onClick={() => checkAnswer(idx)}
                                disabled={submitting || answers[riddle.id]}
                                style={{
                                    width: '100%',
                                    padding: '15px 20px',
                                    marginBottom: '12px',
                                    textAlign: 'left',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '10px',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    fontSize: '1.1rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.2s ease',
                                    fontFamily: 'inherit'
                                }}
                                onMouseEnter={(e) => {
                                    if (!answers[riddle.id]) {
                                        e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                                        e.currentTarget.style.borderColor = '#FFD700';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!answers[riddle.id]) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    }
                                }}
                            >
                                {option}
                                {answers[riddle.id]?.answer === idx && (
                                    answers[riddle.id].correct ?
                                        <Check size={20} color="#22c55e" /> :
                                        <X size={20} color="#ef4444" />
                                )}
                            </button>
                        ))}
                    </div>
                ) : (
                    <form onSubmit={handleTextSubmit}>
                        <div className="form-group">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Type your answer..."
                                value={textAnswer}
                                onChange={(e) => setTextAnswer(e.target.value)}
                                disabled={submitting || answers[riddle.id]}
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting || !textAnswer.trim() || answers[riddle.id]}
                        >
                            {submitting ? 'Checking...' : 'Submit Answer'}
                        </button>
                    </form>
                )}

                {/* Feedback Overlay */}
                {answers[riddle.id] && (
                    <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        borderRadius: '8px',
                        background: answers[riddle.id].correct ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        border: `1px solid ${answers[riddle.id].correct ? '#22c55e' : '#ef4444'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        {answers[riddle.id].correct ? (
                            <>
                                <Check size={20} color="#22c55e" />
                                <span style={{ color: '#22c55e' }}>Correct! Moving to next...</span>
                            </>
                        ) : (
                            <>
                                <X size={20} color="#ef4444" />
                                <span style={{ color: '#ef4444' }}>Incorrect. Moving to next...</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Answer History Circles */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '30px' }}>
                {riddles.map((r, i) => (
                    <div key={i} style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: answers[r.id] ?
                            (answers[r.id].correct ? '#22c55e' : '#ef4444') :
                            (i === currentRiddle ? '#FFD700' : 'rgba(255,255,255,0.2)'),
                        boxShadow: i === currentRiddle ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none'
                    }} />
                ))}
            </div>
        </div>
    )
}
