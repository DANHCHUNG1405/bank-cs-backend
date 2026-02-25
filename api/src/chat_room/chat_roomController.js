const chat_rommService = require('./chat_roomService');
const messageService = require('../message/messageService');
const { ErrorCodes } = require("../../helper/constants");
const Paginator = require('../../commons/paginator');
const { responseSuccess, responseWithError, } = require("../../helper/messageResponse");
const { image_response } = require('../../helper/image');
const models = require('../../../models');
const userService = require('../user/userService');
const { Op } = require('sequelize');
const logger = require('../../../winston');

//createPrivate
exports.create = async (req, res) => {
    try {
        let receiver = await userService.getById(req.body.receiver);
        if (receiver) {
            let data = {
                sender: req.body.sender,
                receiver: req.body.receiver
            }
            let result = await chat_rommService.createPrivate(data);
            res.json(responseSuccess({
                id: result.id,
                sender: result.sender,
                receiver: result.receiver
            }));
        } else {
            res.json(responseWithError(ErrorCodes.ERROR_CODE_USER_DONT_EXIST, `Người dùng ${data.receiver} không tồn tại`));
        }
    } catch (error) {
        logger.error('create chat_room', error);
        res.json(responseWithError(error));
    }
};

//delete chat_room
exports.delete = async (req, res) => {
    try {
        const { chat_room_id } = req.params;
        let chat_room = await models.chat_room.findOne({
            where: {
                id: chat_room_id,
                [Op.or]: [
                    { sender: req.user.id },
                    { receiver: req.user.id }
                ],
                deleted: 0
            }
        });
        if(chat_room) { 
            await chat_rommService.deletePrivate(chat_room.id).then(async (data) => {
                if (data == 1) {
                    await messageService.delete({ chat_room_id: chat_room_id, deleted: 0 });
                    res.json(responseSuccess(data.message,'Xoá cuộc trò chuyện thành công!'));
                } else {
                    res.json(responseWithError())
                }
            }).catch((err) => {
                return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
            })
        }else{
            res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST,'Chat_room không tồn tại!'));
        }
    } catch (error) {
        logger.error('delete chat_room', error);
        return res.json(responseWithError(ErrorCodes.ERROR_CODE_SYSTEM_ERROR, 'error', err));
    }
}

//getById
exports.getById = async (req, res) => {
    try {
        const id = req.params.id;
        let chat_room = await chat_rommService.getById(id);
        if (chat_room) {
            let sender = await userService.getById(chat_room.sender);
            let receiver = await userService.getById(chat_room.receiver);
            chat_room.messages.map(ele => {
                if(ele.document_file !== null) {
                    ele.document_file = JSON.parse(ele.document_file)
                }
            });
            chat_room = {
                ...chat_room.dataValues,
                sender,
                receiver
            };
            res.json(responseSuccess(chat_room));
        }else{
            res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST,'Chat_room không tồn tại!'));
        }
    } catch (error) {
        logger.error('getById chat_room', error);
        res.json(responseWithError(error))
    }
};

//getMyChatRoom
exports.getAll = async (req, res) => {
    try {
        const query = req.query;
        let condition = {
            query,
            user_id: req.user.id
        };
        let data = await chat_rommService.getAll(condition);
        if (!data) {
            res.json(responseSuccess([]));
        } else {
            let chat = await Promise.all(data.map(async ele => {
                if (ele.sender && ele.receiver) {
                    ele.messages.map(item => {
                        if(item.document_file !== null) {
                            item.document_file = JSON.parse(item.document_file)
                        };
                    });
                    let sender = await userService.getById(ele.sender);
                    let receiver = await userService.getById(ele.receiver);
                    return {
                        ...ele.dataValues,
                        sender,
                        receiver
                    }
                };
                return ele.dataValues
            }));
            data = chat;
            if(req.query.name && req.query.name != '') {
                let strToFind = req.query.name;
                function isSubstring(s, strToFind) {
                    return s.includes(strToFind);
                }
                const filteredData = data.rows.filter(item => {
                    const senderExists = item.hasOwnProperty('sender') && item['sender'] && typeof item['sender']['full_name'] === 'string';
                    const receiverExists = item.hasOwnProperty('receiver') && item['receiver'] && typeof item['receiver']['full_name'] === 'string';
                    // Thực hiện kiểm tra và trả về kết quả
                    return (senderExists && isSubstring(item.sender.full_name, strToFind)) || (receiverExists && isSubstring(item.receiver.full_name, strToFind));
                });
                item = filteredData;
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
            // const response = Paginator.getPagingData(data, page, limit);
            // const result = await Promise.all(response.rows.map( async ele => {
            //     if (ele.sender && ele.receiver) {
            //         let sender = await userService.getById(ele.sender);
            //         let receiver = await userService.getById(ele.receiver);
            //         return {
            //             ...ele.dataValues,
            //             sender,
            //             receiver
            //         }
            //     };
            //     if(ele.image_url) { 
            //         ele.image_url = image_response(ele.image_url)
            //     };
            //     return ele.dataValues
            // }));
            // res.json(responseSuccess({ total_items: response.total_items, total_pages: response.total_pages, current_page: response.current_page, data: result }));
        }
    } catch (error) {
        logger.error('getMy chat_room', error);
        res.json(responseWithError(error));
    }
};

//onOffNoti
exports.updateNotiStatus = async (req, res) => {
    try {
        let { chat_room_id } = req.params;
        let chat_room = await chat_rommService.getById(chat_room_id);
        if (chat_room) {
            if (chat_room.sender === req.user.id) {
                const is_notification_on_sender = chat_room.is_notification_on_sender === 1 ? 0 : 1;
                await models.chat_room.update(
                    { is_notification_on_sender },
                    { where: { id: chat_room.id, deleted: 0 } }
                );
                res.json(responseSuccess(is_notification_on_sender.message, is_notification_on_sender?'Bật thông báo thành công!' : 'Tắt thông báo thành công'));
            } else if (chat_room.receiver === req.user.id) {
                const is_notification_on_receiver = chat_room.is_notification_on_receiver === 1 ? 0 : 1;
                await models.chat_room.update(
                    { is_notification_on_receiver },
                    { where: { id: chat_room.id, deleted: 0 } }
                );
                res.json(responseSuccess(is_notification_on_receiver.message, is_notification_on_receiver?'Bật thông báo thành công!' : 'Tắt thông báo thành công'));
            } else {
                res.json(responseWithError());
            }
        }else{
            res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST,'Chat_room không tồn tại!'));
        }
    } catch (error) {
        logger.error('updateNotificationStatus', error);
        res.json(responseWithError(error));
    }
};



