const models = require('./models');
models.message.belongsTo(models.users, { foreignKey: 'user_id' });
models.message.belongsTo(models.chat_room, { foreignKey: 'chat_room_id' });
const messageService = require('./api/src/message/messageService');
const { Op } = require("sequelize");
const userService = require('./api/src/user/userService');
const chat_roomService = require('./api/src/chat_room/chat_roomService');
const notificationService = require('./api/src/notifications/notiService');
const { image_response } = require('./api/helper/image');
const { notiFcm } = require('./api/helper/fcm');
const jwt = require('jsonwebtoken');
const { host } = require('./config/config.json');

function socketConnect({ io }) {
  io.on('connection', async (socket) => {
    const token = socket.handshake.query.token;
    if (typeof token === "undefined") {
      // Xử lý trường hợp token undefined ở đây
      console.log("Token Undefined");
    } else {
      let user_id;
      try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        user_id = decoded.id;
        socket.user_id = user_id;
        io.sockets.emit('user-online', user_id);
        let users = await models.users.update(
          { is_online: 1 },
          {
            where: {
              id: user_id,
              deleted: 0
            }
          }
        );
        return users;
      } catch (error) {
        socket.emit('login-error', 'Invalid token');
      }
    };

    //test chat 1-1
    socket.on('private-message', async (data) => {
      try {
        const { sender, receiver, content, image_url, document_file, chat_room_id } = data;
        const documentFile = JSON.stringify(document_file)
        let chat_room = await models.chat_room.findOne({
          where: {
            [Op.or]: [
              { sender: sender, receiver: receiver },
              { sender: receiver, receiver: sender }
            ],
            deleted: 0
          }
        });
        const rooms = socket.rooms;
        if (!rooms.has(chat_room_id)) {
          // Kết nối chưa tham gia phòng chat, thì tham gia vào phòng chat
          socket.join(chat_room_id);
        }
        const messageData = {
          chat_room_id: chat_room_id,
          content: content,
          sender: sender,
          user_id: sender,
          viewed_by: sender,
          image_url: image_url,
          document_file: documentFile,
          created_date: new Date()
        };
        let message = await models.message.create(messageData);
        await chat_roomService.update(message.chat_room_id, { updated_date: new Date() });
        let user = await models.users.findOne({
          where: {
            id: receiver,
            deleted: 0
          }
        });
        if (user.is_online == 0) {
          const senders = await userService.getById(sender);
          const payload = {
            notifications: {
              title: `${senders.full_name}`,
              body: `${message.content}`,
              name: `Thông báo tin nhắn từ: ${senders.full_name}`,
              content: `Thông báo tin nhắn từ: ${senders.full_name}`,
              type_id: message.id.toString(),
              type: "1",
              deep_link: `${host.host_deeplink}${host.api_deeplink['socket.io']}${message.id}`,
              user_id: receiver.toString()
            }
          };
          if(user.role == 1) {
            if (chat_room.is_notification_on_sender == 0 && chat_room.is_notification_on_receiver == 0) {
              const noti = await notificationService.create(payload.notifications);
              notiFcm(receiver, payload.notifications, noti.id);
            }
          }
        }
        let mess = await messageService.getByIdForChatRoom(message.id);
        if (mess.image_url !== null) {
          mess.image_url = image_response(mess.image_url)
        };
        if (mess.document_file !== null) {
          mess.document_file = JSON.parse(mess.document_file);
        }
        let response = mess;
        response.user_id = sender;
        if (mess) {
          const senders = await userService.getById(sender);
          const receivers = await userService.getById(receiver);
          if (senders) {
            response.chat_room.sender = senders
          }
          if (receivers) {
            response.chat_room.receiver = receivers
          }
        }
        io.sockets.to(chat_room_id).emit('send-message', response);
      } catch (error) {
        console.log(error);
      }
    });

    //Sự kiện người dùng offline
    socket.on('disconnect', async () => {
      if (socket.user_id) {
        await models.users.update({ is_online: 0 }, { where: { id: socket.user_id, deleted: 0 } });
        io.sockets.emit('user-offline', user);
      }
    });
  });
};

module.exports = socketConnect;  
