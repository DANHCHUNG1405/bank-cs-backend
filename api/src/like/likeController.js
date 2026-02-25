const likeService = require('./likeService');
const models = require('../../../models');
const logger = require('../../../winston');
const { responseWithError, responseSuccess } = require('../../helper/messageResponse');
const productService = require('../product/productService');
const Paginator = require('../../commons/paginator');
const { image_response } = require('../../helper/image');
const answer_questionService = require('../answer_question/answerService');

//createLike
exports.create = async (req, res) => {
    try {
        req.body.user_id = req.user.id;
        let condition = { 
            user_id: req.user.id
        };
        if (req.body.product_id) {
            condition.product_id = req.body.product_id;
        };
        if(req.body.answer_question_id) {
            condition.answer_question_id = req.body.answer_question_id
        }
        let like = await models.like.findOne({
            where: condition
        });
        if(like) {
            await models.like.destroy({
                where: condition
            });

            //Like Product
            if(req.body.product_id) {
                let product = await productService.getById(req.body.product_id, req.user.id);
                let product_like = product.dataValues;
                product.total_like -=1;
                await productService.update(req.body.product_id, product_like);
            };
            if(req.body.answer_question_id) {
                let answer_question = await answer_questionService.getById(req.body.answer_question_id, req.user.id);
                let answer_like = answer_question.dataValues;
                answer_like.total_like -=1;
                await answer_questionService.update(req.body.answer_question_id, answer_like);
            };
            const data = {
                like: 0
            }
            res.json(responseSuccess(data, "Đã bỏ yêu thích sản phẩm")); //Bỏ like
        }else{
            //Like Product
            if(req.body.product_id) {
                let product = await productService.getById(req.body.product_id, req.user.id);
                let product_like = product.dataValues;
                product_like.total_like +=1;
                await productService.update(req.body.product_id, product_like);
                await models.like.create(req.body);
            };
            if(req.body.answer_question_id) {
                let answer = await answer_questionService.getById(req.body.answer_question_id, req.user.id);
                let answer_like = answer.dataValues;
                answer_like.total_like +=1;
                await answer_questionService.update(req.body.answer_question_id, answer_like);
                await models.like.create(req.body);
            };
            const data = {
                like: 1
            };
            res.json(responseSuccess(data, "Đã yêu thích sản phẩm")); //Đã like
        }
    } catch (error) {
        logger.error('create likeProduct', error);
        res.json(responseWithError(error));
    }
};

//getMyCarLike
exports.getMyCarLike = async (req, res) => {
    try {
        const page = parseInt(req.query.page_index) || 1;
        const size = parseInt(req.query.page_size);
        const { limit, offset } = Paginator.getPagination(page, size);
        const query = req.query;
        const condition = {
            limit,
            offset,
            query,
            user_id: req.user.id
        }; 
        let data = await likeService.getProductByUserId(condition);
        const response = Paginator.getPagingData(data, page, limit);
        const result = response.rows.map(ele => {
            if(ele.product.image_url) {
                ele.product.image_url = image_response(ele.product.image_url)
            };
            return ele;
        })
        res.json(responseSuccess({ total_items: response.total_items, total_pages: response.total_pages, current_page: response.current_page, data: result }));
    } catch (error) {
        logger.error('getMyLike car', error);
        res.json(responseWithError(error))
    }
};