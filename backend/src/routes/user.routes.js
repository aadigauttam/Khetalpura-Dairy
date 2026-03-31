const router = require('express').Router();
const { getUsers, getCustomers, getUserById, updateUser, updateProfile, createStaff, deactivateUser, getDeliveryBoys } = require('../controllers/user.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/', requireRole('admin'), getUsers);
router.get('/customers', requireRole('admin', 'staff'), getCustomers);
router.get('/delivery-boys', requireRole('admin', 'staff'), getDeliveryBoys);
router.put('/profile', updateProfile);
router.post('/create-staff', requireRole('admin'), createStaff);
router.get('/:id', requireRole('admin', 'staff'), getUserById);
router.put('/:id', requireRole('admin'), updateUser);
router.delete('/:id', requireRole('admin'), deactivateUser);

module.exports = router;
