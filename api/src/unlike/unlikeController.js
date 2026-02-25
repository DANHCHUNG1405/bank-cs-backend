const models = require('../../../models');
const logger = require('../../../winston');
const { responseWithError, responseSuccess } = require('../../helper/messageResponse');
const answer_questionService = require('../answer_question/answerService');

//createUnLike
exports.create = async (req, res) => {
    try {
        req.body.user_id = req.user.id;
        let condition = { 
            user_id: req.user.id
        };
        if(req.body.answer_question_id) {
            condition.answer_question_id = req.body.answer_question_id
        }
        let un_like = await models.unlike.findOne({
            where: condition
        });
        if(un_like) {
            await models.unlike.destroy({
                where: condition
            });
            if(req.body.answer_question_id) {
                let answer_question = await answer_questionService.getById(req.body.answer_question_id, req.user.id);
                let answer_like = answer_question.dataValues;
                answer_like.total_unlike -=1;
                await answer_questionService.update(req.body.answer_question_id, answer_like);
            };
            const data = {
                un_like: 0
            }
            res.json(responseSuccess(data, "Đã bỏ un_like sản phẩm")); //Bỏ un_like
        }else{
            if(req.body.answer_question_id) {
                let answer = await answer_questionService.getById(req.body.answer_question_id, req.user.id);
                let answer_like = answer.dataValues;
                answer_like.total_unlike +=1;
                await answer_questionService.update(req.body.answer_question_id, answer_like);
                await models.unlike.create(req.body);
            };
            const data = {
                un_like: 1
            };
            res.json(responseSuccess(data, "Đã un_like sản phẩm")); //Đã un_like
        }
    } catch (error) {
        logger.error('create un_likeQuestion', error);
        res.json(responseWithError(error));
    }
};