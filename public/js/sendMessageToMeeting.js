function sendMessageToMeeting(data,callback){
    var Note = Parse.Object.extend("Note");
    var n = new Note();
    n.set("meeting",data.meeting)
    n.set("person",data.person);
    n.set("text",data.message)
    n.save().then(callback);
}