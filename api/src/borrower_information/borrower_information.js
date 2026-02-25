const {Sequelize, DataTypes} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    let borrower_information = sequelize.define('borrower_information', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER(4),
        },
        user_id: { 
            type: Sequelize.INTEGER(4)
        },
        address_id: {
            type: Sequelize.INTEGER(4),
        },
        career_id: {
            type: Sequelize.INTEGER(4),
        },
        bank_id: {
            type: Sequelize.INTEGER(4)
        },
        full_name: { 
            type: Sequelize.STRING(50)
        },
        citizen_identification: { 
            type: Sequelize.STRING(25),
        },
        name_company: {
            type: Sequelize.STRING(255),
        },
        address_company: { 
            type: Sequelize.STRING(255),
        },
        average_income: { 
            type: Sequelize.INTEGER(15),
        },
        contact_person_name_1: { 
            type: Sequelize.STRING(50),
        },
        relationship_1: { 
            type: Sequelize.INTEGER(4),
        },
        contact_person_phone_number_1: {
            type: Sequelize.STRING(15),
        },
        contact_person_name_2: { 
            type: Sequelize.STRING(50),
        },
        relationship_2: { 
            type: Sequelize.INTEGER(4),
        },
        contact_person_phone_number_2: {
            type: Sequelize.STRING(15),
        },
        image_proof_of_residence: { 
            type: Sequelize.STRING(255)
        },
        image_financial_documents: {
            type: Sequelize.STRING(255),
        },
        bank_account_number: {
            type: Sequelize.STRING(25)
        },
        account_name: {
            type: Sequelize.STRING(255)
        },
        date_range: {
            type: Sequelize.DATE
            //ngày cấp CCD/CMTND
        },
        issued_by: {
            type: Sequelize.STRING(255),
            //nơi cấp
        },
        front_photo: { 
            type: Sequelize.TEXT('long')
            //ảnh mặt trước
        },
        back_side_photo: {
            type: Sequelize.TEXT('long')
            //ảnh mặt sau
        }, 
        loan_purpose: { 
            type: Sequelize.INTEGER(5),
        },
        form_receiving_money:  {
            type: Sequelize.INTEGER(2),
        },
        type: {
            type: Sequelize.INTEGER(2)
        },
        status: {
            type: Sequelize.INTEGER(2),
            defaultValue: 0
        },
        deleted: {
            type: Sequelize.INTEGER(2),
            defaultValue: 0
        },
        created_date: {
            type: Sequelize.DATE,
            defaultValue: DataTypes.NOW,
        },
        created_by: {
            type: Sequelize.STRING(255)
        },
        updated_by: {
            type: Sequelize.STRING(255)
        },
        updated_date: {
            type: Sequelize.DATE,
            defaultValue: DataTypes.NOW,
        },
    },{
        timestamps: false
    });
    return borrower_information;
}