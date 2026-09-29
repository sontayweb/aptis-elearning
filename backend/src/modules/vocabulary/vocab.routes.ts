import { Router } from 'express';
import { vocabController } from './vocab.controller';
import { authGuard } from '../../middlewares/auth.guard';

const router = Router();

// Public & Learner routes
router.get('/sets', (req, res, next) => vocabController.getSets(req, res, next));
router.get('/sets/:id/words', (req, res, next) => vocabController.getSetWords(req, res, next));

// Set & Word Management routes
router.post('/sets', (req, res, next) => vocabController.createSet(req, res, next));
router.delete('/sets/:id', (req, res, next) => vocabController.deleteSet(req, res, next));
router.post('/sets/:id/words', (req, res, next) => vocabController.createWord(req, res, next));
router.patch('/words/:id', (req, res, next) => vocabController.updateWord(req, res, next));
router.delete('/words/:id', (req, res, next) => vocabController.deleteWord(req, res, next));
router.post('/sets/:id/import', (req, res, next) => vocabController.importWords(req, res, next));

// Protected routes (Sổ tay cá nhân)
router.get('/notebook', authGuard, (req, res, next) => vocabController.getNotebook(req, res, next));
router.post('/notebook', authGuard, (req, res, next) =>
  vocabController.addToNotebook(req, res, next)
);
router.patch('/notebook/:wordId', authGuard, (req, res, next) =>
  vocabController.toggleMemorized(req, res, next)
);

export default router;
