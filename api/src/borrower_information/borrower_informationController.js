const { responseSuccess, responseWithError } = require('../../helper/messageResponse');
const borrower_informationService = require('./borrower_informationService');
const notiService = require('../notifications/notiService');
const { notiFcm } = require('../../helper/fcm');
const loan_informationService = require('../loan_information/loan_informationService');
const loan_applicationService = require('../loan_application/loan_applicationService');
const { generateCode } = require('../../helper/generateCode');
const models = require('../../../models');
const logger = require('../../../winston');
const { Op } = require('sequelize');
const { host } = require('../../../config/config.json');
const { ErrorCodes } = require('../../helper/constants');

//create
exports.create = async (req, res) => {
    try {
        let data = {
            user_id: req.user.id,
            address_id: req.body.address_id,
            career_id: req.body.career_id,
            bank_id: req.body.bank_id,
            full_name: req.body.full_name,
            citizen_identification: req.body.citizen_identification,
            name_company: req.body.name_company,
            address_company: req.body.address_company,
            average_income: req.body.average_income,
            contact_person_name_1: req.body.contact_person_name_1,
            contact_person_name_2: req.body.contact_person_name_2,
            relationship_1: req.body.relationship_1,
            relationship_2: req.body.relationship_2,
            contact_person_phone_number_1: req.body.contact_person_phone_number_1,
            contact_person_phone_number_2: req.body.contact_person_phone_number_2,
            image_proof_of_residence: req.body.image_proof_of_residence,
            image_financial_documents: req.body.image_financial_documents,
            front_photo: req.body.front_photo,
            back_side_photo: req.body.back_side_photo,
            date_range: req.body.date_range,
            issued_by: req.body.issued_by,
            loan_purpose: req.body.loan_purpose,
            form_receiving_money: req.body.form_receiving_money,
            bank_account_name: req.body.bank_account_name,
            account_name: req.body.account_name,
            type: req.body.type
        };
        if (data.type == 1) {
            let loan_application = await models.loan_application.findAll({
                where: {
                    user_id: req.user.id,
                    deleted: 0
                }
            });
            let a = true;
            loan_application.map(async (ele) => {
                if (ele.status == 0 || ele.status == 1 || ele.status == 2 || ele.status == 4) {
                    a = false;
                };
                return ele;
            })
            if (a == true) {
                let result = await models.borrower_information.create(data);
                let loan_information = await loan_informationService.getIdByUserId(result.user_id);
                if (loan_information) {
                    let code = generateCode(15, result);
                    const time_loan_milliseconds = loan_information.time_loan * 24 * 60 * 60 * 1000;
                    let loan_appli = {
                        user_id: req.user.id,
                        borrower_information_id: result.id,
                        loan_information_id: loan_information.id,
                        application_date: result.created_date,
                        end_date: new Date(result.created_date.getMonth() + time_loan_milliseconds),
                        code_transaction: code
                    };
                    let newLoanApplicationId;
                    let loan_application = await models.loan_application.create(loan_appli);
                    let result_detail = await models.borrower_information.findOne({
                        where: {
                            id: result.id,
                            deleted: 0
                        }
                    });
                    const payload = {
                        notifications: {
                            title: `Thông báo tạo đơn vay thành công`,
                            body: `Yêu cầu vay của bạn đã được tạo thành công , vui lòng đợi xác nhận từ hệ thống`,
                            name: `Yêu cầu vay của bạn đã được tạo thành công , vui lòng đợi xác nhận từ hệ thống`,
                            content: `Yêu cầu vay của bạn đã được tạo thành công , vui lòng đợi xác nhận từ hệ thống`,
                            type_id: result_detail.id.toString(),
                            type: "2",
                            deep_link: `${host.host_deeplink}${host.api_deeplink.borrower_information}${result_detail.id}`,
                            user_id: result.user_id.toString()
                        }
                    };
                    const noti = await notiService.create(payload.notifications);
                    notiFcm(result.user_id, payload.notifications, noti.id);
                    newLoanApplicationId = loan_application.id;
                    const response = {
                        data: {
                            ...result_detail.dataValues,
                            loan_application_id: newLoanApplicationId
                        }
                    }
                    return res.json(responseSuccess(response, 'Thông tin vay của bạn được tạo thành công!'));
                } else {
                    return res.json(responseWithError({ message: 'Bạn không có yêu cầu vay nào. Hãy tạo yêu cầu vay!' }));
                }
            } else {
                res.json(responseWithError({ message: 'Ban đang có một hồ sơ đang trong quá trình xét duyệt và trả. Không thể tạo đơn vay mới đến khi bạn tất toán khoản vay!' }));
            }
        } else
            if (data.type == 2) {
                let loan_application = await models.loan_application.findAll({
                    where: {
                        user_id: req.user.id,
                        deleted: 0
                    }
                });
                const user = await models.users.findOne({
                    where: {
                        id: req.user.id
                    }
                });
                if (user && user.is_authenticated === 3) {
                    let a = true;
                    loan_application.map(async (ele) => {
                        if (ele.status == 0 || ele.status == 1 || ele.status == 2 || ele.status == 4) {
                            a = false;
                        };
                        return ele;
                    })
                    if (a == true) {
                        let result = await models.borrower_information.create(data);
                        let loan_information = await loan_informationService.getIdByUserId(result.user_id);
                        if (loan_information) {
                            let code = generateCode(15, result);
                            const time_loan_milliseconds = loan_information.time_loan * 24 * 60 * 60 * 1000;
                            let loan_appli = {
                                user_id: req.user.id,
                                borrower_information_id: result.id,
                                loan_information_id: loan_information.id,
                                application_date: result.created_date,
                                end_date: new Date(result.created_date.getMonth() + time_loan_milliseconds),
                                code_transaction: code
                            };
                            let newLoanApplicationId;
                            let loan_application = await models.loan_application.create(loan_appli);
                            let result_detail = await models.borrower_information.findOne({
                                where: {
                                    id: result.id,
                                    deleted: 0
                                }
                            });
                            const payload = {
                                notifications: {
                                    title: `Thông báo tạo đơn vay thành công`,
                                    body: `Yêu cầu vay của bạn đã được tạo thành công , vui lòng đợi xác nhận từ hệ thống`,
                                    name: `Yêu cầu vay của bạn đã được tạo thành công , vui lòng đợi xác nhận từ hệ thống`,
                                    content: `Yêu cầu vay của bạn đã được tạo thành công , vui lòng đợi xác nhận từ hệ thống`,
                                    type_id: result_detail.id.toString(),
                                    type: "2",
                                    deep_link: `${host.host_deeplink}${host.api_deeplink.borrower_information}${result_detail.id}`,
                                    user_id: result.user_id.toString()
                                }
                            };
                            const noti = await notiService.create(payload.notifications);
                            notiFcm(result.user_id, payload.notifications, noti.id);
                            newLoanApplicationId = loan_application.id;
                            const response = {
                                data: {
                                    ...result_detail.dataValues,
                                    loan_application_id: newLoanApplicationId
                                }
                            }
                            return res.json(responseSuccess(response, 'Thông tin vay của bạn được tạo thành công!'));
                        } else {
                            return res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST, 'Bạn không có yêu cầu vay nào. Hãy tạo yêu cầu vay!'));
                        }
                    } else {
                        res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_EXIST, 'Ban đang có một hồ sơ đang trong quá trình xét duyệt và trả. Không thể tạo đơn vay mới đến khi bạn tất toán khoản vay!'));
                    }
                } else {
                    return res.json(responseWithError(ErrorCodes.ERROR_CODE_USER_IS_AUTHENTICATED, 'Bạn cần xác thực thông tin của mình thì mới có thể sử dụng Vay nhanh!'));
                }
            }
    } catch (error) {
        logger.error('create borrower_information ', error);
        res.json(responseWithError(error));
    }
};

//updateInformation
exports.updateInformation = async (req, res) => {
    try {
        const userId = req.user.id;
        const borrowerInfoId = req.params.id;
        const existingRequest = await models.borrower_information.findOne({
            where: {
                id: borrowerInfoId,
                user_id: userId,
                deleted: 0
            }
        });
        if (!existingRequest) {
            return res.json(responseWithError(ErrorCodes.ERROR_CODE_ITEM_NOT_EXIST, "Yêu cầu không tồn tại hoặc đã bị xóa."));
        } else {
            const updatedData = {
                user_id: userId,
                address_id: req.body.address_id,
                career_id: req.body.career_id,
                bank_id: req.body.bank_id,
                full_name: req.body.full_name,
                citizen_identification: req.body.citizen_identification,
                name_company: req.body.name_company,
                address_company: req.body.address_company,
                average_income: req.body.average_income,
                contact_person_name_1: req.body.contact_person_name_1,
                contact_person_name_2: req.body.contact_person_name_2,
                relationship_1: req.body.relationship_1,
                relationship_2: req.body.relationship_2,
                contact_person_phone_number_1: req.body.contact_person_phone_number_1,
                contact_person_phone_number_2: req.body.contact_person_phone_number_2,
                image_proof_of_residence: req.body.image_proof_of_residence,
                image_financial_documents: req.body.image_financial_documents,
                front_photo: req.body.front_photo,
                back_side_photo: req.body.back_side_photo,
                date_range: req.body.date_range,
                issued_by: req.body.issued_by,
                loan_purpose: req.body.loan_purpose,
                form_receiving_money: req.body.form_receiving_money,
                bank_account_name: req.body.bank_account_name,
                account_name: req.body.account_name,
                type: req.body.type
            };
            await models.borrower_information.update(updatedData, {
                where: {
                    id: existingRequest.id,
                    deleted: 0
                }
            });
            const payload = {
                notifications: {
                    title: `Thông báo cập nhật thông tin thành công`,
                    body: `Bạn đã cập nhật thông tin thành công`,
                    name: `Bạn đã cập nhật thông tin thành công`,
                    content: `Bạn đã cập nhật thông tin thành công`,
                    type_id: existingRequest.id.toString(),
                    type: "2",
                    deep_link: `${host.host_deeplink}${host.api_deeplink.borrower_information}${existingRequest.id}`,
                    user_id: existingRequest.user_id.toString()
                }
            };
            const noti = await notiService.create(payload.notifications);
            notiFcm(existingRequest.user_id, payload.notifications, noti.id);
            res.json(responseSuccess());
        }
    } catch (error) {
        logger.error('update borrower_information ', error);
        res.json(responseWithError(error));
    }
};
