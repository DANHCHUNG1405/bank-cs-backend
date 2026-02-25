const {Sequelize ,DataTypes } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
    let message = sequelize.define('message', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER(4),
        },
        user_id: {
            type: Sequelize.INTEGER(4)
        },
        content: { 
            type: Sequelize.STRING(10000)
        },
        chat_room_id: {
            type: Sequelize.INTEGER(4)
        },
        parent_id: {
            type: Sequelize.INTEGER(4),
            defaultValue: 0
        },
        image_url: {
            type: Sequelize.STRING(1024)
        },
        document_file: {
            type: Sequelize.STRING(1024)
        },
        name: {
            type: Sequelize.STRING(255)
        },
        file_type: {
            type: Sequelize.STRING(50)
        },
        size: {
            type: Sequelize.STRING(50)
        },
        is_seen: {
            type: Sequelize.INTEGER(2),
            defaultValue: false
        },
        status: {
            type: Sequelize.INTEGER(2),
            defaultValue: 1
        },
        deleted: {
            type: Sequelize.INTEGER(2),
            defaultValue: 0
        },
        viewed_by: { 
            type: Sequelize.STRING(1024)
        },
        created_date: { 
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updated_date: { 
            type: Sequelize.DATE,
            allowNull: true,
        }
    },{
        timestamps: false
    });
    return message;
}