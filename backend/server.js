const express = require('express');
const cors = require('cors');
require('dotenv').config();

const roomRoutes = require('./routes/roomRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/rooms', roomRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
