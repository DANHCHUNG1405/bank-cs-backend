const models = require('../../../models');
const questionService = require('./questionService');
const logger = require('../../../winston');
const { responseWithError, responseSuccess } = require('../../helper/messageResponse');
const { checkAccessTokenorNot } = require('../../middlewares/jwt_token');
const { ErrorCodes } = require('../../helper/constants');
models.question.belongsTo(models.category, {foreignKey: 'category_id'});
models.category.hasMany(models.question, {foreignKey: 'category_id'});
models.answer_question.belongsTo(models.question, {foreignKey: 'question_id'});
models.question.hasOne(models.answer_question, {foreignKey: 'question_id'});

//create
exports.create = async (req, res) => {
    try {
        let data = { 
            user_id: req.user.id,
            category_id: req.body.category_id,
            content_question: req.body.content_question
        };
        let result = await questionService.create(data);
        res.json(responseSuccess(result,'Tạo câu hỏi thành công!'));
    } catch (error) {
        logger.error('create question', error);
        res.json(responseWithError(error));
    }
};

//getById
exports.getById = async(req, res) => {
    try {
        const id = req.params.id;
        let user = await checkAccessTokenorNot(req);
        let data = await models.question.findOne({
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
        let answer = {};
        if (data) {
            // Tìm câu trả lời nếu có
            answer = await models.answer_question.findOne({
                where: {
                    question_id: data.id,
                    deleted: 0
                }
            });
        };
        if(user) {
            let answer = await models.answer_question.findOne({
                where: {
                    question_id: data.id,
                    deleted: 0
                }
            });
            if (answer !== null) {
                let answer_like = await models.like.findOne({
                    where: {
                        user_id: req.user.id,
                        answer_question_id: answer.id
                    }
                });
                let answer_un_like = await models.unlike.findOne({
                    where: {
                        user_id: req.user.id,
                        answer_question_id: answer.id
                    }
                });
                data = {
                    ...data.dataValues,
                    is_like: answer_like ? 1 : 0,
                    is_unlike: answer_un_like ? 1 : 0
                }
            }
        };
        res.json(responseSuccess(data));
    } catch (error) {
        logger.error('getById question', error);
        res.json(responseWithError(error));
    }
};

//getAllPAging
exports.getAllPaging = async(req, res) => {
    try {
        let data = await models.question.findAll({
            where: {
                deleted: 0
            },
            include: [{
                model: models.answer_question,
                attributes: ["id", "total_like","total_unlike"],
                order: [["total_like", "DESC"]]
            }]
        });
        // Loại bỏ các câu hỏi không có câu trả lời
        data = data.filter(question => question.answer_question !== null && question.answer_question !== undefined && question.answer_question !== '');
        if(data.length == 0) {
            res.json(responseSuccess([]))
        }else{
            if(req.query.category_id) {
                data = data.filter(d => d.category_id === parseInt(req.query.category_id))
            };
            if (req.query.content_question && req.query.content_question != '') {
                const filterData = data.filter(item => {
                    let strToFind = req.query.content_question;
                    function removeDiacritics(str) {
                        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    }
                    function isSubstring(s, strToFind) {
                        return removeDiacritics(s.toLowerCase()).includes(removeDiacritics(strToFind.toLowerCase()));
                    }
                    const contentExists = item.dataValues.hasOwnProperty('content_question') && typeof item.dataValues['content_question'] === 'string';
                    return (contentExists && isSubstring(item.content_question, strToFind));
                });
                data = filterData;
            };
            const currentPage = parseInt(req.query.page_index) || 1;
            const perPage = parseInt(req.query.page_size);
            const totalItems = data.length;
            const startIndex = (currentPage - 1) * perPage;
            const endIndex = currentPage * perPage;
            const paginatedData = data.slice(startIndex, endIndex);
            const totalPages = Math.ceil(totalItems / perPage);
            const response = {
                total_items: totalItems,
                total_pages: totalPages,
                current_page: currentPage,
                data: paginatedData
            };
            res.json(responseSuccess(response));
        }
    } catch (error) {
        logger.error('getAllPaging question', error);
        res.json(responseWithError(error));
    }
};

//delete
exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        let data = await models.question.findOne({
            where: {
                id: id,
                deleted: 0
            }
        });
        if(data) {
            await models.question.update({deleted: 1},{where:{id: id, deleted: 0}});
            res.json(responseSuccess(data.message, 'Xoá câu hỏi thành công!'));
        }else {
            res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST, 'Câu hỏi không tồn tại!'));
        }
    } catch (error) {
        logger.error('delete question', error);
        res.json(responseWithError(error));
    }
}
