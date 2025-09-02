// backend/src/modules/finance/index.js
const financeRoutes = require('./routes/financeRoutes');
const FeeCategoryController = require('./controllers/feeCategoryController');
const FeeStructureController = require('./controllers/feeStructureController');
const StudentFeeController = require('./controllers/studentFeeController');
const PaymentController = require('./controllers/paymentController');

// Models
const FeeCategory = require('./models/FeeCategory');
const FeeStructure = require('./models/FeeStructure');
const StudentFee = require('./models/StudentFee');
const Payment = require('./models/Payment');
const Receipt = require('./models/Receipt');

// Services
const FinanceInitializationService = require('./services/financeInitializationService');

module.exports = {
  routes: financeRoutes,
  controllers: {
    FeeCategoryController,
    FeeStructureController,
    StudentFeeController,
    PaymentController
  },
  models: {
    FeeCategory,
    FeeStructure,
    StudentFee,
    Payment,
    Receipt
  },
  services: {
    FinanceInitializationService
  }
};
