import { Router } from 'express';
import { teacherController } from './teacher.controller';
import { authGuard } from '../../middlewares/auth.guard';
import { roleGuard } from '../../middlewares/role.guard';

const router = Router();

router.use(authGuard);

// Route cho học viên tham gia và xem lớp học của mình
router.post('/classrooms/join', (req, res, next) =>
  teacherController.joinClassroom(req, res, next)
);
router.get('/classrooms/my', (req, res, next) =>
  teacherController.getStudentClassrooms(req, res, next)
);

// Routes dành riêng cho Giảng Viên và Quản Trị Viên (TEACHER, ADMIN)
const teacherOnly = roleGuard(['TEACHER', 'ADMIN']);

router.get('/grading-queue', teacherOnly, (req, res, next) =>
  teacherController.getGradingQueue(req, res, next)
);
router.get('/submissions/:id', teacherOnly, (req, res, next) =>
  teacherController.getSubmissionForGrading(req, res, next)
);
router.post('/submissions/:id/grade', teacherOnly, (req, res, next) =>
  teacherController.gradeSubmission(req, res, next)
);
router.get('/stats', teacherOnly, (req, res, next) =>
  teacherController.getStats(req, res, next)
);
router.post('/classrooms', teacherOnly, (req, res, next) =>
  teacherController.createClassroom(req, res, next)
);
router.get('/classrooms', teacherOnly, (req, res, next) =>
  teacherController.getClassrooms(req, res, next)
);
router.get('/classrooms/:id/members', teacherOnly, (req, res, next) =>
  teacherController.getClassroomMembers(req, res, next)
);

export default router;
