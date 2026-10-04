"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vocab_controller_1 = require("./vocab.controller");
const auth_guard_1 = require("../../middlewares/auth.guard");
const router = (0, express_1.Router)();
// Public & Learner routes
router.get('/sets', (req, res, next) => vocab_controller_1.vocabController.getSets(req, res, next));
router.get('/sets/:id/words', (req, res, next) => vocab_controller_1.vocabController.getSetWords(req, res, next));
// Set & Word Management routes
router.post('/sets', (req, res, next) => vocab_controller_1.vocabController.createSet(req, res, next));
router.delete('/sets/:id', (req, res, next) => vocab_controller_1.vocabController.deleteSet(req, res, next));
router.post('/sets/:id/words', (req, res, next) => vocab_controller_1.vocabController.createWord(req, res, next));
router.patch('/words/:id', (req, res, next) => vocab_controller_1.vocabController.updateWord(req, res, next));
router.delete('/words/:id', (req, res, next) => vocab_controller_1.vocabController.deleteWord(req, res, next));
router.post('/sets/:id/import', (req, res, next) => vocab_controller_1.vocabController.importWords(req, res, next));
// Protected routes (Sổ tay cá nhân)
router.get('/notebook', auth_guard_1.authGuard, (req, res, next) => vocab_controller_1.vocabController.getNotebook(req, res, next));
router.post('/notebook', auth_guard_1.authGuard, (req, res, next) => vocab_controller_1.vocabController.addToNotebook(req, res, next));
router.patch('/notebook/:wordId', auth_guard_1.authGuard, (req, res, next) => vocab_controller_1.vocabController.toggleMemorized(req, res, next));
exports.default = router;
