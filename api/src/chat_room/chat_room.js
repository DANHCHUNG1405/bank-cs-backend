const {Sequelize, DataTypes} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    let chat_room = sequelize.define('chat_room', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER(4),
        },
        avatar: {
            type: Sequelize.STRING(1024)
        },
        sender: { 
            type: Sequelize.INTEGER(4)
        },
        receiver: { 
            type: Sequelize.INTEGER(4)
        },
        is_notification_on_sender: { 
            type: Sequelize.INTEGER(2),
            defaultValue: 0
        },
        is_notification_on_receiver: { 
            type: Sequelize.INTEGER(2),
            defaultValue: 0
        },
        status: {
            type: Sequelize.INTEGER(2),
            defaultValue: 1
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
    return chat_room;
}