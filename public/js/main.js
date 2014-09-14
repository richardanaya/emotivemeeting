/*Traitify.setPublicKey("lli04a6opusurc9j5q6nlvh38u");
Traitify.setHost("https://api-sandbox.traitify.com");
Traitify.setVersion("v1");
var assessmentId = 'ee87be62-b070-43b7-8915-eeae1d02370b';
Traitify.ui.slideDeck(assessmentId, ".assessment", function(data) {
    debugger;
    Traitify.ui.resultsProp(assessmentId, ".assessment", {showTraits: true});
});*/

// https://parse.com/apps/emotivemeeting
Parse.init('cGPTSnSjqp5MNITUOfkG9NzNBOn4cMQn4VC1AK7y', '71nkSrtLNREfl2DVzTkrFg9uybf6k4HhvbAYeI0c');


function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var meeting = getParameterByName("meeting");
var user = getParameterByName("user");

function refreshChat(){
    getChatMessages({meeting:meeting},function(data){
        $('.chatArea').html("");
        for(var i  = 0 ; i < data.messages.length; i++){
            $('.chatArea').append('<div class="chatMessage"><span class="chatMessageUser">'+data.messages[i].user+': </span><span class="chatMessageText">'+data.messages[i].text+'</span></div>')
        }
        $('.chatArea').append('<div><input type="text" class="sendMessage"></div>')
        $('.sendMessage').on("keydown", function(e){
            if(e.keyCode == 13){
                sendMessageToMeeting({user:user, message:$(this).val(), meeting: meeting},function(){
                    refreshChat();
                });
            }
        })
        $('.sendMessage').focus();
    });
}

refreshChat();
