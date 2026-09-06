const router = require('express').Router();
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const c = require('../controllers/notification.controller');

router.get('/', auth, asyncHandler(c.listNotifications));
router.patch('/read-all', auth, asyncHandler(c.markAllRead));
router.patch('/:id/read', auth, asyncHandler(c.markRead));

module.exports = router;
