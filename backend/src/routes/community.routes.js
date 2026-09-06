const router = require('express').Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');
const c = require('../controllers/community.controller');

router.get('/posts', auth, asyncHandler(c.listPosts));
router.post('/posts', auth, upload.array('media', 4), asyncHandler(c.createPost));
router.get('/media/:mediaId', asyncHandler(c.getMedia));
router.post('/posts/:id/react', auth, asyncHandler(c.toggleReact));
router.post('/posts/:id/comments', auth, asyncHandler(c.addComment));
router.get('/posts/:id', auth, asyncHandler(c.getPost));

module.exports = router;
