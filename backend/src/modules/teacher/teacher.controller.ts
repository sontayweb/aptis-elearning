import { Response, NextFunction } from 'express';
import { teacherService } from './teacher.service';
import {
  gradeSubmissionSchema,
  createClassroomSchema,
  joinClassroomSchema,
} from './teacher.dto';
import { sendSuccess } from '../../utils/api-response';
import { AuthenticatedRequest } from '../../middlewares/auth.guard';

export class TeacherController {
  async getGradingQueue(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = req.user!.userId;
      const queue = await teacherService.getGradingQueue(teacherId);
      sendSuccess(res, queue, 'Lấy danh sách hàng đợi chấm bài thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async getSubmissionForGrading(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const submissionId = req.params.id;
      const submission = await teacherService.getSubmissionForGrading(submissionId);
      sendSuccess(res, submission, 'Lấy chi tiết bài chấm thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async gradeSubmission(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = req.user!.userId;
      const submissionId = req.params.id;
      const validatedData = gradeSubmissionSchema.parse(req.body);
      const result = await teacherService.gradeSubmission(teacherId, submissionId, validatedData);
      sendSuccess(res, result, 'Chấm điểm và gửi nhận xét thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = req.user!.userId;
      const stats = await teacherService.getStats(teacherId);
      sendSuccess(res, stats, 'Lấy thống kê giảng viên thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async createClassroom(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = req.user!.userId;
      const validatedData = createClassroomSchema.parse(req.body);
      const classroom = await teacherService.createClassroom(teacherId, validatedData);
      sendSuccess(res, classroom, 'Tạo lớp học thành công', 201);
    } catch (error) {
      next(error);
    }
  }

  async getClassrooms(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = req.user!.userId;
      const classrooms = await teacherService.getClassrooms(teacherId);
      sendSuccess(res, classrooms, 'Lấy danh sách lớp học thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async joinClassroom(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { classCode } = joinClassroomSchema.parse(req.body);
      const member = await teacherService.joinClassroom(userId, classCode);
      sendSuccess(res, member, 'Tham gia lớp học thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async getClassroomMembers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacherId = req.user!.userId;
      const classroomId = req.params.id;
      const members = await teacherService.getClassroomMembers(teacherId, classroomId);
      sendSuccess(res, members, 'Lấy danh sách thành viên lớp học thành công', 200);
    } catch (error) {
      next(error);
    }
  }

  async getStudentClassrooms(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const classrooms = await teacherService.getStudentClassrooms(userId);
      sendSuccess(res, classrooms, 'Lấy danh sách lớp học của bạn thành công', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const teacherController = new TeacherController();
