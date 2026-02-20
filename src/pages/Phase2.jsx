import { useState, useEffect, useRef } from 'react'
import { Target, Clock, Check, X, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react'
import { API_URL } from '../App'

export default function Phase2({ team, setTeam }) {
    const [questions, setQuestions] = useState([])
    const [currentQ, setCurrentQ] = useState(0)
    const [answers, setAnswers] = useState({})
    const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
    const [loading, setLoading] = useState(true)
    const [timedOut, setTimedOut] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [results, setResults] = useState(null)
    const [completed, setCompleted] = useState(false)
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
        if (loading || timedOut || completed || results) return

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
    }, [loading, timedOut, completed, results])

    // Submit all answers to backend
    const handleSubmitAll = async () => {
        if (submitting) return
        setSubmitting(true)
        clearInterval(timerRef.current)

        const answersArray = questions.map((_, i) => answers[i] ?? -1)

        try {
            const res = await fetch(`${API_URL}/phase2/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId: team?.teamId, answers: answersArray })
            })
            const data = await res.json()

            if (!res.ok) {
                console.error('Submit error:', data.error)
                setSubmitting(false)
                return
            }

            setResults(data)

            if (data.passed) {
                setCompleted(true)
                try {
                    const teamRes = await fetch(`${API_URL}/teams/${team.teamName}`)
                    const teamData = await teamRes.json()
                    if (teamRes.ok) setTeam(teamData)
                } catch (e) {
                    console.error('Team refresh failed:', e)
                }
            }
        } catch (err) {
            console.error('Submit failed:', err)
        }
        setSubmitting(false)
    }

    const handleSelectAnswer = (optionIndex) => {
        if (results) return
        setAnswers(prev => ({ ...prev, [currentQ]: optionIndex }))
    }

    const handleNext = () => {
        if (currentQ < questions.length - 1) {
            setCurrentQ(prev => prev + 1)
        }
    }

    const handlePrev = () => {
        if (currentQ > 0) {
            setCurrentQ(prev => prev - 1)
        }
    }

    const handleRetry = () => {
        setResults(null)
        setAnswers({})
        setCurrentQ(0)
        setSubmitting(false)
        setTimeLeft(300)
        setTimedOut(false)
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

    if (!completed && !results && team.currentPhase > 2) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="success-icon"><Check size={60} /></div>
                <h2 style={{ color: '#22c55e', marginBottom: '20px' }}>Phase 2 Completed!</h2>
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
                        🧩 STAGE 3 RIDDLE - Find Your Next Location
                    </p>
                    <p style={{ color: '#e2e8f0', fontStyle: 'italic', lineHeight: '1.8', marginBottom: '15px' }}>
                        One ball, one hoop, one place to score,<br />
                        Echoes of bounce on the open floor.<br />
                        No nets of books, just aim and run,<br />
                        Find the code where the matches are won.
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        <strong>Hinglish:</strong> Ek ball, ek hoop, ek hi court,<br />
                        Bounce ki awaaz ka hota hai report.<br />
                        Books nahi, bas focus aur shot,<br />
                        Game wali jagah pe milega next plot.
                    </p>
                </div>
            </div>
        )
    }

    if (!completed && !results && team.currentPhase < 2) {
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
                    You ran out of time. You answered {Object.keys(answers).length} out of {questions.length} questions.
                </p>
                <p style={{ marginBottom: '30px', color: '#FFD700' }}>
                    You must restart the quiz to try again.
                </p>
                <button onClick={handleRetry} className="btn btn-primary btn-large" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                    <RotateCcw size={20} /> Restart Quiz
                </button>
            </div>
        )
    }

    // RESULTS screen (after submission)
    if (results) {
        const wrongQuestions = results.results.filter(r => !r.isCorrect)
        const wrongCount = wrongQuestions.length

        if (results.passed) {
            return (
                <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div className="success-icon"><Check size={80} /></div>
                    <h1 style={{ color: '#22c55e', marginBottom: '15px', fontFamily: 'Orbitron' }}>Phase 2 Complete!</h1>
                    <p style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#ccc' }}>
                        You answered all {results.total} questions correctly!
                    </p>
                    <div style={{
                        display: 'inline-block',
                        padding: '25px 40px',
                        background: 'rgba(139, 92, 246, 0.1)',
                        border: '2px solid rgba(139, 92, 246, 0.5)',
                        borderRadius: '15px',
                        marginTop: '20px',
                        marginBottom: '20px',
                        maxWidth: '500px',
                        textAlign: 'left'
                    }}>
                        <p style={{ color: '#a78bfa', fontFamily: 'Orbitron', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center' }}>
                            🧩 STAGE 3 RIDDLE - Find Your Next Location
                        </p>
                        <p style={{ color: '#e2e8f0', fontStyle: 'italic', lineHeight: '1.8', marginBottom: '15px' }}>
                            One ball, one hoop, one place to score,<br />
                            Echoes of bounce on the open floor.<br />
                            No nets of books, just aim and run,<br />
                            Find the code where the matches are won.
                        </p>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            <strong>Hinglish:</strong> Ek ball, ek hoop, ek hi court,<br />
                            Bounce ki awaaz ka hota hai report.<br />
                            Books nahi, bas focus aur shot,<br />
                            Game wali jagah pe milega next plot.
                        </p>
                    </div>
                    <br />
                    <p style={{ color: '#FFD700', fontSize: '1.1rem' }}>Scan the next QR code to continue.</p>
                </div>
            )
        }

        // FAILED - show which questions were wrong (not the correct answers)
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0', maxWidth: '700px', margin: '0 auto' }}>
                <X size={70} style={{ color: '#ef4444', marginBottom: '20px' }} />
                <h2 style={{ color: '#ef4444', marginBottom: '15px' }}>Quiz Not Passed</h2>
                <p style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#ccc' }}>
                    You got <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{results.score}</span> out of <span style={{ fontWeight: 'bold' }}>{results.total}</span> correct.
                </p>
                <p style={{ fontSize: '1.1rem', marginBottom: '30px', color: '#ef4444' }}>
                    {wrongCount} {wrongCount === 1 ? 'answer was' : 'answers were'} incorrect. You must get all correct to proceed.
                </p>

                {/* Show which questions were wrong */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '30px' }}>
                    {results.results.map((r, i) => (
                        <div
                            key={i}
                            style={{
                                width: '44px', height: '44px', borderRadius: '10px',
                                background: r.isCorrect ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                border: `2px solid ${r.isCorrect ? '#22c55e' : '#ef4444'}`,
                                color: r.isCorrect ? '#22c55e' : '#ef4444',
                                fontWeight: 'bold',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.9rem'
                            }}
                        >
                            {r.isCorrect ? <Check size={18} /> : <X size={18} />}
                        </div>
                    ))}
                </div>

                <p style={{ color: '#b3b3b3', fontSize: '0.95rem', marginBottom: '25px' }}>
                    Review the questions you got wrong and try again.
                </p>

                <button
                    onClick={handleRetry}
                    className="btn btn-primary btn-large"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', padding: '15px 40px' }}
                >
                    <RotateCcw size={20} /> Try Again
                </button>
            </div>
        )
    }

    // QUIZ screen - one question at a time, no feedback
    const allAnswered = Object.keys(answers).length === questions.length
    const isLastQuestion = currentQ === questions.length - 1

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <Target size={50} style={{ color: '#FFD700', marginBottom: '15px' }} />
                <h1>Phase 2: CS Fundamentals Quiz</h1>
                <p style={{ fontSize: '1rem', marginTop: '10px', color: '#FFD700' }}>
                    Theme: Computer Science Fundamentals
                </p>
                <p style={{ fontSize: '0.9rem', marginTop: '5px', color: '#ccc' }}>
                    Answer all questions. You must get every answer correct to pass.
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
                <div className="progress-bar" style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }} />
            </div>

            {/* Question Card */}
            {questions[currentQ] && (
                <div className="quiz-question">
                    <div className="quiz-question-number">Question {currentQ + 1}</div>
                    <p className="quiz-question-text">{questions[currentQ].question}</p>
                    <div className="quiz-options">
                        {questions[currentQ].options.map((opt, i) => (
                            <div
                                key={i}
                                className={`quiz-option ${answers[currentQ] === i ? 'selected' : ''}`}
                                onClick={() => handleSelectAnswer(i)}
                                style={{ cursor: 'pointer' }}
                            >
                                <span className="quiz-radio" />
                                <span className="quiz-option-text">{opt}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '30px' }}>
                {currentQ > 0 && (
                    <button onClick={handlePrev} className="btn btn-secondary">
                        Previous
                    </button>
                )}

                {!isLastQuestion && (
                    <button
                        onClick={handleNext}
                        className="btn btn-primary"
                        disabled={answers[currentQ] === undefined}
                    >
                        Next Question <ArrowRight size={20} />
                    </button>
                )}

                {isLastQuestion && allAnswered && (
                    <button
                        onClick={handleSubmitAll}
                        className="btn btn-primary btn-large"
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : 'Submit All Answers'} <Check size={20} />
                    </button>
                )}
            </div>

            {/* Question Indicators */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '30px' }}>
                {questions.map((_, i) => (
                    <div
                        key={i}
                        onClick={() => setCurrentQ(i)}
                        style={{
                            width: '40px', height: '40px', borderRadius: '8px', border: 'none',
                            background: answers[i] !== undefined
                                ? (i === currentQ ? '#FFD700' : 'rgba(255, 215, 0, 0.3)')
                                : (i === currentQ ? '#FFD700' : '#2a2a2a'),
                            color: i === currentQ ? '#000' : (answers[i] !== undefined ? '#FFD700' : '#fff'),
                            fontWeight: 'bold',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {i + 1}
                    </div>
                ))}
            </div>

            {/* Answered count */}
            <div style={{ textAlign: 'center', marginTop: '15px', color: '#b3b3b3', fontSize: '0.9rem' }}>
                {Object.keys(answers).length} of {questions.length} answered
            </div>
        </div>
    )
}
