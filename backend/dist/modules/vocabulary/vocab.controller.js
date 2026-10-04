"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vocabController = exports.VocabController = void 0;
const vocab_service_1 = require("./vocab.service");
const api_response_1 = require("../../utils/api-response");
const zod_1 = require("zod");
const notebookSchema = zod_1.z.object({
    wordId: zod_1.z.string().uuid(),
});
const toggleMemorizedSchema = zod_1.z.object({
    isMemorized: zod_1.z.boolean(),
});
class VocabController {
    async getSets(req, res, next) {
        try {
            const sets = await vocab_service_1.vocabService.getSets();
            (0, api_response_1.sendSuccess)(res, sets, 'Lấy danh sách bộ từ vựng thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async getSetWords(req, res, next) {
        try {
            const setId = req.params.id;
            const set = await vocab_service_1.vocabService.getSetWords(setId);
            (0, api_response_1.sendSuccess)(res, set, 'Lấy danh sách từ vựng thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async addToNotebook(req, res, next) {
        try {
            const userId = req.user.userId;
            const { wordId } = notebookSchema.parse(req.body);
            const item = await vocab_service_1.vocabService.addToNotebook(userId, wordId);
            (0, api_response_1.sendSuccess)(res, item, 'Đã thêm từ vào sổ tay cá nhân', 201);
        }
        catch (error) {
            next(error);
        }
    }
    async getNotebook(req, res, next) {
        try {
            const userId = req.user.userId;
            const notebook = await vocab_service_1.vocabService.getNotebook(userId);
            (0, api_response_1.sendSuccess)(res, notebook, 'Lấy sổ từ vựng cá nhân thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async toggleMemorized(req, res, next) {
        try {
            const userId = req.user.userId;
            const wordId = req.params.wordId;
            const { isMemorized } = toggleMemorizedSchema.parse(req.body);
            const updated = await vocab_service_1.vocabService.toggleMemorized(userId, wordId, isMemorized);
            (0, api_response_1.sendSuccess)(res, updated, 'Cập nhật trạng thái ghi nhớ thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async createSet(req, res, next) {
        try {
            const set = await vocab_service_1.vocabService.createSet(req.body);
            (0, api_response_1.sendSuccess)(res, set, 'Tạo bộ từ vựng thành công', 201);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteSet(req, res, next) {
        try {
            await vocab_service_1.vocabService.deleteSet(req.params.id);
            (0, api_response_1.sendSuccess)(res, { success: true }, 'Xóa bộ từ vựng thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async createWord(req, res, next) {
        try {
            const word = await vocab_service_1.vocabService.createWord(req.params.id, req.body);
            (0, api_response_1.sendSuccess)(res, word, 'Thêm từ vựng thành công', 201);
        }
        catch (error) {
            next(error);
        }
    }
    async updateWord(req, res, next) {
        try {
            const word = await vocab_service_1.vocabService.updateWord(req.params.id, req.body);
            (0, api_response_1.sendSuccess)(res, word, 'Cập nhật từ vựng thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteWord(req, res, next) {
        try {
            await vocab_service_1.vocabService.deleteWord(req.params.id);
            (0, api_response_1.sendSuccess)(res, { success: true }, 'Xóa từ vựng thành công', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async importWords(req, res, next) {
        try {
            const result = await vocab_service_1.vocabService.importWords(req.params.id, req.body.words || []);
            (0, api_response_1.sendSuccess)(res, result, `Đã nhập thành công ${result.count} từ vựng vào bộ`, 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.VocabController = VocabController;
exports.vocabController = new VocabController();
