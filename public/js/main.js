/*Traitify.setPublicKey("lli04a6opusurc9j5q6nlvh38u");
Traitify.setHost("https://api-sandbox.traitify.com");
Traitify.setVersion("v1");
var assessmentId = 'ee87be62-b070-43b7-8915-eeae1d02370b';
Traitify.ui.slideDeck(assessmentId, ".assessment", function(data) {
    debugger;
    Traitify.ui.resultsProp(assessmentId, ".assessment", {showTraits: true});
});*/

// https://parse.com/apps/emotivemeeting
Parse.initialize('cGPTSnSjqp5MNITUOfkG9NzNBOn4cMQn4VC1AK7y', '71nkSrtLNREfl2DVzTkrFg9uybf6k4HhvbAYeI0c');
_ = Parse._;

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var meeting = getParameterByName("meeting");
var user = getParameterByName("user");

var _meeting = null;
var _person = null;

var start = function(){
    var messageCount = 0;

    function refreshChat(){
        return getChatMessages({meeting:_meeting}).then(function(messages) {
            if (messageCount == messages.length) {
                // If we haven't received any new messages, don't refresh
                return;
            }
            messageCount = messages.length;
            $('.chatArea').html("");
            for (var i  = 0 ; i < messages.length; i++){
                var sentiment = "";
                if(messages[i].score > 0){
                    sentiment = '<span style="color:#00ff00"><i class="fa fa-thumbs-o-up"></i></span>'
                }
                else if (messages[i].score < 0){
                    sentiment = '<span style="color:#ff0000"><i class="fa fa-thumbs-o-down"></i></span>'
                }
                $('.chatArea').append('<div class="chatMessage"><span class="chatMessageUser">'+messages[i].user+' '+sentiment+': </span><span class="chatMessageText">'+messages[i].text+'</span></div>')
            }
            $('.chatArea').append('<div><input type="text" class="sendMessage"></div>')
            $('.sendMessage').on("keydown", function(e){
                if(e.keyCode == 13){
                    var text = $(this).val();
                    sendMessageToMeeting({person:_person, text:text, meeting: _meeting},function(){
                        refreshChat();
                    });
                }
            })
            $('.sendMessage').focus();
        });
    }

    function pollChat() {
        refreshChat().then(function() {
            setTimeout(pollChat, 5000);
        });
    };
    pollChat();
};



function loadMeeting() {
    var q = new Parse.Query("Meeting");
    q.equalTo("name",meeting);
    q.include("people");
    return q.first().then(function(m){
    if(m){
        return m;
    }
    else {
        var Meeting = Parse.Object.extend("Meeting");
        m = new Meeting();
        m.set("name",meeting);
        return m.save();
    }
    }).then(function(m){
        _meeting = m;
        return m;
    });
}


function loadPerson() {
    var pq = new Parse.Query("Person");
    pq.equalTo("name",user);
    return pq.first().then(function(person){
        if(person){
            return person;
        }
        else {
            var Person = Parse.Object.extend("Person");
            p = new Person();
            p.set("name",user);
            return p.save();
        }
    }).then(function(person){
        _person = person;
        return person;
    });
}


function addPersonToMeeting(person) {
    _meeting.addUnique('people', person);
    return _meeting.save();
}


// Load global objects and start the app
loadMeeting().then(function() {
    return loadPerson();
}).then(function(person) {
    return addPersonToMeeting(person);
}).then(function() {
    start();
});

