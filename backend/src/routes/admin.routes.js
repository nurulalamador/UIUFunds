const router = require('express').Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const asyncHandler = require('../utils/asyncHandler');
const c = require('../controllers/admin.controller');

router.use(auth, admin);
router.get('/users', asyncHandler(c.listUsers));
router.patch('/users/:id/approve', asyncHandler(c.approveUser));
router.delete('/users/:id', asyncHandler(c.deleteUser));
router.get('/community/posts', asyncHandler(c.listAdminPosts));
router.delete('/community/posts/:id', asyncHandler(c.deletePost));
router.get('/crowdfundings', asyncHandler(c.listCrowdfundings));
router.patch('/crowdfundings/:id/approve', asyncHandler(c.approveCrowdfunding));
router.delete('/crowdfundings/:id', asyncHandler(c.deleteCrowdfunding));
router.get('/loans', asyncHandler(c.listLoans));

module.exports = router;