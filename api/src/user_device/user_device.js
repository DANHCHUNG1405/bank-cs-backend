const { Sequelize, DataTypes } = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    let user_device = sequelize.define(
        "user_device",
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER(4),
            },
            user_id: {
                type: Sequelize.INTEGER(4)
            },
            unique_id: {
                type: Sequelize.STRING(255)
            },
            token_device: {
                type: Sequelize.STRING(1024),
            },
            device_name: {
                type: Sequelize.STRING(1024)
            },
            status: {
                type: Sequelize.INTEGER(2),
                defaultValue: true,
            },
            deleted: {
                type: Sequelize.INTEGER(2),
                defaultValue: false,
            },
            created_date: {
                type: Sequelize.DATE,
                allowNull: false,
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
    return user_device;
};
