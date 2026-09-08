const router = require('express').Router();
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const c = require('../controllers/transaction.controller');

router.get('/', auth, asyncHandler(c.myTransactions));
router.post('/demo-topup', auth, asyncHandler(c.demoTopup));
router.post('/cash-out', auth, asyncHandler(c.cashOut));

module.exports = router;
