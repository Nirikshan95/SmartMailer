const express = require('express');
const router = express.Router();

const emailRoutes = require('./emailRoutes');
const prospectRoutes = require('./prospectRoutes');
const campaignRoutes = require('./campaignRoutes');
const trackingRoutes = require('./trackingRoutes');
const schedulerRoutes = require('./schedulerRoutes');
const throttlingRoutes = require('./throttlingRoutes');
const aiEmailRoutes = require('./aiEmailRoutes');
const unsubscribeRoutes = require('./unsubscribeRoutes');
const personalizationRoutes = require('./personalizationRoutes');
const attachmentRoutes = require('./attachmentRoutes');
const securityRoutes = require('./securityRoutes');

router.use('/', emailRoutes);
router.use('/', prospectRoutes);
router.use('/', campaignRoutes);
router.use('/', trackingRoutes);
router.use('/', schedulerRoutes);
router.use('/', throttlingRoutes);
router.use('/', aiEmailRoutes);
router.use('/', unsubscribeRoutes);
router.use('/', personalizationRoutes);
router.use('/', attachmentRoutes);
router.use('/', securityRoutes);

module.exports = router;
