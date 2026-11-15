export const sendMessageWithAck = (socket, payload, callback) => {
  if (!socket?.connected) {
    callback({ success: false, message: 'Connection lost. Please try again.' });
    return;
  }
  socket.timeout(15000).emit('message:send', payload, (error, response) => {
    if (error) {
      callback({ success: false, message: 'Delivery could not be confirmed. Check the conversation before trying again.' });
      return;
    }
    callback(response || { success: false, message: 'No response from the server.' });
  });
};
