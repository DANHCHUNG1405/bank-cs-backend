const models = require('../../../models');
const {Op} = require('sequelize');

//create
exports.create = async (data) => {
    let question = await models.question.create(data);
    let checkExisting = await models.question.findOne({
        where: {
            id: { [Op.ne]: question.id },
            user_id: question.user_id,
            category_id: question.category_id,
            content_question: question.content_question,
            status: 1,
            deleted: 0
        }
    });
    if (checkExisting) {
        await models.question.destroy({ where: { id: checkExisting.id } });
    }
    return question;
};

//getById
exports.getById = async(id) => {
    return await models.question.findOne({
        where: { 
            id: id,
            deleted: 0
        },
        include: [{
            model: models.category,
            attributes: ["id", "image_url", "topic_name"]
        },{
            model: models.answer_question,
            attributes: ["id", "content_answer"]
        }],
        attributes: {exclude: ["created_by", "updated_by"]}
    });
}