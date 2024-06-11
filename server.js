const app = require("./app");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const { v4: uuidv4 } = require("uuid");
process.on("uncaughtException", (err) => {
  console.log(err);
  process.exit(1);
});
const mongoose = require("mongoose");
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io"); // Add this
const User = require("./models/user");
const { error } = require("console");
const FriendRequest = require("./models/friendRequest");
const { stat } = require("fs");
const DB = process.env.DBURL.replace("<PASSWORD", process.env.DBPASSWORD);

// Create an io server and allow for CORS from http://localhost:3000 with GET and POST methods
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});





mongoose.connect(DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('Successful to connect database');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });
// Listen for when the client connects via socket.io-client
io.on("connection", async (socket) => {
  ///bắt tay với client

  const user_id = socket.handshake.query["user_id"];
  console.log(`User connected ${socket.id}`);
  if (user_id != null && Boolean(user_id)) {
    try {
     await User.findByIdAndUpdate(user_id, {
        socket_id: socket.id,
        status: "Online",
      
      });
      
   
    } catch (e) {
      console.log(e);
    }
  }

  //   // Gửi sự kiện 'direct_conversations_updated' với danh sách cuộc trò chuyện mới cho tất cả các client
  //   socket.on("direct_conversations_updated", (conversations) => {
  //     io.emit("direct_conversations_updated", conversations);
  //   });
  //   /// gửi lời mời kết bạn
  socket.on('friend_request', async (data) => {
    try {
      console.log("Data received on server:", data);
      const to = await User.findById(data.to).select("socket_id");
      const from = await User.findById(data.from).select("socket_id");

      console.log("To:", to); 
      console.log("From:", from);
      // await FriendRequest.create({
      //   sender: data.from,
      //   recipient: data.to,
      // });

      io.to(to?.socket_id).emit("new_friend_request", {
        message: "New friend request received",
      });
      io.to(from?.socket_id).emit("request_sent", {
        message: "Request Sent successfully!",
      });
    } catch (error) {
      console.error("Error:", error);
    }
  });
  

  //   socket.on("accept_request", async (data) => {
  //     try {
  //       await updateFriendRequest(data.from, data.to, "1");
  //       await updateFriendRequest(data.to, data.from, "1");
  //     } catch (error) {
  //       console.error("Error:", error);
  //     }
  //   });

  //   socket.on("get_direct_conversations", async ({ user_id }, callback) => {
  //     try {
  //       const existing_conversations = await findUserConversations(user_id);
  //       callback(existing_conversations);
  //     } catch (error) {
  //       console.error("Error:", error);
  //       callback({
  //         error: "An error occurred while fetching direct conversations.",
  //       });
  //     }
  //   });

  //   socket.on("start_conversation", async (data, callback) => {
  //     const { to, from } = data;

  //     try {
  //       const channel_id = await getChannelIDByFriendID(from, to);
  //       let new_chat = await addOneToOneMessage(channel_id, from, to);
  //       console.log("Cuộc trò chuyện mới", new_chat);
  //       // trả về cuộc trò chuyện mới cho client
  //       const existing_conversations = await findUserConversations(from);
  //       callback(existing_conversations);

  //       // Lấy cả mảng participants và messages từ hàm checkOneToOneMessageExists
  //       // const { participants, messages } = await checkOneToOneMessageExists(channel_id);
  //       // console.log("Existing Participants", participants);
  //       // console.log("Messages", messages);

  //       // Nếu không có participants, tạo một cuộc trò chuyện mới
  //       // if (!participants) {
  //       //     // Nếu có participants, gửi thông tin về cuộc trò chuyện đã tồn tại
  //       //     socket.emit("start_chat", { participants, messages });
  //       //     console.log("Cuộc trò chuyện đã tồn tại", participants);
  //       // }
  //     } catch (error) {
  //       console.error("Error starting conversation:", error);
  //     }
  //   });

  //   socket.on("text_message", async (data) => {
  //     console.log("Received message:", data);
  //     // data: {to, from, text}
  //     const { text, conversation_id, from, to, type, avatar } = data;
  //     const to_user = await findUserById(to);
  //     const from_user = await findUserById(from);

  //     // message => {to, from, type, created_at, text, file}
  //     const new_message = {
  //       to: to,
  //       from: from,
  //       avatar: avatar,
  //       type: type,
  //       time: Date.now(),
  //       text: text,
  //     };

  //     // fetch OneToOneMessage Doc & push a new message to existing conversation
  //     const chat = await checkOneToOneMessageExists(conversation_id);
  //     chat.messages.push(new_message);
  //     console.log("New Message", new_message);
  //     // save to db`
  //     await saveMessage(conversation_id, new_message);
  //     // emit incoming_message -> to user
  //     io.to(to_user?.socket_id).emit("new_message", {
  //       conversation_id,
  //       message: new_message,
  //     });

  //     // emit outgoing_message -> from user
  //     io.to(from_user?.socket_id).emit("new_message", {
  //       conversation_id,
  //       message: new_message,
  //     });
  //   });
  //   socket.on("media_message", async (data) => {
  //     console.log("Received message:", data);
  //     // data: {to, from, text}
  //     const { text, conversation_id, from, to, type, avatar } = data;
  //     const to_user = await findUserById(to);
  //     const from_user = await findUserById(from);

  //     // message => {to, from, type, created_at, text, file}
  //     const new_message = {
  //       to: to,
  //       from: from,
  //       avatar: avatar,
  //       type: type,
  //       text: text,
  //       time: Date.now(),
  //     };

  //     // fetch OneToOneMessage Doc & push a new message to existing conversation
  //     const chat = await checkOneToOneMessageExists(conversation_id);
  //     chat.messages.push(new_message);
  //     console.log("New Message", new_message);
  //     // save to db`
  //     await saveMessage(conversation_id, new_message);
  //     // emit incoming_message -> to user
  //     io.to(to_user?.socket_id).emit("new_message", {
  //       conversation_id,
  //       message: new_message,
  //     });

  //     // emit outgoing_message -> from user
  //     io.to(from_user?.socket_id).emit("new_message", {
  //       conversation_id,
  //       message: new_message,
  //     });
  //   });

  //   socket.on("doc_message", async (data) => {
  //     console.log("Received message:", data);
  //     // data: {to, from, text}
  //     const { text, conversation_id, from, to, type, avatar } = data;
  //     const to_user = await findUserById(to);
  //     const from_user = await findUserById(from);

  //     // message => {to, from, type, created_at, text, file}
  //     const new_message = {
  //       to: to,
  //       from: from,
  //       avatar: avatar,
  //       type: type,
  //       text: text,
  //       time: Date.now(),
  //     };

  //     // fetch OneToOneMessage Doc & push a new message to existing conversation
  //     const chat = await checkOneToOneMessageExists(conversation_id);
  //     chat.messages.push(new_message);
  //     console.log("New Message", new_message);
  //     // save to db`
  //     await saveMessage(conversation_id, new_message);
  //     // emit incoming_message -> to user
  //     io.to(to_user?.socket_id).emit("new_message", {
  //       conversation_id,
  //       message: new_message,
  //     });

  //     // emit outgoing_message -> from user
  //     io.to(from_user?.socket_id).emit("new_message", {
  //       conversation_id,
  //       message: new_message,
  //     });
  //   });

  //   socket.on("voice_message", async (data) => {
  //     console.log("Received message:", data);
  //     // data: {to, from, text}
  //     const { text, conversation_id, from, to, type, avatar } = data;
  //     const to_user = await findUserById(to);
  //     const from_user = await findUserById(from);

  //     // message => {to, from, type, created_at, text, file}
  //     const new_message = {
  //       to: to,
  //       from: from,
  //       avatar: avatar,
  //       type: type,
  //       text: text,
  //       time: Date.now(),
  //     };

  //     // fetch OneToOneMessage Doc & push a new message to existing conversation
  //     const chat = await checkOneToOneMessageExists(conversation_id);
  //     chat.messages.push(new_message);
  //     console.log("New Message", new_message);
  //     // save to db`
  //     await saveMessage(conversation_id, new_message);
  //     // emit incoming_message -> to user
  //     io.to(to_user?.socket_id).emit("new_message", {
  //       conversation_id,
  //       message: new_message,
  //     });

  //     // emit outgoing_message -> from user
  //     io.to(from_user?.socket_id).emit("new_message", {
  //       conversation_id,
  //       message: new_message,
  //     });
  //   });

  //   socket.on("get_messages", async (data, callback) => {
  //     try {
  //       const messages = await getMessages(data.conversation_id);

  //       callback(messages);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   });

  //   // socket.on("text_message", async (message, conversationData) => {
  //   //   console.log("Received message:", message, conversationData);
  //   //   const conversation_idFrom = conversationData.from_user + conversationData.to_user;
  //   //   const conversation_idTo = conversationData.to_user + conversationData.from_user;
  //   //   // Lưu tin nhắn mới vào bảng OneToOneMessage trong DynamoDB
  //   //   await saveMessage(conversation_idFrom, message);
  //   //   message.sentByMe = false;
  //   //   await saveMessage(conversation_idTo, message);

  //   //   // Gửi sự kiện new_message đến người nhận và người gửi
  //   //   /*  io.to(conversationData.to_user.socket_id).emit("new_message", {
  //   //      conversation_idTo,
  //   //      message: message,
  //   //    });

  //   //    io.to(conversationData.from_user.socket_id).emit("new_message", {
  //   //      conversation_idFrom,
  //   //      message: message,
  //   //    }); */

  //   // });

  //   /* socket.on("get_messages", async (data, callback) => {
  //     try {
  //       console.log(data.conversation_id);
  //       const { messages } = await getMessage(data.conversation_id);
  //       callback(messages);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   });

  //    */

  //   /*  socket.on("friend_request", async (data) => {
  //        try {
  //            const { from, to } = data;

  //            // Tạo yêu cầu kết bạn mới
  //            const requestId = uuidv4();
  //            const request = {
  //                TableName: 'FriendRequest',
  //                Item: {
  //                    requestId: requestId,
  //                    senderId: from,
  //                    recipientId: to,
  //                    createdAt: new Date().toISOString(),
  //                    status: 'pending' // Có thể thêm trạng thái khác nếu cần thiết, ví dụ: accepted, rejected, etc.
  //                }
  //            };

  //            // Lưu yêu cầu kết bạn vào cơ sở dữ liệu
  //            await ddbClient.put(request).promise();

  //            // Gửi sự kiện yêu cầu mới đến người nhận
  //            io.to(to).emit("new_friend_request", {
  //                message: "New friend request received",
  //                requestId: requestId
  //            });

  //            // Gửi thông báo cho người gửi rằng yêu cầu đã được gửi thành công
  //            io.to(from).emit("request_sent", {
  //                message: "Request Sent successfully!",
  //                requestId: requestId
  //            });
  //        } catch (error) {
  //            console.error('Error:', error);
  //            // Xử lý lỗi ở đây nếu cần thiết
  //        }
  //    }); */

  //   /*    socket.on("accept_request", async (data) => {
  //        // accept friend request => add ref of each other in friends array
  //        console.log(data);
  //        const request_doc = await FriendRequest.findById(data.request_id);

  //        console.log(request_doc);

  //        const sender = await User.findById(request_doc.sender);
  //        const receiver = await User.findById(request_doc.recipient);

  //        sender.friends.push(request_doc.recipient);
  //        receiver.friends.push(request_doc.sender);

  //        await receiver.save({ new: true, validateModifiedOnly: true });
  //        await sender.save({ new: true, validateModifiedOnly: true });

  //        await FriendRequest.findByIdAndDelete(data.request_id);

  //        // delete this request doc
  //        // emit event to both of them

  //        // emit event request accepted to both
  //        io.to(sender?.socket_id).emit("request_accepted", {
  //          message: "Friend Request Accepted",
  //        });
  //        io.to(receiver?.socket_id).emit("request_accepted", {
  //          message: "Friend Request Accepted",
  //        });
  //      }); */

  //   /*    socket.on("get_direct_conversations", async ({ user_id }, callback) => {
  //        const existing_conversations = await OneToOneMessage.find({
  //          participants: { $all: [user_id] },
  //        }).populate("participants", "firstName lastName avatar _id email status");

  //        // db.books.find({ authors: { $elemMatch: { name: "John Smith" } } })

  //        console.log(existing_conversations);

  //        callback(existing_conversations);
  //      });
  //     */
  //   /*   socket.on("start_conversation", async (data) => {
  //       // data: {to: from:}

  //       const { to, from } = data;

  //       // check if there is any existing conversation

  //       const existing_conversations = await OneToOneMessage.find({
  //         participants: { $size: 2, $all: [to, from] },
  //       }).populate("participants", "firstName lastName _id email status");

  //       console.log(existing_conversations[0], "Existing Conversation");

  //       // if no => create a new OneToOneMessage doc & emit event "start_chat" & send conversation details as payload
  //       if (existing_conversations.length === 0) {
  //         let new_chat = await OneToOneMessage.create({
  //           participants: [to, from],
  //         });

  //         new_chat = await OneToOneMessage.findById(new_chat).populate(
  //           "participants",
  //           "firstName lastName _id email status"
  //         );

  //         console.log(new_chat);

  //         socket.emit("start_chat", new_chat);
  //       }
  //       // if yes => just emit event "start_chat" & send conversation details as payload
  //       else {
  //         socket.emit("start_chat", existing_conversations[0]);
  //       }
  //     });
  //    */
  //   /*  socket.on("get_messages", async (data, callback) => {
  //      try {
  //        const { messages } = await OneToOneMessage.findById(
  //          data.conversation_id
  //        ).select("messages");
  //        callback(messages);
  //      } catch (error) {
  //        console.log(error);
  //      }
  //    });

  //    // Handle incoming text/link messages
  //    socket.on("text_message", async (data) => {
  //      console.log("Received message:", data);

  //      // data: {to, from, text}

  //      const { message, conversation_id, from, to, type } = data;

  //      const to_user = await User.findById(to);
  //      const from_user = await User.findById(from);

  //      // message => {to, from, type, created_at, text, file}

  //      const new_message = {
  //        to: to,
  //        from: from,
  //        type: type,
  //        created_at: Date.now(),
  //        text: message,
  //      };

  //      // fetch OneToOneMessage Doc & push a new message to existing conversation
  //      const chat = await OneToOneMessage.findById(conversation_id);
  //      chat.messages.push(new_message);
  //      // save to db`
  //      await chat.save({ new: true, validateModifiedOnly: true });

  //      // emit incoming_message -> to user

  //      io.to(to_user?.socket_id).emit("new_message", {
  //        conversation_id,
  //        message: new_message,
  //      });

  //      // emit outgoing_message -> from user
  //      io.to(from_user?.socket_id).emit("new_message", {
  //        conversation_id,
  //        message: new_message,
  //      });
  //    });

  //    // handle Media/Document Message
  //    socket.on("file_message", (data) => {
  //      console.log("Received message:", data);

  //      // data: {to, from, text, file}

  //      // Get the file extension
  //      const fileExtension = path.extname(data.file.name);

  //      // Generate a unique filename
  //      const filename = `${Date.now()}_${Math.floor(
  //        Math.random() * 10000
  //      )}${fileExtension}`;

  //      // upload file to AWS s3

  //      // create a new conversation if its dosent exists yet or add a new message to existing conversation

  //      // save to db

  //      // emit incoming_message -> to user

  //      // emit outgoing_message -> from user
  //    });
  //   */

  //   //// Group of Khôi
  //   // Khi nhận sự kiện socket "delete-members"
  //   socket.on("delete-members", async (memberIDs, groupID, callback) => {
  //     try {
  //       // Xóa thành viên từ nhóm
  //       const result = await deleteUserFromGroups(groupID, memberIDs);
  //       // Gửi phản hồi về client kèm thông tin nhóm mới
  //       callback({ success: result, error: "Error deleteUserFromGroups" });
  //     } catch (error) {
  //       // Gửi phản hồi về client nếu có lỗi
  //       callback({
  //         success: false,
  //         error: "An error occurred while processing delete-members",
  //       });
  //     }
  //   });

  //   socket.on("delete-member", async (memberID, groupID, callback) => {
  //     try {
  //       // Xóa thành viên từ nhóm
  //       const result = await deleteUserFromGroup(groupID, memberID);
  //       // Gửi phản hồi về client kèm thông tin nhóm mới
  //       callback({ success: result, error: "Error deleteUserFromGroup" });
  //     } catch (error) {
  //       // Gửi phản hồi về client nếu có lỗi
  //       callback({
  //         success: false,
  //         error: "An error occurred while processing delete-member",
  //       });
  //     }
  //   });

  //   socket.on("fetch-group-conversations", async (user_id, callback) => {
  //     try {
  //       // Xử lý logic để lấy thông tin chi tiết của nhóm
  //       const groupConversations = await findGroupConversationsByUserId(user_id); // Thay thế hàm này bằng hàm thực hiện fetch dữ liệu

  //       if (groupConversations) {
  //         // Nếu lấy thông tin nhóm thành công, gửi phản hồi về client
  //         callback({ success: true, groupConversations: groupConversations });
  //       } else {
  //         // Nếu không tìm thấy thông tin nhóm, gửi phản hồi về client với thông báo lỗi
  //         callback({ success: false, error: "Group not found" });
  //       }
  //     } catch (error) {
  //       console.error("Error:", error);
  //       // Nếu có lỗi xảy ra trong quá trình xử lý, gửi phản hồi về client với thông báo lỗi
  //       callback({
  //         success: false,
  //         error: "An error occurred while processing fetch-group-conversation",
  //       });
  //     }
  //   });

  //   socket.on(
  //     "create-group-conversation",
  //     async (memberList, groupInfor, callback) => {
  //       try {
  //         const result = await createGroup(memberList, groupInfor); // Thay thế hàm này bằng hàm thực hiện fetch dữ liệu
  //         callback({ success: result, error: "Error create-group-conversation" });
  //       } catch (error) {
  //         console.error("Error:", error);
  //         callback({
  //           success: false,
  //           error: "An error occurred while processing create-group-conversation",
  //         });
  //       }
  //     }
  //   );

  //   socket.on("add-message", async (message, groupID, callback) => {
  //     try {
  //       // Xử lý logic để lấy thông tin chi tiết của nhóm
  //       const result = await addMessage(groupID, message); // Thay thế hàm này bằng hàm thực hiện fetch dữ liệu

  //       if (result) {
  //         // Nếu lấy thông tin nhóm thành công, gửi phản hồi về client
  //         callback({ success: true });
  //       } else {
  //         // Nếu không tìm thấy thông tin nhóm, gửi phản hồi về client với thông báo lỗi
  //         callback({ success: false, error: "Add-message error" });
  //       }
  //     } catch (error) {
  //       console.error("Error:", error);
  //       // Nếu có lỗi xảy ra trong quá trình xử lý, gửi phản hồi về client với thông báo lỗi
  //       callback({
  //         success: false,
  //         error: "An error occurred while processing add-message",
  //       });
  //     }
  //   });

  //   socket.on("fetch-group-chat-history-group-id", async (groupID, callback) => {
  //     try {
  //       // Xử lý logic để lấy thông tin chi tiết của nhóm
  //       const messages = await getMessagesByGroupID(groupID);
  //       console.log("message be", messages); // Thay thế hàm này bằng hàm thực hiện fetch dữ liệu
  //       if (messages) {
  //         // Nếu lấy thông tin nhóm thành công, gửi phản hồi về client
  //         callback({ success: true, messages: messages });
  //       } else {
  //         // Nếu không tìm thấy thông tin nhóm, gửi phản hồi về client với thông báo lỗi
  //         callback({ success: false, error: "Add-message error" });
  //       }
  //     } catch (error) {
  //       console.error("Error:", error);
  //       // Nếu có lỗi xảy ra trong quá trình xử lý, gửi phản hồi về client với thông báo lỗi
  //       callback({
  //         success: false,
  //         error: "An error occurred while processing add-message",
  //       });
  //     }
  //   });

  //   socket.on("update-group-members", async (memberList, groupID, callback) => {
  //     try {
  //       const updateRS = await updateGroupMember(memberList, groupID);
  //       if (updateRS) {
  //         console.log("Update group member successfully");
  //         callback({ success: true });
  //       } else {
  //         console.log("Update group member failed");
  //         callback({ success: false });
  //       }
  //     } catch (error) {
  //       console.error("Error:", error);
  //     }
  //   });

  //   socket.on("delete-group", async (groupID, callback) => {
  //     try {
  //       const result = await deleteGroup(groupID);
  //       callback({ success: result, error: "Error deleteGroup" });
  //     } catch (error) {
  //       callback({
  //         success: false,
  //         error: "An error occurred while processing delete-group",
  //       });
  //     }
  //   });

  //   socket.on(
  //     "update-group-conversation-message",
  //     async (message, groupID, callback) => {
  //       try {
  //         const result = await updateMessageGroupConversation(message, groupID);
  //         if (result) {
  //           console.log("update-group-conversation-message success");
  //           callback({ success: true });
  //         } else {
  //           console.log("update-group-conversation-message failed");
  //           callback({ success: false });
  //         }
  //       } catch (error) {
  //         console.error("Error:", error);
  //       }
  //     }
  //   );

  //   socket.on("leave-group", async (groupID, callback) => {
  //     try {
  //       const result = await updateMessageGroupConversation(message, groupID);
  //       if (result) {
  //         console.log("leave-group success");
  //         callback({ success: true });
  //       } else {
  //         console.log("leave-group failed");
  //         callback({ success: false });
  //       }
  //     } catch (error) {
  //       console.error("Error:", error);
  //     }
  //   });

  //   socket.on("update-group-avatar", async (imageURL, groupID, callback) => {
  //     try {
  //       const result = await updateGroupAvatar(imageURL, groupID);
  //       callback({ success: result, error: "Error update-group-avatar" });
  //     } catch (error) {
  //       callback({ success: false, error });
  //     }
  //   });

  //   socket.on("update-group-name", async (imageURL, groupID, callback) => {
  //     try {
  //       const result = await updateGroupName(imageURL, groupID);
  //       callback({ success: result, error: "Error update-group-name" });
  //     } catch (error) {
  //       callback({ success: false, error });
  //     }
  //   });


  //   socket.on("update-message-state", async (groupID, memberList, callback) => {
  //     try {
  //       console.log("MemberList", memberList);
  //       const result = await updateGroupUnreadAndCounts(groupID, memberList);
  //       callback({ success: result, error: "Error update-message-state" });
  //     } catch (error) {
  //       callback({ success: false, error });
  //     }
  //   });

  //   socket.on("reset-message-state", async (groupID, user_id, callback) => {
  //     try {
  //       const result = await resetGroupUnreadAndCount(groupID, user_id);
  //       callback({ success: result, error: "Error reset-message-state" });
  //     } catch (error) {
  //       callback({ success: false, error });
  //     }
  //   });

  //   // -------------- HANDLE SOCKET DISCONNECTION ----------------- //

  socket.on("end", async (data) => {
    // Find user by ID and set status as offline

    if (data.user_id) {
      await User.findByIdAndUpdate(data.user_id, { status: "Offline" });
    }

    // broadcast to all conversation rooms of this user that this user is offline (disconnected)

    console.log("closing connection");
    socket.disconnect(0);
  });
});

//port from 3000 to 5000
const port = process.env.PORT || 8000;

server.listen(port, () => {
  console.log(`App running on port ${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
