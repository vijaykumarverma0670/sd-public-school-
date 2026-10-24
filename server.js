const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const Notice = require('./models/Notice');
const Result = require('./models/Result');
const Gallery = require('./models/Gallery');
const Desk = require('./models/Desk');
const Inquiry = require('./models/Inquiry');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure Uploads Directory Exists
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sd_public_school')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err.message));

// Admin Auth Middleware
const verifyAdmin = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Access denied.' });
    try {
        const verified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'sdpublicschool_secret_key_2026');
        req.admin = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// --- AUTH ROUTE ---
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === (process.env.ADMIN_PASSWORD || 'admin123')) {
        const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'sdpublicschool_secret_key_2026', { expiresIn: '12h' });
        return res.json({ success: true, token });
    }
    res.status(401).json({ success: false, message: 'Invalid Password' });
});

// --- PUBLIC API ROUTES ---
app.get('/api/notices', async (req, res) => {
    try { const notices = await Notice.find().sort({ date: -1 }); res.json(notices); } catch (e) { res.json([]); }
});

app.get('/api/gallery', async (req, res) => {
    try { const gallery = await Gallery.find().sort({ uploadedAt: -1 }); res.json(gallery); } catch (e) { res.json([]); }
});

app.get('/api/desks', async (req, res) => {
    try { const desks = await Desk.find(); res.json(desks); } catch (e) { res.json([]); }
});

app.post('/api/inquiries', async (req, res) => {
    try {
        const inquiry = new Inquiry(req.body);
        await inquiry.save();
        res.json({ success: true, message: 'Inquiry Submitted Successfully' });
    } catch (err) { res.status(500).json({ success: false, message: 'Server Error' }); }
});

app.get('/api/results/search', async (req, res) => {
    try {
        const { className, rollNo } = req.query;
        const result = await Result.findOne({ className, rollNo });
        if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
        res.json({ success: true, result });
    } catch (e) { res.status(404).json({ success: false, message: 'Result not found' }); }
});

// --- ADMIN PROTECTED ROUTES (WITH FILE UPLOAD) ---

app.post('/api/admin/notices', verifyAdmin, async (req, res) => {
    const notice = new Notice(req.body);
    await notice.save();
    res.json({ success: true, notice });
});

app.delete('/api/admin/notices/:id', verifyAdmin, async (req, res) => {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

app.post('/api/admin/results', verifyAdmin, async (req, res) => {
    // Result saving logic
    const { studentName, rollNo, className, section, fatherName, dob, subjects } = req.body;
    let totalMarks = 0, obtainedMarks = 0;
    if (subjects) {
        subjects.forEach(s => { totalMarks += Number(s.total || 100); obtainedMarks += Number(s.obtained || 0); });
    }
    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
    let grade = percentage >= 80 ? 'A' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : percentage >= 33 ? 'D' : 'F';

    const resultData = {
        studentName, rollNo, className, section, fatherName, dob,
        subjects, totalMarks: obtainedMarks, percentage: percentage.toFixed(2),
        grade, status: percentage >= 33 ? 'PASS' : 'FAIL'
    };
    const updatedResult = await Result.findOneAndUpdate({ className, rollNo }, resultData, { upsert: true, new: true });
    res.json({ success: true, result: updatedResult });
});

// Gallery Upload with Category & File support
app.post('/api/admin/gallery', verifyAdmin, upload.single('imageFile'), async (req, res) => {
    try {
        const { title, category } = req.body;
        let imageUrl = req.body.imageUrl; // fallback agar url ho
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }
        const image = new Gallery({ title, imageUrl, category: category || 'General' });
        await image.save();
        res.json({ success: true, image });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/admin/gallery/:id', verifyAdmin, async (req, res) => {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// Leadership Desk Update with File support
app.post('/api/admin/desks', verifyAdmin, upload.single('photoFile'), async (req, res) => {
    try {
        const { role, name, title, message } = req.body;
        let photo = req.body.photo;
        if (req.file) {
            photo = `/uploads/${req.file.filename}`;
        }
        const desk = await Desk.findOneAndUpdate(
            { role },
            { name, title, photo, message },
            { upsert: true, new: true }
        );
        res.json({ success: true, desk });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/admin/inquiries', verifyAdmin, async (req, res) => {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server Running on http://localhost:${PORT}`));