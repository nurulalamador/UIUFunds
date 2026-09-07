const router = require('express').Router();
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/message.controller');

router.use(auth);
router.get('/', asyncHandler(controller.getConversations));
router.get('/:userId', asyncHandler(controller.getConversation));
router.post('/', asyncHandler(controller.sendMessage));

module.exports = router;