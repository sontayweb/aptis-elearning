import { Router } from 'express';
import { ingestionController } from './ingestion.controller';

const router = Router();

router.post('/scan-directories', (req, res, next) => ingestionController.scanDirectories(req, res, next));
router.post('/create-listening-tts', (req, res, next) => ingestionController.createListeningTts(req, res, next));
router.post('/create-writing', (req, res, next) => ingestionController.createWriting(req, res, next));

export default router;
