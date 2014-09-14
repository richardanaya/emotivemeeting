function sendMessageToMeeting(data,callback){
    _data.messages.push({user: data.user, text: data.message})
    callback();
}