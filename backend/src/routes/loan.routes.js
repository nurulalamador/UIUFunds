const router = require('express').Router();
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const c = require('../controllers/loan.controller');

router.get('/', asyncHandler(c.listLoans));
router.get('/mine/requests', auth, asyncHandler(c.myLoanRequests));
router.get('/mine/offers', auth, asyncHandler(c.myOffers));
router.get('/mine/borrowed', auth, asyncHandler(c.borrowedLoans));
router.get('/mine/provided', auth, asyncHandler(c.providedLoans));
router.get('/provided/:id', auth, asyncHandler(c.getProvidedLoan));
router.post('/provided/:id/repay', auth, asyncHandler(c.repayLoan));
router.post('/', auth, asyncHandler(c.createLoan));
router.delete('/:id', auth, asyncHandler(c.cancelLoan));
router.get('/:id/offers', auth, asyncHandler(c.getLoanOffers));
router.post('/:id/offers', auth, asyncHandler(c.createOffer));
router.patch('/offers/:offerId/accept', auth, asyncHandler(c.acceptOffer));
router.get('/:id', asyncHandler(c.getLoan));

module.exports = router;
