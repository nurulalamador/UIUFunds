const router = require('express').Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const upload = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');
const c = require('../controllers/crowdfunding.controller');

router.get('/', asyncHandler(c.listCrowdfundings));
router.get('/history', asyncHandler(c.listCompletedCrowdfundings));
router.get('/mine', auth, asyncHandler(c.myCrowdfundings));
router.get('/admin/pending', auth, admin, asyncHandler(c.pendingCrowdfundings));
router.patch('/admin/:id/approve', auth, admin, asyncHandler(c.approveCrowdfunding));
router.patch('/admin/:id/reject', auth, admin, asyncHandler(c.rejectCrowdfunding));
router.get('/:id/image', asyncHandler(c.getCrowdfundingImage));
router.get('/spend/:spendId/proof', asyncHandler(c.getSpendProof));
router.post('/', auth, upload.single('image'), asyncHandler(c.createCrowdfunding));
router.post('/:id/donate', auth, asyncHandler(c.donate));
router.post('/:id/spend-items', auth, upload.single('proof'), asyncHandler(c.addSpendItem));
router.get('/:id', asyncHandler(c.getCrowdfunding));

module.exports = router;
