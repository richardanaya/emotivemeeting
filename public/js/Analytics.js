/**
 * Created by dtreiman on 9/14/14.
 */

function buildAnalyticsDialog() {

    $('.actions','#analyticsDialog').html("")
    getActions({meeting:_meeting}).then(function(actions){
        for (var i in actions){
            $('.actions','#analyticsDialog').append('<div class="action">'+actions[i].get("type")+' '+JSON.stringify(actions[i].get("data"))+'</div>')
        }
    });


    $('.participants','#analyticsDialog').html("")
    loadMeeting().then(function(meeting){
        var people = meeting.get("people");
        for (var i in people){
            $('.participants','#analyticsDialog').append('<div class="participant">'+people[i].get("name")+'('+people[i].get("role")+'/'+people[i].get("trait")+')</div>')
        }
    });


}

