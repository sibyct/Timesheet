import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { TimesheetController } from '../controllers/timesheet.controller';

const router = Router();

router.use(authenticate);

router.get('/getUserTimeLogin', TimesheetController.getUserTimeLogin);
router.post('/getDateInfoBetweenDates', TimesheetController.getDateInfoBetweenDates);
router.post('/updateTimeSheet', TimesheetController.updateTimeSheet);
router.post('/submitTimeSheet', TimesheetController.submitTimeSheet);
router.get('/getProfileInfo', TimesheetController.getProfileInfo);
router.post('/saveProfileInfo', TimesheetController.saveProfileInfo);

export default router;
