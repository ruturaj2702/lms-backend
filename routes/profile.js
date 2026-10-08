const express = require('express');
const User = require('../models/User');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get current logged-in user profile
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
});

// Role-based LMS dashboard data endpoint
router.get('/dashboard-data', authMiddleware, async (req, res) => {
    try {
        const role = req.user.role;

        if (role === 'student') {
            return res.json({
                role: 'student',
                summary: {
                    enrolledCourses: 4,
                    pendingAssignments: 2,
                    completedQuizzes: 6,
                    attendance: '92%'
                },
                courses: [
                    { id: 'CS301', title: 'Full Stack Web Development', instructor: 'Prof. Sharma', progress: 85 },
                    { id: 'CS302', title: 'Database Management Systems', instructor: 'Dr. Patel', progress: 70 },
                    { id: 'CS303', title: 'Cloud Computing & DevOps', instructor: 'Prof. Kulkarni', progress: 90 },
                    { id: 'CS304', title: 'Information Security', instructor: 'Dr. Rao', progress: 60 }
                ],
                assignments: [
                    { id: 'A1', title: 'Experiment 8: MERN Cloud Deployment', due: '2026-10-15', status: 'In Progress' },
                    { id: 'A2', title: 'Experiment 7: JWT Authentication', due: '2026-10-01', status: 'Submitted' }
                ]
            });
        } else if (role === 'teacher') {
            return res.json({
                role: 'teacher',
                summary: {
                    activeCourses: 3,
                    totalStudents: 142,
                    pendingSubmissions: 18,
                    avgClassScore: '81%'
                },
                classes: [
                    { id: 'CS301', name: 'Full Stack Web Development - Div A', students: 68 },
                    { id: 'CS301-B', name: 'Full Stack Web Development - Div B', students: 74 }
                ],
                recentSubmissions: [
                    { id: 'SUB101', studentName: 'Alice Johnson', assignment: 'MERN Cloud Deployment', submittedAt: 'Today, 2:30 PM' },
                    { id: 'SUB102', studentName: 'Bob Smith', assignment: 'MERN Cloud Deployment', submittedAt: 'Today, 4:15 PM' }
                ]
            });
        } else if (role === 'admin') {
            const userCount = await User.countDocuments();
            const studentsCount = await User.countDocuments({ role: 'student' });
            const teachersCount = await User.countDocuments({ role: 'teacher' });
            const adminsCount = await User.countDocuments({ role: 'admin' });

            return res.json({
                role: 'admin',
                summary: {
                    totalUsers: userCount,
                    totalStudents: studentsCount,
                    totalTeachers: teachersCount,
                    totalAdmins: adminsCount,
                    systemStatus: 'Operational',
                    deploymentBackend: 'Render Cloud (Active)',
                    deploymentFrontend: 'Vercel Edge Network (Active)'
                },
                recentUsers: await User.find().select('-passwordHash').sort({ createdAt: -1 }).limit(5)
            });
        }

        return res.json({ role, message: 'Welcome to LMS' });
    } catch (err) {
        console.error('Dashboard data error:', err);
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
});

// Admin-only route to list all users
router.get('/all-users', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

module.exports = router;
