const {Sequelize, DataTypes} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    let unlike = sequelize.define('unlike', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER(4),
        },
        user_id: { 
            type: Sequelize.INTEGER(4)
        },
        answer_question_id: { 
            type: Sequelize.INTEGER(4)
        },
        is_unlike: { 
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
    return unlike;
}