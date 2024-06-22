const Notification = require('../models/notification');

const addMessageToUserNotifications = async (userId, newMessage) => {
  try {
    // Tìm hoặc tạo mới thông báo cho người dùng
    let notification = await Notification.findOne({ user: userId });

    if (!notification) {
      notification = new Notification({
        user: userId,
        messages: [],
      });
    }

    // Thêm thông báo mới vào mảng messages
    notification.messages.push(newMessage);
    await notification.save();

    console.log('Added new message to user notifications:', notification);
    return notification; // Trả về thông báo đã được cập nhật
  } catch (error) {
    console.error('Error adding message to user notifications:', error);
    throw error; // Ném lỗi để xử lý ở phía gọi hàm
  }
};

const removeMessageFromUserNotifications = async (userId, messageIdToRemove) => {
  try {
    // Tìm thông báo của người dùng
    const notification = await Notification.findOne({ user: userId });
    if (!notification) {
      console.error('User notification not found');
      return;
    }

    // Xóa thông báo từ mảng messages
    notification.messages = notification.messages.filter(msg => msg !== messageIdToRemove);
    await notification.save();

    console.log('Removed message from user notifications:', notification);
    return notification; // Trả về thông báo đã được cập nhật
  } catch (error) {
    console.error('Error removing message from user notifications:', error);
    throw error; // Ném lỗi để xử lý ở phía gọi hàm
  }
};
const getNotificationCountAndMessagesByUser = async (userId) => {
    try {
      const notification = await Notification.findOne({ user: userId });
      if (notification) {
        return {
          count: notification.messages.length,
          messages: notification.messages,
        };
      } else {
        console.log('Notifications not found for user');
        return null; // Trả về null khi không tìm thấy thông báo
      }
    } catch (error) {
      console.error('Error getting notification count and messages:', error);
      throw error; // Ném lỗi để xử lý ở phía gọi hàm
    }
  };
  
  

module.exports = { addMessageToUserNotifications, removeMessageFromUserNotifications , getNotificationCountAndMessagesByUser};
