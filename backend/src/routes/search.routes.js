const router = require('express').Router();
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/search.controller');

router.get('/', auth, asyncHandler(controller.search));

module.exports = router;