import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { AdminController } from '../controllers/admin.controller';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/getuserInfo', AdminController.getUserInfo);
router.get('/getuserId', AdminController.getUserId);
router.post('/register', AdminController.register);
router.get('/deleteUser/:userId', AdminController.deleteUser);
router.post('/updateUserDetails', AdminController.updateUserDetails);
router.get('/getProjectList', AdminController.getProjectList);
router.post('/saveProjectList', AdminController.saveProjectList);
router.get('/deleteProjectList/:id', AdminController.deleteProjectList);
router.get('/getProjectListAndUserList', AdminController.getProjectListAndUserList);
router.post('/getSearchDetails', AdminController.getSearchDetails);
router.post('/saveAdminData', AdminController.saveAdminData);
router.post('/exportToExcel', AdminController.exportToExcel);
router.get('/resetPassword/:username', AdminController.resetPassword);

export default router;
