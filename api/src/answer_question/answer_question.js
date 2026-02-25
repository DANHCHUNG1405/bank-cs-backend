"use strict";
const { Sequelize, DataTypes } = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    let answer_question = sequelize.define(
        "answer_question",
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER(4),
            },
            user_id : { 
                type: Sequelize.INTEGER(4)
            },
            question_id: { 
                type: Sequelize.INTEGER(4)
            },
            content_answer: {
                type: Sequelize.STRING
            },
            total_like: {
                type: Sequelize.INTEGER(4),
                defaultValue: 0
            },
            total_unlike: { 
                type: Sequelize.INTEGER(4),
                defaultValue: 0
            },
            status: {
                type: Sequelize.INTEGER(2),
                defaultValue: 1,
            },
            deleted: {
                type: Sequelize.INTEGER(2),
                defaultValue: false,
            },
            created_date: {
                type: Sequelize.DATE,
                defaultValue: DataTypes.NOW,
            },
            created_by: {
                type: Sequelize.STRING(255),
            },
            updated_date: {
                type: Sequelize.DATE,
            },
            updated_by: {
                type: Sequelize.STRING(255),
            },
        },
        {
            timestamps: false,
        }
    );
    return answer_question;
};
