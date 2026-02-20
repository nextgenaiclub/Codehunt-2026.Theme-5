import { useState } from 'react'
import { MapPin, AlertCircle, Clock, Upload } from 'lucide-react'
import Confetti from 'react-confetti'
import { API_URL } from '../App'

const DRIVE_FOLDER_URL = 'https://drive.google.com/drive/u/0/folders/1f8Xltto4DgaZB3YfnCiuncOqdUQs7Ffk'

export default function Phase6({ team, setTeam }) {
    const [location, setLocation] = useState('')
    const [loading, setLoading] = useState(false)
    const [completed, setCompleted] = useState(false)
    const [finalData, setFinalData] = useState(null)
    const [error, setError] = useState('')

    // Redirect checks
    if (!team) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <AlertCircle size={60} style={{ color: '#FFD700', marginBottom: '20px' }} />
                <h2>Please Register First</h2>
            </div>
        )
    }

    if (team.phase6?.completed || team.currentPhase > 6) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <Confetti colors={['#FFD700', '#FFC107', '#FFEB3B', '#FFFFFF']} numberOfPieces={200} />
                <div className="trophy-icon">🏆</div>
                <h1 style={{ marginBottom: '20px' }}>Congratulations!</h1>
                <h2 style={{ color: '#fff', marginBottom: '30px' }}>You've completed CodeHunt-2026!</h2>
            </div>
        )
    }

    if (team.currentPhase < 6) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <AlertCircle size={60} style={{ color: '#FFD700', marginBottom: '20px' }} />
                <h2>Phase Locked</h2>
                <p>Complete the previous phase first.</p>
            </div>
        )
    }

    const handleSubmit = async () => {
        if (!location.trim()) {
            setError('Please enter the location you found')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await fetch(`${API_URL}/phase6/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId: team.teamId,
                    locationAnswer: location
                })
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Submission failed')
                setLoading(false)
                return
            }

            setFinalData(data)
            setCompleted(true)

            const teamRes = await fetch(`${API_URL}/teams/${team.teamName}`)
            const teamData = await teamRes.json()
            setTeam(teamData)
        } catch (err) {
            setError('Failed to submit. Please try again.')
        }
        setLoading(false)
    }

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        return `${hrs}h ${mins}m ${secs}s`
    }

    if (completed && finalData) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
                <Confetti
                    colors={['#FFD700', '#FFC107', '#FFEB3B', '#FFFFFF']}
                    numberOfPieces={300}
                    recycle={false}
                />

                <div className="trophy-icon">🏆</div>

                <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '20px' }}>
                    Congratulations Team {finalData.teamName}!
                </h1>

                <p style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '20px' }}>
                    You have successfully completed <span style={{ color: '#FFD700' }}>CodeHunt-2026</span>!
                </p>

                <div style={{
                    display: 'inline-block',
                    background: 'rgba(255, 215, 0, 0.1)',
                    border: '3px solid #FFD700',
                    borderRadius: '20px',
                    padding: '30px 50px',
                    marginBottom: '40px'
                }}>
                    <Clock size={30} style={{ color: '#FFD700', marginBottom: '10px' }} />
                    <p style={{ color: '#FFD700', fontFamily: 'Orbitron', fontSize: '0.9rem', marginBottom: '10px' }}>
                        TOTAL TIME
                    </p>
                    <p style={{ fontSize: '2.5rem', fontFamily: 'Orbitron', color: '#fff', margin: 0 }}>
                        {formatTime(finalData.totalTimeSeconds)}
                    </p>
                </div>

                <div style={{ marginBottom: '40px' }}>
                    <p style={{ color: '#b3b3b3', marginBottom: '10px' }}>Team Leader</p>
                    <p style={{ fontSize: '1.3rem', color: '#fff' }}>{finalData.teamLeader}</p>
                </div>

                <div style={{
                    background: 'rgba(255, 215, 0, 0.05)',
                    borderRadius: '20px',
                    padding: '30px',
                    maxWidth: '600px',
                    margin: '0 auto 40px'
                }}>
                    <p style={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                        Thank you for participating in CodeHunt-2026! Your journey through AI creation,
                        quizzes, coding challenges, and the campus treasure hunt has been amazing.
                        Check the leaderboard to see your ranking!
                    </p>
                </div>

                <div style={{
                    display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap'
                }}>
                </div>

                <div style={{ marginTop: '60px' }}>
                    <p style={{ color: '#FFD700', fontFamily: 'Orbitron' }}>Organized by</p>
                    <h3 style={{ color: '#fff', marginTop: '10px' }}>NextGenAI Club</h3>
                    <p style={{ color: '#b3b3b3' }}>Vishwakarma University</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <MapPin size={50} style={{ color: '#FFD700', marginBottom: '15px' }} />
                <h1>Final Phase: Campus Treasure Hunt!</h1>
                <p style={{ fontSize: '1.1rem', marginTop: '10px' }}>
                    Solve the riddle, find the location, capture the moment!
                </p>
            </div>

            {/* Final Riddle */}
            <div className="riddle-card" style={{ marginBottom: '40px' }}>
                <div className="riddle-icon">🗺️</div>
                <p className="riddle-text" style={{ fontStyle: 'italic' }}>
                    When hunger hits and crowds collide,<br />
                    The biggest food stop stands with pride.<br />
                    Near the number four, always alive,<br />
                    Plates and plans here truly thrive.
                </p>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', marginTop: '15px', textAlign: 'left' }}>
                    <strong>Hinglish:</strong> Jab bhookh lage aur crowd ho tight,<br />
                    Sabse badi canteen stays in sight.<br />
                    Four ke paas jo hamesha alive,<br />
                    Khana aur clues dono yahin survive.
                </p>
            </div>

            {/* Final Task Section */}
            <div className="card" style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '20px' }}>
                    <MapPin size={20} style={{ marginRight: '10px' }} />
                    Final Task: Locate & Capture
                </h3>



                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        padding: '15px',
                        marginBottom: '20px'
                    }}>
                        <AlertCircle size={18} style={{ marginRight: '10px', color: '#ef4444' }} />
                        {error}
                    </div>
                )}

                {/* Upload Photo to Drive Folder */}
                <div style={{ marginBottom: '20px' }}>
                    <label className="form-label">Upload Team Photo</label>
                    <p style={{ color: '#b3b3b3', fontSize: '0.9rem', marginBottom: '15px' }}>
                        Upload your team photo to the shared Google Drive folder, then submit your location below.
                    </p>
                    <a
                        href={DRIVE_FOLDER_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '14px 30px',
                            fontSize: '1rem',
                            textDecoration: 'none'
                        }}
                    >
                        <Upload size={20} />
                        Open Drive Folder to Upload Photo
                    </a>
                </div>
            </div>

            {/* Location Input */}
            <div className="card" style={{ marginBottom: '30px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Location Found</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Enter the location name (e.g., Main Library, Founder's Statue)"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                </div>
            </div>

            {/* Team Info (Auto-filled) */}
            <div className="card" style={{ marginBottom: '30px', background: 'rgba(255, 215, 0, 0.05)' }}>
                <h4 style={{ marginBottom: '15px', color: '#FFD700' }}>Team Information</h4>
                <p><strong>Team Name:</strong> {team.teamName}</p>
                <p><strong>Team Leader:</strong> {team.teamLeader}</p>
                <p style={{ margin: 0 }}><strong>Members:</strong> {team.teamMembers?.join(', ')}</p>
            </div>

            {/* Submit Button */}
            <div style={{ textAlign: 'center' }}>
                <button
                    onClick={handleSubmit}
                    className="btn btn-primary btn-large"
                    disabled={loading}
                    style={{ fontSize: '1.2rem', padding: '20px 60px' }}
                >
                    {loading ? 'Submitting...' : '🎉 Submit Final Entry'}
                </button>
            </div>
        </div>
    )
}
