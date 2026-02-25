const messageService = require('./messageService');
const userService = require('../user/userService');
const { responseSuccess, responseWithError } = require("../../helper/messageResponse");
const { checkAccessToken, checkAccessTokenorNot } = require('../../middlewares/jwt_token');
const { image_response } = require('../../helper/image');
const Paginator = require("../../commons/paginator");
const { ErrorCodes } = require("../../helper/constants");
const { Op } = require('sequelize');
const models = require('../../../models');
const chat_roomService = require('../chat_room/chat_roomService');
const logger = require('../../../winston');

//Create message
exports.create = async (req, res) => {
    try {
        const bind = {
            content: req.body.content,
            chat_room_id: req.body.chat_room_id,
            user_id: req.user.id,
        };
        let result = await messageService.create(bind);
        res.json(responseSuccess(result));
    } catch (error) {
        logger.error('create message', error);
        res.json(responseWithError(error));
    }
};

//deleteMessages
exports.delete = async (req, res) => {
    try {
        req.body.user_id = req.user.id;
        const id = req.params.id;
        let message = await messageService.getById(id);
        if (req.user.id == message.user_id) {
            await messageService.softDelete(message.id).then((data) => {
                if (data == 1) {
                    res.json(responseSuccess())
                } else {
                    res.json(responseWithError())
                }
            }).catch((err) => {
                return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
            })
        }
        else {
            res.json('Not Allowed!!!');
        }
    } catch (error) {
        logger.error('delete message', error);
        res.json(responseWithError())
    }
}

//getById 
exports.getById = async (req, res) => {
    try {
        let { chat_room_id, message_id } = req.params;
        let chat_room = await chat_roomService.getById(chat_room_id);
        if (chat_room) {
            let data = await models.message.findOne({
                where: {
                    id: message_id,
                    chat_room_id: chat_room.id,
                    deleted: 0
                },
                include: [{
                    model: models.chat_room,
                    attributes: ["id", "sender", "receiver", "type"]
                }]
            });
            let sender = await userService.getById(chat_room.sender);
            let receiver = await userService.getById(chat_room.receiver);
            if (data) {
                data.chat_room.sender = sender
                data.chat_room.receiver = receiver
            }
            res.json(responseSuccess(data));
        } else {
            res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST,'Chat_room do not exist!'));
        }
    } catch (error) {
        logger.error('getById message', error);
        res.json(responseWithError(error))
    }
};

//viewMessage       
exports.viewMessage = async (req, res) => {
    try {
        let message;
        let chat_room = await chat_roomService.getById(req.body.chat_room_id);
        let data = {
            chat_room_id: req.body.chat_room_id,
            user_id: req.user.id,
            message_id: req.body.message_id
        }
        if (chat_room) {
            message = await models.message.findOne({
                where: {
                    chat_room_id: chat_room.id,
                    id: data.message_id,
                    deleted: 0
                }
            });
        } else {
            message = await models.message.findOne({
                where: {
                    chat_room_id: data.chat_room_id,
                    id: data.message_id,
                    deleted: 0
                }
            });
        }
        if (message) {
            const viewed_by = message.viewed_by ? message.viewed_by.split(',') : [];
            if (!viewed_by.includes(String(data.user_id))) {
                viewed_by.push(String(data.user_id));
                message.viewed_by = viewed_by.join(',');
                await messageService.update({ is_seen: 1, viewed_by: message.viewed_by, updated_date: new Date() }, { id: message.id, deleted: 0 });
                res.json(responseSuccess());
            } else {
                res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_EXIST,"Người dùng đã xem tin nhắn!"));
            }
        } else {
            res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST,"Tin nhắn không tồn tại!"));
        }
    } catch (error) {
        logger.error('view message', error);
        res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', error));
    }
};

//search
exports.getMessages = async (req, res) => {
    try {
        let query = req.query;
        let condition = {
            query
        };
        let data = await messageService.search(condition);
        if (data.length == 0) {
            res.json(responseSuccess([]));
        } else {
            if (req.query.content && req.query.content != '') {
                const filterData = data.filter(item => {
                    let strToFind = req.query.content;
                    function removeDiacritics(str) {
                        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    }
                    function isSubstring(s, strToFind) {
                        return removeDiacritics(s.toLowerCase()).includes(removeDiacritics(strToFind.toLowerCase()));
                    }
                    const contentExists = item.dataValues.hasOwnProperty('content') && typeof item.dataValues['content'] === 'string';
                    return (contentExists && isSubstring(item.content, strToFind));
                });
                data = filterData;
            };
            if (req.query.image === 'image') {
                // Lọc ra các bản ghi có image_url không null và không trống
                data = data.filter(mess => mess.image_url !== null && mess.image_url !== '');
                // Chỉ chọn trường image_url
                data = data.map(mess => ({ image_url: mess.image_url }));
            };
            if (req.query.file === 'file') {
                // Lọc ra các bản ghi có document_file không null và không trống
                data = data.filter(mess => mess.document_file !== null && mess.document_file !== '');
                // Chỉ chọn trường document_file
                data = data.map(mess => ({ document_file: JSON.parse(mess.document_file) }));
            };
            if (req.query.link === 'link') {
                // Lọc và chọn trường "content" của các tin nhắn dạng liên kết
                data = data.filter(item => { return (item.content && item.content.match(/http[s]?:\/\/[^\s]+/)) })
                data = data.map(item => item.content);
            }
            data.map(ele => {
                if (ele.image_url) {
                    ele.image_url == image_response(ele.image_url)
                };
                data.map(ele => {
                    if (ele.document_file && typeof ele.document_file !== 'object') {
                        try {
                            const parsedDocumentFile = JSON.parse(ele.document_file);
                            ele.document_file = parsedDocumentFile;
                        } catch (error) {
                            // Xử lý lỗi ở đây nếu cần
                            // Đặt giá trị mặc định cho ele.document_file nếu có lỗi
                            ele.document_file = null;
                        }
                    }
                })
            })
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
        logger.error('search message', error);
        res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', error));
    }
};




