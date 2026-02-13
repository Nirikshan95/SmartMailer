const express = require('express');
const router = express.Router();

const emailRoutes = require('./emailRoutes');
const prospectRoutes = require('./prospectRoutes');
const campaignRoutes = require('./campaignRoutes');

router.use('/', emailRoutes);
router.use('/', prospectRoutes);
router.use('/', campaignRoutes);

module.exports = router;
