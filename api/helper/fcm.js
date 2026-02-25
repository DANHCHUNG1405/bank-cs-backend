const admin = require("firebase-admin");
const userDeviceService = require("../src/user_device/user_deviceService");

// send push notification to user
const sendNotification = async (userId, data, id) => {
  try {
    const device = await userDeviceService.getDeviceByUser(userId);
    if (!device) return [];

    const payload = {
      notification: {
        title: data.title,
        body: data.body,
        deep_link: data.deep_link,
      },
      data: { id: id.toString(), ...data },
    };

    return await admin.messaging().sendToDevice(device.token_device, payload);
  } catch (err) {
    throw err;
  }
};

// send to multiple users
const sendToMultipleUsers = async (userIds, data, id) => {
  const results = await Promise.allSettled(
    userIds.map((userId) => sendNotification(userId, data, id))
  );
  return results;
};

module.exports = {
  notiFcm: sendNotification,
  sendNotification,
  sendToMultipleUsers,
};
