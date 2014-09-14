function getActions (data) {
    var q = new Parse.Query("Note");
    q.equalTo("meeting", data.meeting);
    q.include("action");
    q.ascending("createdAt");
    return q.find().then(function(notes) {
        var actions = [];
        for(var i in notes){
            var a = notes[i].get("action");
            if(a){
                actions.push(a);
            }
        }
        return actions;
    });
}