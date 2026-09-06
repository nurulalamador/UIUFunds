const router = require('express').Router();
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/auth.controller');

router.post('/register', asyncHandler(controller.register));
router.post('/login', asyncHandler(controller.login));
router.get('/me', auth, asyncHandler(controller.me));

module.exports = router;
