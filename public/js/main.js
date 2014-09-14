

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
    // Set up analytics event handler
    $('.analytics').on('click', function(e) {
        getActions({meeting:_meeting}).then(function(actions){
            $('.actions','#analyticsDialog').html("")
            for(var i in actions){
                $('.actions','#analyticsDialog').append('<div class="action">'+actions[i].get("type")+' '+JSON.stringify(actions[i].get("data"))+'</div>')
            }
        })
        $('.participants','#analyticsDialog').html("")
        loadMeeting().then(function(meet){
            var people = meet.get("people");
            for(var i in people){
                $('.participants','#analyticsDialog').append('<div class="participant">'+people[i].get("name")+'('+people[i].get("role")+'/'+people[i].get("trait")+')</div>')
            }
        })

        $('#analyticsDialog').modal();
    });

    var messageCount = 0;

    function refreshChat(){
        return getChatMessages({meeting:_meeting}).then(function(messages) {
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
                        pubnub.publish({
                            channel : meeting,
                            message : "update"
                        })
                        refreshChat();
                    });
                }
            })
            $('.sendMessage').focus();
        });
    }

    refreshChat();

    var pubnub = PUBNUB.init({
        publish_key   : 'pub-c-bdff1d47-6041-4873-bc12-ca5673da1469',
        subscribe_key : 'sub-c-e1bc9878-af93-11e3-a26b-02ee2ddab7fe'
    })

    pubnub.subscribe({
        channel : meeting,
        message : function(m){
            refreshChat();
        }
    })
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

function feedData(s){
    var d = [];
    var lines = s.split("\n")
    for(var i in lines){
        var line = lines[i];
        var s = line.split(":");
        d.push({
            name: s[0],
            text: line.substring(s[0].length+1)
        });
    }

    var ct = d.length;
    var i = 0;
    var go = function(){
        if(i >= ct){
            location.reload();
        }
        var saying = d[i];
        feed(saying,go)
        i++
    }
    go();
};

function feed(saying,done){
    user = saying.name;
    loadPerson().then(function(){
        sendMessageToMeeting({person:_person, text:saying.text, meeting: _meeting},function(){
            done();
        });
    })
}


var modalSetup = false;
$('.user').click(function(){
    $('.userName','#userSettings').html(user);
    $('.userRole','#userSettings').val(_person.get("role"));
    $('.userTrait','#userSettings').html(_person.get("trait"));
    $('#userSettings').modal();
    if(!modalSetup) {
        modalSetup = true;

        $('.userRole', '#userSettings').on("blur", function () {
            _person.set("role", $(this).val());
            _person.save();
        })
        $(".btnTakeTest").click(function () {
            Traitify.setPublicKey("bhjtda24lq75eivuug5hnlu9j7");
            Traitify.setHost("https://api-sandbox.traitify.com");
            Traitify.setVersion("v1");

            //curl https://api-sandbox.traitify.com/v1/assessments -H "Content-Type: application/json" -unps7ahk5oqhl5bdgua6lso3rp:datahack  -d '{"deck_id": "career-deck"}'

            $.ajax({url: "/assess",
                success: function (res) {
                    var assessmentId = res.id;
                    var traitTest = Traitify.ui.slideDeck(assessmentId, ".assessment", function (data) {
                        Traitify.ui.resultsProp(assessmentId, ".assessment", {showTraits: true});
                        Traitify.getPersonalityTypes(assessmentId, function (results) {
                            debugger;
                            var type = "";
                            var score = 0;
                            for (var i in results.personality_types) {
                                var t = results.personality_types[i];
                                if (t.score > score) {
                                    type = t.personality_type.name;
                                    score = t.score;
                                }
                            }
                            _person.set("trait", type);
                            _person.save();
                            $('.userTrait', '#userSettings').html(type);
                        });
                    });
                }});
        })
    }
})
