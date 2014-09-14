/*Traitify.setPublicKey("lli04a6opusurc9j5q6nlvh38u");
Traitify.setHost("https://api-sandbox.traitify.com");
Traitify.setVersion("v1");
var assessmentId = 'ee87be62-b070-43b7-8915-eeae1d02370b';
Traitify.ui.slideDeck(assessmentId, ".assessment", function(data) {
    debugger;
    Traitify.ui.resultsProp(assessmentId, ".assessment", {showTraits: true});
});*/

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var meeting = getParameterByName("meeting");
var name = getParameterByName("name");

$('.sendMessage').on("keydown", function(e){
    debugger;
    if(e.keyCode == 13){
        alert($(this).val());
    }
})