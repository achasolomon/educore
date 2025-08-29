// backend/src/modules/scratch-cards/routes/scratchCardRoutes.js
const express = require('express');
const router = express.Router();
const ScratchCardController = require('../controllers/scratchCardController');
const authMiddleware = require('../../../core/middleware/auth');
const { requirePermission } = require('../../../core/middleware/rbac');

// Public route for checking results
router.post('/check-results', ScratchCardController.checkResults);

// Protected routes
router.use(authMiddleware);

router.post('/generate', requirePermission('finance:manage'), ScratchCardController.generateCards);
router.get('/', requirePermission('finance:view'), ScratchCardController.getCards);
router.get('/stats', requirePermission('finance:view'), ScratchCardController.getCardStats);
router.put('/:cardId/assign', requirePermission('finance:manage'), ScratchCardController.assignCard);

module.exports = router;