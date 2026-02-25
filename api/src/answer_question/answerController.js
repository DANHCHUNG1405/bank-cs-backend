const models = require('../../../models');
const {Op} = require('sequelize');
const logger = require('../../../winston');
const { responseWithError, responseSuccess } = require('../../helper/messageResponse');
const anserService = require('./answerService');

//answer
exports.answer = async (req, res) => {
    try {
        let data = { 
            user_id: req.user.id,
            question_id: req.body.question_id,
            content_answer: req.body.content_answer
        };
        let result = await anserService.answer(data);
        res.json(responseSuccess(result));
    } catch (error) {
        logger.error('answer question', error);
        res.json(responseWithError(error));
    }
};

//update
exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        let data = { 
            user_id: req.user.id,
            content_answer: req.body.content_answer
        };
        await models.answer_question.update(data, {
            where: {
                id: id,
                deleted: 0
            }
        });
        res.json(responseSuccess());
    } catch (error) {
        logger.error('update answer', error);
        res.json(responseWithError(error));
    }
};

//delete
exports.delete = async(req, res) => {
    try {
        const id = req.params.id;
        let data = await models.answer_question.update({deleted: 1} ,{
            where: {
                id: id,
                deleted: 0
            }
        });
        res.json(responseSuccess(data, 'Xoá câu trả lời thành công!'));
    } catch (error) {
        logger.error('delete answer', error);
        res.json(responseWithError(error));
    }
}

