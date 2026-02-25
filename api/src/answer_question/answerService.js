const models = require('../../../models');
const {Op} = require('sequelize');

//answer
exports.answer = async (data) => {
    let answer = await models.answer_question.create(data);
    let checkExisting = await models.answer_question.findOne({
        where: {
            id: { [Op.ne]: answer.id },
            user_id: answer.user_id,
            question_id: answer.question_id,
            content_answer: answer.content_answer,
            status: 1,
            deleted: 0
        }
    });
    if (checkExisting) {
        await models.answer_question.destroy({ where: { id: checkExisting.id } });
    }
    return answer;
};

//getById
exports.getById = async(id) => {
    return await models.answer_question.findOne({
        where: {
            id: id,
            deleted: 0
        }
    })
};

//update
exports.update = async (id, data) => {
    return await models.answer_question.update(data, {
        where: {
            id: id,
            deleted: 0
        }
    })
};