const express = require('express');
const { makeUlpin, getRooms } = require('../controllers/roomController');

const router = express.Router();

router.post('/', makeUlpin);
router.get('/', getRooms);

module.exports = router;
