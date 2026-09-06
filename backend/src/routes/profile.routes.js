const router = require('express').Router();
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/profile.controller');

router.get('/me', auth, asyncHandler(controller.getProfile));
router.patch('/me', auth, asyncHandler(controller.updateProfile));
router.patch('/me/password', auth, asyncHandler(controller.changePassword));
router.get('/:username', asyncHandler(controller.getPublicProfile));

module.exports = router;
