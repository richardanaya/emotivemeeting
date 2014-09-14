function getChatMessages (data,callback){
    var q = new Parse.Query("Note");
    q.equalTo("meeting",data.meeting)
    q.include("person");
    q.include("sentiments");
    q.ascending("createdAt");
    q.find(function(messages){
        var ret = [];
        for(var i in messages){
            var sentiments = messages[i].get("sentiments");
            var intensity = 0;
            for(var j in sentiments){
                intensity += sentiments[j].get("intensity");
            }
            ret.push({
                user:messages[i].get("person").get("name"),
                text:messages[i].get("text"),
                emotion: intensity
            })
        }
        callback({messages:ret});
    })
}