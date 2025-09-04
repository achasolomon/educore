// backend/src/modules/library/routes/memberRoutes.js
const memberRouter = express.Router();
const { MemberController } = require('../controllers/memberController');
const {
  createMemberValidator,
  updateMemberPrivilegesValidator,
} = require('../validators/memberValidators');
const { paramIdValidator } = require('../validators/transactionValidators');
const authMiddleware = require('../../../core/middleware/auth');
const rbac = require('../../../core/middleware/role');


// Create a new library member (librarian only)
memberRouter.post('/',
  authMiddleware,
  rbac.requireRole(['librarian', 'admin']),
  createMemberValidator,
  MemberController.createMember
);

// Get all library members for school with filters
memberRouter.get('/',
  authMiddleware,
  rbac.requireRole(['librarian', 'admin', 'teacher']),
  MemberController.getMembers
);

// Get a specific library member by ID
memberRouter.get('/:id',
  authMiddleware,
  paramIdValidator,
  MemberController.getMemberById
);

// Update member borrowing privileges (librarian only)
memberRouter.patch('/:id/privileges',
  authMiddleware,
  rbac.requireRole(['librarian', 'admin']),
  updateMemberPrivilegesValidator,
  MemberController.updateMemberPrivileges
);