const {Sequelize, DataTypes} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    let like = sequelize.define('like', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER(4),
        },
        user_id: { 
            type: Sequelize.INTEGER(4)
        },
        product_id: { 
            type: Sequelize.INTEGER(4)
        },
        answer_question_id: { 
            type: Sequelize.INTEGER(4)
        },
        is_like: { 
            type: Sequelize.INTEGER(2),
            defaultValue: 1
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
    return like;
}