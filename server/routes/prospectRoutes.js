const express = require('express');
const router = express.Router();
const prospectController = require('../controllers/prospectController');

router.get('/prospect-lists', prospectController.getLists);
router.post('/prospect-lists', prospectController.createList);
router.delete('/prospect-lists/:id', prospectController.deleteList);
router.post('/prospect-lists/:id/add', prospectController.addEmailsToList);
router.put('/prospect-lists/:id/emails', prospectController.updateListEmails);

module.exports = router;
