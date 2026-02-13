import { useState, useEffect, useRef } from 'react'
import { Target, Clock, Check, X, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react'
import { API_URL } from '../App'

export default function Phase2({ team, setTeam }) {
    const [questions, setQuestions] = useState([])
    const [currentQ, setCurrentQ] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState(null)
    const [feedback, setFeedback] = useState(null) // { correct: true/false }
    const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
    const [loading, setLoading] = useState(true)
    const [timedOut, setTimedOut] = useState(false)
    const [completed, setCompleted] = useState(false)
    const [error, setError] = useState('')
    const timerRef = useRef(null)

    // Fetch questions
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await fetch(`${API_URL}/phase2/questions`)
                const data = await res.json()
                if (Array.isArray(data)) {
                    setQuestions(data)
                }
            } catch (err) {
                console.error('Failed to load questions')
            }
            setLoading(false)
        }
        fetchQuestions()
    }, [])

    // Timer
    useEffect(() => {
        if (loading || timedOut || completed) return

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current)
                    setTimedOut(true)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timerRef.current)
    }, [loading, timedOut, completed])

    // Handle answer selection and validation
    const handleCheckAnswer = async () => {
        if (selectedAnswer === null || feedback) return

        try {
            const res = await fetch(`${API_URL}/phase2/check-answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId: team?.teamId,
                    questionIndex: currentQ,
                    answer: selectedAnswer
                })
            })
            const data = await res.json()

            if (data.correct) {
                setFeedback({ correct: true })
                // If last question, mark completed
                if (currentQ === questions.length - 1) {
                    // Submit completion to server
                    const completeRes = await fetch(`${API_URL}/phase2/complete`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ teamId: team?.teamId })
                    })
                    const completeData = await completeRes.json()
                    if (completeData.success) {
                        setCompleted(true)
                        clearInterval(timerRef.current)
                        // Refresh team data
                        const teamRes = await fetch(`${API_URL}/teams/${team.teamName}`)
                        const teamData = await teamRes.json()
                        setTeam(teamData)
                    }
                }
            } else {
                setFeedback({ correct: false })
            }
        } catch (err) {
            console.error('Check answer error:', err)
            setError('Failed to check answer')
        }
    }

    const handleNext = () => {
        if (feedback?.correct && currentQ < questions.length - 1) {
            setCurrentQ(prev => prev + 1)
            setSelectedAnswer(null)
            setFeedback(null)
        }
    }

    const handleRetryQuestion = () => {
        setSelectedAnswer(null)
        setFeedback(null)
    }

    const handleRestart = () => {
        window.location.reload()
    }

    // Redirect checks
    if (!team) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <AlertCircle size={60} style={{ color: '#FFD700', marginBottom: '20px' }} />
                <h2>Please Register First</h2>
                <p>You need to complete Phase 1 before accessing this phase.</p>
            </div>
        )
    }

    if (!completed && team.currentPhase > 2) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="success-icon"><Check size={60} /></div>
                <h2 style={{ color: '#22c55e', marginBottom: '20px' }}>Phase 2 Completed!</h2>
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
                    <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#fff' }}>Room 2101 and Room 2102 Labs</h2>
                </div>
            </div>
        )
    }

    if (!completed && team.currentPhase < 2) {
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

    if (error) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <AlertCircle size={60} style={{ color: '#ef4444', marginBottom: '20px' }} />
                <h2 style={{ color: '#ef4444', marginBottom: '20px' }}>Error</h2>
                <p style={{ marginBottom: '30px' }}>{error}</p>
                <button onClick={() => window.location.reload()} className="btn btn-primary">Try Again</button>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="spinner" />
                <p>Loading questions...</p>
            </div>
        )
    }

    if (questions.length === 0) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <AlertCircle size={60} style={{ color: '#ef4444', marginBottom: '20px' }} />
                <h2>No Questions Available</h2>
                <p>Unable to load questions. Please refresh.</p>
                <button onClick={() => window.location.reload()} className="btn btn-primary">Refresh Page</button>
            </div>
        )
    }

    // TIME'S UP screen
    if (timedOut) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <Clock size={80} style={{ color: '#ef4444', marginBottom: '20px' }} />
                <h1 style={{ color: '#ef4444', marginBottom: '15px', fontFamily: 'Orbitron' }}>TIME'S UP!</h1>
                <p style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#ccc' }}>
                    You ran out of time. You answered {currentQ} out of {questions.length} questions.
                </p>
                <p style={{ marginBottom: '30px', color: '#FFD700' }}>
                    You must restart the quiz to try again. You'll get a fresh 5 minutes.
                </p>
                <button onClick={handleRestart} className="btn btn-primary btn-large">
                    <RotateCcw size={20} /> Restart Quiz
                </button>
            </div>
        )
    }

    // COMPLETED screen
    if (completed) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="success-icon"><Check size={80} /></div>
                <h1 style={{ color: '#22c55e', marginBottom: '15px', fontFamily: 'Orbitron' }}>Phase 2 Complete!</h1>
                <p style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#ccc' }}>
                    You answered all {questions.length} questions correctly!
                </p>
                <p style={{ marginBottom: '30px', color: '#FFD700' }}>
                    Time remaining: {formatTime(timeLeft)}
                </p>
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
                        📍 NEXT LOCATION
                    </p>
                    <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#fff' }}>Room 2101 and Room 2102 Labs</h2>
                </div>
                <br />
                <p style={{ color: '#FFD700', fontSize: '1.1rem' }}>Scan the next QR code to continue.</p>
            </div>
        )
    }

    // QUIZ screen
    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <Target size={50} style={{ color: '#FFD700', marginBottom: '15px' }} />
                <h1>Phase 2: CS Fundamentals Quiz</h1>
                <p style={{ fontSize: '1rem', marginTop: '10px', color: '#FFD700' }}>
                    Theme: Computer Science Fundamentals
                </p>
                <p style={{ fontSize: '0.9rem', marginTop: '5px', color: '#ccc' }}>
                    Answer each question correctly to proceed. Wrong answers must be retried.
                </p>
            </div>

            {/* Timer & Progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                <div className={`timer ${timeLeft < 60 ? 'warning' : ''}`}>
                    <Clock size={24} style={{ marginRight: '10px' }} />
                    {formatTime(timeLeft)}
                </div>
                <div style={{ fontFamily: 'Orbitron', color: '#FFD700' }}>
                    Question {currentQ + 1} / {questions.length}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-container">
                <div className="progress-bar" style={{ width: `${(currentQ / questions.length) * 100}%` }} />
            </div>

            {/* Question Card */}
            {questions[currentQ] && (
                <div className="quiz-question" style={{
                    borderColor: feedback ? (feedback.correct ? '#22c55e' : '#ef4444') : undefined
                }}>
                    <div className="quiz-question-number">Question {currentQ + 1}</div>
                    <p className="quiz-question-text">{questions[currentQ].question}</p>
                    <div className="quiz-options">
                        {questions[currentQ].options.map((opt, i) => (
                            <div
                                key={i}
                                className={`quiz-option ${selectedAnswer === i ? 'selected' : ''} ${
                                    feedback && selectedAnswer === i
                                        ? (feedback.correct ? 'correct' : 'incorrect')
                                        : ''
                                }`}
                                onClick={() => {
                                    if (!feedback) setSelectedAnswer(i)
                                }}
                                style={{
                                    cursor: feedback ? 'not-allowed' : 'pointer',
                                    opacity: feedback && selectedAnswer !== i ? 0.5 : 1
                                }}
                            >
                                <span className="quiz-radio" />
                                <span className="quiz-option-text">{opt}</span>
                                {feedback && selectedAnswer === i && feedback.correct && (
                                    <Check size={20} style={{ marginLeft: 'auto', color: '#22c55e' }} />
                                )}
                                {feedback && selectedAnswer === i && !feedback.correct && (
                                    <X size={20} style={{ marginLeft: 'auto', color: '#ef4444' }} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '30px' }}>
                {!feedback && (
                    <button
                        onClick={handleCheckAnswer}
                        className="btn btn-primary"
                        disabled={selectedAnswer === null}
                    >
                        Submit Answer <Check size={20} />
                    </button>
                )}

                {feedback && !feedback.correct && (
                    <button onClick={handleRetryQuestion} className="btn btn-primary">
                        <RotateCcw size={20} /> Try Again
                    </button>
                )}

                {feedback && feedback.correct && currentQ < questions.length - 1 && (
                    <button onClick={handleNext} className="btn btn-primary">
                        Next Question <ArrowRight size={20} />
                    </button>
                )}
            </div>

            {/* Feedback Message */}
            {feedback && (
                <div style={{
                    textAlign: 'center',
                    marginTop: '20px',
                    padding: '15px',
                    borderRadius: '10px',
                    background: feedback.correct ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${feedback.correct ? '#22c55e' : '#ef4444'}`
                }}>
                    <p style={{
                        color: feedback.correct ? '#22c55e' : '#ef4444',
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                    }}>
                        {feedback.correct ? 'Correct! Well done!' : 'Incorrect! Try again.'}
                    </p>
                </div>
            )}

            {/* Question Indicators */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '30px' }}>
                {questions.map((_, i) => (
                    <div
                        key={i}
                        style={{
                            width: '40px', height: '40px', borderRadius: '8px', border: 'none',
                            background: i < currentQ ? '#22c55e' : i === currentQ ? '#FFD700' : '#2a2a2a',
                            color: i <= currentQ ? '#000' : '#fff',
                            fontWeight: 'bold',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.9rem'
                        }}
                    >
                        {i < currentQ ? <Check size={16} /> : i + 1}
                    </div>
                ))}
            </div>
        </div>
    )
}
