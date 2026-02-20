const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only .jpg, .jpeg, and .png files are allowed'));
    }
});

// ============================================
// FIREBASE INITIALIZATION
// ============================================
let db;
let useFirebase = false;

// Check if Firebase credentials file exists or env var is set
const serviceAccountPath = path.join(__dirname, 'firebase-credentials.json');
if (process.env.FIREBASE_CREDENTIALS) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        db = admin.firestore();
        useFirebase = true;
        console.log('✅ Firebase Firestore connected via env variable!');
    } catch (error) {
        console.error('❌ Firebase env parse error:', error.message);
    }
} else if (fs.existsSync(serviceAccountPath)) {
    try {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        db = admin.firestore();
        useFirebase = true;
        console.log('✅ Firebase Firestore connected successfully!');
    } catch (error) {
        console.error('❌ Firebase initialization error:', error.message);
        console.log('⚠️  Falling back to in-memory database');
    }
} else {
    console.log('⚠️  firebase-credentials.json not found');
    console.log('📝 To use Firebase:');
    console.log('   1. Go to Firebase Console → Project Settings → Service Accounts');
    console.log('   2. Generate new private key');
    console.log('   3. Save as backend/firebase-credentials.json');
    console.log('');
    console.log('📦 Using in-memory database for now...\n');
}

// ============================================
// IN-MEMORY DATABASE (Fallback)
// ============================================
const teamsDB = new Map();

// ============================================
// DATABASE HELPER FUNCTIONS
// ============================================

// Get team by name
async function getTeamByName(teamName) {
    const normalizedName = teamName.toLowerCase();

    if (useFirebase) {
        const snapshot = await db.collection('teams')
            .where('teamName', '==', normalizedName)
            .limit(1)
            .get();

        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } else {
        for (const [id, team] of teamsDB) {
            if (team.teamName === normalizedName) {
                return team;
            }
        }
        return null;
    }
}

// Get team by ID
async function getTeamById(teamId) {
    if (useFirebase) {
        const doc = await db.collection('teams').doc(teamId).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    } else {
        return teamsDB.get(teamId) || null;
    }
}

// Save team - handles both flat and nested updates
async function saveTeam(teamId, teamData) {
    if (useFirebase) {
        try {
            // Flatten nested objects to dot notation for Firebase update()
            const flattenObject = (obj, prefix = '') => {
                return Object.keys(obj).reduce((acc, key) => {
                    const newKey = prefix ? `${prefix}.${key}` : key;
                    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
                        Object.assign(acc, flattenObject(obj[key], newKey));
                    } else {
                        acc[newKey] = obj[key];
                    }
                    return acc;
                }, {});
            };

            const flatData = flattenObject(teamData);

            // Use update() for partial updates - this properly handles nested fields
            await db.collection('teams').doc(teamId).update(flatData);
        } catch (error) {
            console.error('Firebase saveTeam error:', error.message);
            throw error;
        }
    } else {
        // For in-memory, deep merge the updates
        const existingTeam = teamsDB.get(teamId) || {};

        const deepMerge = (target, source) => {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
            return target;
        };

        deepMerge(existingTeam, teamData);
        teamsDB.set(teamId, existingTeam);
    }
}

// Create team
async function createTeam(teamId, teamData) {
    if (useFirebase) {
        await db.collection('teams').doc(teamId).set(teamData);
    } else {
        teamsDB.set(teamId, teamData);
    }
}

// Get all teams
async function getAllTeams() {
    if (useFirebase) {
        const snapshot = await db.collection('teams').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
        return Array.from(teamsDB.values());
    }
}

// Get completed teams for leaderboard
async function getCompletedTeams() {
    if (useFirebase) {
        const snapshot = await db.collection('teams')
            .where('phase6.completed', '==', true)
            .limit(10)
            .get();
        return snapshot.docs.map(doc => ({
            teamId: doc.id,
            teamName: doc.data().teamName,
            teamLeader: doc.data().teamLeader
        }));
    } else {
        const completedTeams = [];
        for (const [id, team] of teamsDB) {
            if (team.phase6?.completed) {
                completedTeams.push({
                    teamId: team.teamId,
                    teamName: team.teamName,
                    teamLeader: team.teamLeader
                });
            }
        }
        return completedTeams.slice(0, 10);
    }
}

// Get stats
async function getStats() {
    if (useFirebase) {
        const snapshot = await db.collection('teams').get();
        let stats = {
            totalTeams: 0,
            phase1: 0, phase2: 0, phase3: 0, phase4: 0, phase5: 0, phase6: 0
        };

        snapshot.forEach(doc => {
            const team = doc.data();
            stats.totalTeams++;
            if (team.phase1?.completed) stats.phase1++;
            if (team.phase2?.completed) stats.phase2++;
            if (team.phase3?.completed) stats.phase3++;
            if (team.phase4?.completed) stats.phase4++;
            if (team.phase5?.completed) stats.phase5++;
            if (team.phase6?.completed) stats.phase6++;
        });

        return stats;
    } else {
        let stats = {
            totalTeams: 0,
            phase1: 0, phase2: 0, phase3: 0, phase4: 0, phase5: 0, phase6: 0
        };

        for (const [id, team] of teamsDB) {
            stats.totalTeams++;
            if (team.phase1?.completed) stats.phase1++;
            if (team.phase2?.completed) stats.phase2++;
            if (team.phase3?.completed) stats.phase3++;
            if (team.phase4?.completed) stats.phase4++;
            if (team.phase5?.completed) stats.phase5++;
            if (team.phase6?.completed) stats.phase6++;
        }

        return stats;
    }
}

// ============================================
// QUESTIONS DATA
// ============================================

// Quiz Questions for Phase 2
const phase2Questions = [
    {
        id: 1,
        question: 'Smart cities use AI primarily to improve',
        options: ['Traffic, energy, and safety', 'Farming only', 'Space travel', 'Movie production'],
        correctAnswer: 0
    },
    {
        id: 2,
        question: 'Smart parking systems rely on',
        options: ['Security guards only', 'Manual tickets', 'IoT sensors with AI', 'Typewriters'],
        correctAnswer: 2
    },
    {
        id: 3,
        question: 'AI-powered surveillance enhances',
        options: ['Printing', 'Entertainment', 'Food delivery', 'Public safety'],
        correctAnswer: 3
    },
    {
        id: 4,
        question: 'Which technology predicts equipment failure in infrastructure?',
        options: ['Optical drives', 'Predictive maintenance', 'FTP', 'Cloud gaming'],
        correctAnswer: 1
    },
    {
        id: 5,
        question: 'AI helps waste management by',
        options: ['Removing bins', 'Stopping recycling', 'Increasing garbage', 'Optimizing collection routes'],
        correctAnswer: 3
    },
    {
        id: 6,
        question: 'Smart grids are designed to',
        options: ['Efficiently distribute power', 'Replace batteries', 'Waste electricity', 'Slow transmission'],
        correctAnswer: 0
    },
    {
        id: 7,
        question: 'Flood prediction systems use AI to analyze',
        options: ['Social events', 'Weather and sensor data', 'Movie trends', 'Mobile apps'],
        correctAnswer: 1
    },
    {
        id: 8,
        question: 'Digital twins in smart cities are',
        options: ['Gaming avatars', 'Robot citizens', 'Virtual models of physical environments', 'Social media bots'],
        correctAnswer: 2
    },
    {
        id: 9,
        question: 'AI-enabled public transport systems aim to',
        options: ['Increase delays', 'Eliminate buses', 'Reduce efficiency', 'Improve route planning'],
        correctAnswer: 3
    },
    {
        id: 10,
        question: 'One major concern in smart cities is',
        options: ['Too many parks', 'Excess sunlight', 'Data security and privacy', 'Short buildings'],
        correctAnswer: 2
    }
];

// Phase 3 Questions
const phase3Questions = [
    {
        id: 1,
        code: `#include <stdio.h>\nint main() {\n    int i = 0, count = 0;\n    for (i = 0; i < 5; i++) {\n        if (i++ % 2 == 0) {\n            count++;\n        }\n    }\n    printf("%d", count);\n    return 0;\n}`,
        question: "What will be the output of this code?",
        options: ["2", "3", "4", "5"],
        correctAnswer: 1
    },
    {
        id: 2,
        code: `#include <stdio.h>\nvoid swap(int *x, int *y) {\n    int temp = *x;\n    *x = *y;\n    *y = temp;\n}\nint main() {\n    int a = 3, b = 4;\n    swap(&a, &b);\n    a = a + b;\n    b = a - b;\n    a = a - b;\n    printf("%d %d", a, b);\n    return 0;\n}`,
        question: "What will be the output of this code?",
        options: ["4 3", "3 4", "7 4", "3 7"],
        correctAnswer: 1
    },
    {
        id: 3,
        code: `#include <stdio.h>\nvoid solve(int n) {\n    if (n > 0) {\n        solve(n / 2);\n        printf("%d", n % 2);\n    }\n}\nint main() {\n    solve(10);\n    return 0;\n}`,
        question: "What will be the output of this code?",
        options: ["0101", "1010", "20", "10"],
        correctAnswer: 1
    },
    {
        id: 4,
        code: `#include <stdio.h>\nint main() {\n    int arr[] = {10, 20, 30, 40, 50};\n    int *p = arr + 1;\n    printf("%d ", *p);\n    p += 2;\n    printf("%d", p[-1]);\n    return 0;\n}`,
        question: "What will be the output of this code?",
        options: ["20 40", "30 40", "20 30", "30 50"],
        correctAnswer: 2
    },
    {
        id: 5,
        code: `#include <stdio.h>\nint main() {\n    int a = 1, b = 0, c = 2;\n    if (a-- || b++ && c--) {\n        printf("%d %d %d", a, b, c);\n    }\n    return 0;\n}`,
        question: "What will be the output of this code?",
        options: ["0 1 1", "0 0 2", "1 0 2", "1 1 1"],
        correctAnswer: 1
    }
];

// Phase 4 Buggy Code
const phase4Code = `#include <stdio.h>
int main() {
    int num = 5;
    int fact = 1;
    
    for(int i = 1; i =< num; i++) {
        fact = fact * i
    }
    
    printf("Factorial: %d", &fact);
    return 0;
}`;

const phase4Hints = [
    "Check the relational operator in the for loop.",
    "There is a missing semicolon inside the loop.",
    "In the printf statement, are you printing the value of the variable, or its memory address?"
];

// Phase 5 Riddles - 3 Challenges (ALL required to pass)
const phase5Riddles = [
    {
        id: 1,
        type: "mcq",
        riddle: "Study the maze below and find the ONLY path from S (Start) to E (Exit). Walls (#) block movement. You can only move Right (→) or Down (↓).\n\n    C0  C1  C2  C3  C4  C5\nR0: [S] [#] [.] [.] [.] [.]\nR1: [.] [.] [.] [#] [.] [.]\nR2: [#] [#] [.] [#] [.] [.]\nR3: [.] [.] [.] [.] [.] [#]\nR4: [#] [#] [#] [#] [.] [#]\nR5: [.] [.] [.] [#] [.] [E]\n\nWhich sequence of moves leads from S to E?",
        options: [
            "↓ → → ↓ ↓ → → ↓ ↓ →",
            "↓ → ↓ → ↓ → ↓ → → ↓",
            "→ ↓ → ↓ → ↓ → ↓ → ↓",
            "↓ → → ↓ → ↓ → ↓ ↓ →"
        ],
        correctAnswer: 0
    },
    {
        id: 2,
        type: "mcq",
        riddle: `LOGICAL DEDUCTION: Each Smart City AI System is assigned exactly one function.

Smart City AI Systems:
1. TrafficMind
2. PowerGridAI
3. SafeCity
4. AquaSense

City Functions:
A. Traffic Management
B. Energy Optimization
C. Public Safety
D. Water Monitoring

Clues:
• TrafficMind (1) is assigned to Traffic Management (A)
• PowerGridAI (2) is assigned to Energy Optimization (B)
• AquaSense (4) is NOT assigned to A or B
• SafeCity (3) is assigned to Public Safety (C)

What is the correct mapping?`,
        options: [
            "TrafficMind → B, PowerGridAI → A, SafeCity → C, AquaSense → D",
            "TrafficMind → A, PowerGridAI → B, SafeCity → C, AquaSense → D",
            "TrafficMind → A, PowerGridAI → B, SafeCity → D, AquaSense → C",
            "TrafficMind → C, PowerGridAI → B, SafeCity → A, AquaSense → D"
        ],
        correctAnswer: 1
    },
    {
        id: 3,
        type: "text",
        riddle: `🧩 PART 2: PATTERN RECOGNITION

Step 1: Given Values
A = 5, B = 7, C = 8, D = 6

Step 2: Equation
Using the values above, solve the following expressions in order:
1) (2 × B)
2) (1 × A)
3) (3 × D) + 6
4) (4 × A)
5) (C − 1)
6) (1 × A)
7) (2 × B)

Step 3: Final Instruction
Convert the obtained numbers using A1–Z26
 (A = 1, B = 2, … Z = 26)

Final Task:
Submit the decoded keyword to unlock the final phase.`,
        acceptedAnswers: ["nextgen", "NEXTGEN", "Nextgen"]
    }
];

// ============================================
// API ROUTES
// ============================================

// Register new team (Phase 1)
app.post('/api/teams/register', async (req, res) => {
    try {
        const { teamName, teamLeader, teamMembers, email, theme } = req.body;

        // Validate required fields
        if (!teamName || !teamLeader || !teamMembers || !email || !theme) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate theme
        const validThemes = [
            'AI in Healthcare',
            'Generative AI & Creativity',
            'Computer Science Fundamentals',
            'AI in Education & Learning',
            'AI in Smart Cities'
        ];
        if (!validThemes.includes(theme)) {
            return res.status(400).json({ error: 'Please select a valid theme' });
        }

        // Validate team members (3-4)
        const members = teamMembers.split(',').map(m => m.trim()).filter(m => m);
        if (members.length < 3 || members.length > 4) {
            return res.status(400).json({ error: 'Team must have 3-4 members' });
        }

        // Check if team name already exists
        const existingTeam = await getTeamByName(teamName);
        if (existingTeam) {
            return res.status(400).json({ error: 'Team name already exists' });
        }

        const teamId = 'TEAM_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        const team = {
            teamId,
            teamName: teamName.toLowerCase(),
            teamLeader,
            teamMembers: members,
            email,
            theme,
            phase1: { completed: false },
            phase2: { completed: false },
            phase3: { completed: false },
            phase4: { completed: false },
            phase5: { completed: false },
            phase6: { completed: false },
            currentPhase: 1
        };

        await createTeam(teamId, team);

        console.log(`✅ Team registered: ${teamName} (Theme: ${theme}) ${useFirebase ? '(Firebase)' : '(Memory)'}`);

        res.json({
            success: true,
            message: 'Registration successful!',
            team
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Submit Phase 1 (AI Image Generation)
app.post('/api/phase1/submit', async (req, res) => {
    try {
        const { teamId, driveLink, aiPrompt } = req.body;

        if (!teamId || !aiPrompt) {
            return res.status(400).json({ error: 'Team ID and AI prompt are required' });
        }

        const team = await getTeamById(teamId);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        if (team.phase1?.completed) {
            return res.status(400).json({ error: 'Phase 1 already completed' });
        }

        if (team.currentPhase !== 1) {
            return res.status(400).json({ error: 'Not on Phase 1' });
        }

        // Validate AI prompt contains VU2050
        if (!aiPrompt.toUpperCase().includes('VU2050')) {
            return res.status(400).json({ error: 'AI Prompt must contain keyword "VU2050"' });
        }

        await saveTeam(teamId, {
            phase1: {
                aiPrompt,
                completed: true
            },
            currentPhase: 2
        });

        console.log(`🎨 Phase 1 - Team: ${team.teamName} submitted AI image!`);

        res.json({
            success: true,
            message: 'Phase 1 completed!'
        });
    } catch (error) {
        console.error('Phase 1 submit error:', error.message);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get team by name (for resume)
app.get('/api/teams/:teamName', async (req, res) => {
    try {
        const team = await getTeamByName(req.params.teamName);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        res.json(team);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Phase 2 questions
app.get('/api/phase2/questions', (req, res) => {
    const questionsWithoutAnswers = phase2Questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options
    }));
    res.json(questionsWithoutAnswers);
});

// Check single Phase 2 answer
app.post('/api/phase2/check-answer', (req, res) => {
    try {
        const body = req.body || {};
        const questionIndex = body.questionIndex;
        const answer = body.answer;

        if (questionIndex == null || answer == null) {
            return res.status(400).json({ error: 'questionIndex and answer are required' });
        }

        if (questionIndex < 0 || questionIndex >= phase2Questions.length) {
            return res.status(400).json({ error: 'Invalid question index' });
        }

        const question = phase2Questions[questionIndex];
        const correct = answer === question.correctAnswer;

        res.json({ success: true, correct });
    } catch (error) {
        console.error('Phase 2 check-answer error:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Complete Phase 2 (all questions answered correctly)
app.post('/api/phase2/complete', async (req, res) => {
    try {
        const { teamId } = req.body;

        const team = await getTeamById(teamId);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        if (team.phase2?.completed) {
            return res.status(400).json({ error: 'Phase 2 already completed' });
        }

        await saveTeam(teamId, {
            phase2: {
                completed: true
            },
            currentPhase: 3
        });

        console.log(`📝 Phase 2 - Team: ${team.teamName} completed all questions correctly!`);

        res.json({ success: true, message: 'Phase 2 completed!' });
    } catch (error) {
        console.error('Phase 2 complete error:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Submit Phase 2 answers
app.post('/api/phase2/submit', async (req, res) => {
    try {
        const { teamId, answers } = req.body;

        console.log(`Phase 2 submit request - TeamId: ${teamId}`);

        const team = await getTeamById(teamId);
        if (!team) {
            console.log('Team not found:', teamId);
            return res.status(404).json({ error: 'Team not found' });
        }

        if (team.phase2?.completed) {
            return res.status(400).json({ error: 'Phase 2 already completed' });
        }

        // Calculate score - only track which are correct/incorrect (no correct answers exposed)
        let score = 0;
        const results = phase2Questions.map((q, index) => {
            const isCorrect = answers[index] === q.correctAnswer;
            if (isCorrect) score++;
            return {
                questionIndex: index,
                isCorrect
            };
        });

        const passed = score === phase2Questions.length; // ALL must be correct

        const updateData = {
            phase2: {
                completed: passed
            }
        };

        if (passed) {
            updateData.currentPhase = 3;
        }

        await saveTeam(teamId, updateData);

        console.log(`📝 Phase 2 - Team: ${team.teamName}, Score: ${score}/${phase2Questions.length}, Passed: ${passed}`);

        res.json({
            success: true,
            score,
            total: phase2Questions.length,
            passed,
            results
        });
    } catch (error) {
        console.error('Phase 2 submit error:', error.message, error.stack);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get Phase 3 questions
app.get('/api/phase3/questions', (req, res) => {
    const questionsWithoutAnswers = phase3Questions.map(q => ({
        id: q.id,
        code: q.code,
        question: q.question,
        options: q.options
    }));
    res.json(questionsWithoutAnswers);
});

// Submit Phase 3 answers
app.post('/api/phase3/submit', async (req, res) => {
    try {
        const { teamId, answers } = req.body;

        const team = await getTeamById(teamId);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        if (team.currentPhase !== 3) {
            return res.status(400).json({ error: 'Not on Phase 3' });
        }

        if (team.phase3?.completed) {
            return res.status(400).json({ error: 'Phase 3 already completed' });
        }

        // Calculate score
        let score = 0;
        const results = phase3Questions.map((q, index) => {
            const isCorrect = answers[index] === q.correctAnswer;
            if (isCorrect) score++;
            return {
                questionId: q.id,
                userAnswer: answers[index],
                correctAnswer: q.correctAnswer,
                isCorrect
            };
        });

        const MIN_SCORE = 3;
        if (score < MIN_SCORE) {
            console.log(`💻 Phase 3 - Team: ${team.teamName}, Score: ${score}/5, Failed (min ${MIN_SCORE} required)`);
            return res.json({
                success: true,
                score,
                passed: false,
                results,
                questions: phase3Questions
            });
        }

        const updateData = {
            phase3: {
                completed: true
            },
            currentPhase: 4
        };

        await saveTeam(teamId, updateData);

        console.log(`💻 Phase 3 - Team: ${team.teamName}, Score: ${score}/5, Completed!`);

        res.json({
            success: true,
            score,
            passed: true,
            results,
            questions: phase3Questions
        });
    } catch (error) {
        console.error('Phase 3 submit error:', error.message);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get Phase 4 code
app.get('/api/phase4/code', (req, res) => {
    res.json({ code: phase4Code });
});

// Submit Phase 4 answer
app.post('/api/phase4/submit', async (req, res) => {
    try {
        const { teamId, answer } = req.body;

        const team = await getTeamById(teamId);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        if (team.currentPhase !== 4) {
            return res.status(400).json({ error: 'Not on Phase 4' });
        }

        if (team.phase4?.completed) {
            return res.status(400).json({ error: 'Phase 4 already completed' });
        }

        const correctAnswer = 'factorial: 120';
        const userAnswer = answer ? answer.trim().toLowerCase() : '';
        const isCorrect = userAnswer === correctAnswer || userAnswer === '120';

        if (isCorrect) {
            await saveTeam(teamId, {
                phase4: {
                    completed: true
                },
                currentPhase: 5
            });

            console.log(`🔓 Phase 4 - Team: ${team.teamName} solved the buggy code!`);

            return res.json({
                success: true,
                correct: true,
                message: 'Correct! The next treasure is at Lab 2012!',
                room: '2012'
            });
        }

        res.json({
            success: false,
            correct: false,
            message: 'Incorrect output. Try again!'
        });
    } catch (error) {
        console.error('Phase 4 submit error:', error.message);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get Phase 5 riddles
app.get('/api/phase5/riddles', (req, res) => {
    const riddlesWithoutAnswers = phase5Riddles.map(r => ({
        id: r.id,
        type: r.type,
        riddle: r.riddle,
        options: r.options
    }));
    res.json(riddlesWithoutAnswers);
});

// Submit single Phase 5 riddle answer
app.post('/api/phase5/answer', async (req, res) => {
    try {
        const { teamId, riddleId, answer } = req.body;

        const team = await getTeamById(teamId);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        if (team.currentPhase !== 5) {
            return res.status(400).json({ error: 'Not on Phase 5' });
        }

        const riddle = phase5Riddles.find(r => r.id === riddleId);
        if (!riddle) {
            return res.status(400).json({ error: 'Invalid riddle' });
        }

        let isCorrect = false;
        if (riddle.type === 'mcq') {
            isCorrect = answer === riddle.correctAnswer;
        } else {
            isCorrect = riddle.acceptedAnswers.some(a => a.trim().toLowerCase() === answer.toString().toLowerCase().trim());
        }

        res.json({
            success: true,
            correct: isCorrect
        });
    } catch (error) {
        console.error('Phase 5 answer error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Submit Phase 5 completion
app.post('/api/phase5/complete', async (req, res) => {
    try {
        const { teamId, answers, score } = req.body;

        const team = await getTeamById(teamId);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        if (team.currentPhase !== 5) {
            return res.status(400).json({ error: 'Not on Phase 5' });
        }

        // Recalculate score server-side for accuracy
        let serverScore = 0;
        const totalRiddles = phase5Riddles.length;
        if (answers && typeof answers === 'object') {
            Object.entries(answers).forEach(([riddleId, ans]) => {
                const riddle = phase5Riddles.find(r => r.id === parseInt(riddleId));
                if (riddle) {
                    if (riddle.type === 'mcq' && ans.answer === riddle.correctAnswer) {
                        serverScore++;
                    } else if (riddle.type === 'text' && typeof ans.answer === 'string' &&
                        riddle.acceptedAnswers.some(a => a.trim().toLowerCase() === ans.answer.trim().toLowerCase())) {
                        serverScore++;
                    }
                }
            });
        }

        // ALL challenges must be correct
        if (serverScore < totalRiddles) {
            console.log(`🧩 Phase 5 - Team: ${team.teamName} failed with ${serverScore}/${totalRiddles} (ALL required)`);
            return res.json({
                success: false,
                score: serverScore,
                total: totalRiddles,
                message: `You scored ${serverScore}/${totalRiddles}. All challenges must be correct to pass. Try again!`
            });
        }

        await saveTeam(teamId, {
            phase5: {
                completed: true
            },
            currentPhase: 6
        });

        console.log(`🧩 Phase 5 - Team: ${team.teamName} completed with ${serverScore}/${totalRiddles}!`);

        res.json({
            success: true,
            score: serverScore,
            message: 'Phase 5 completed! Proceed to the final phase.'
        });
    } catch (error) {
        console.error('Phase 5 complete error:', error.message);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Submit Phase 6 (Final)
app.post('/api/phase6/submit', upload.none(), async (req, res) => {
    try {
        const { teamId, locationAnswer } = req.body;

        const team = await getTeamById(teamId);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        if (team.currentPhase !== 6) {
            return res.status(400).json({ error: 'Not on Phase 6' });
        }

        if (team.phase6?.completed) {
            return res.status(400).json({ error: 'Already completed' });
        }

        await saveTeam(teamId, {
            phase6: {
                locationAnswer: locationAnswer || '',
                completed: true
            },
            currentPhase: 7 // Completed
        });

        console.log(`🏆 COMPLETED - Team: ${team.teamName} | Location: ${locationAnswer || 'none'}`);

        res.json({
            success: true,
            message: 'Congratulations! You have completed CodeHunt-2026!',
            teamName: team.teamName,
            teamLeader: team.teamLeader
        });
    } catch (error) {
        console.error('Phase 6 submit error:', error.message);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        const teams = await getCompletedTeams();
        res.json(teams);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin routes
app.get('/api/admin/teams', async (req, res) => {
    try {
        const teams = await getAllTeams();
        res.json(teams);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/admin/stats', async (req, res) => {
    try {
        const stats = await getStats();
        res.json({
            totalTeams: stats.totalTeams,
            phaseStats: {
                phase1: stats.phase1,
                phase2: stats.phase2,
                phase3: stats.phase3,
                phase4: stats.phase4,
                phase5: stats.phase5,
                phase6: stats.phase6
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        database: useFirebase ? 'Firebase Firestore' : 'In-Memory',
        timestamp: new Date().toISOString()
    });
});

// Admin: Delete a specific team (for testing)
app.delete('/api/admin/teams/:teamId', async (req, res) => {
    try {
        const { teamId } = req.params;

        if (useFirebase) {
            await db.collection('teams').doc(teamId).delete();
        } else {
            teamsDB.delete(teamId);
        }

        console.log(`🗑️ Team deleted: ${teamId}`);
        res.json({ success: true, message: 'Team deleted' });
    } catch (error) {
        console.error('Delete team error:', error);
        res.status(500).json({ error: 'Failed to delete team' });
    }
});

// Admin: Clear all teams (for testing - BE CAREFUL!)
app.delete('/api/admin/clear-all', async (req, res) => {
    try {
        if (useFirebase) {
            const snapshot = await db.collection('teams').get();
            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        } else {
            teamsDB.clear();
        }

        console.log('🗑️ All teams cleared!');
        res.json({ success: true, message: 'All teams cleared' });
    } catch (error) {
        console.error('Clear all error:', error);
        res.status(500).json({ error: 'Failed to clear teams' });
    }
});

// Serve frontend in production
const frontendPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    // SPA fallback - serve index.html for all non-API routes
    app.get('/{*path}', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(frontendPath, 'index.html'));
        }
    });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 CodeHunt-2026 Server running on port ${PORT}`);
    console.log(`📦 Database: ${useFirebase ? 'Firebase Firestore ✓' : 'In-Memory (add firebase-credentials.json for Firebase)'}`);
    if (!useFirebase) {
        console.log(`⚠️  Data will be lost when server restarts`);
    }
    console.log('');
});
