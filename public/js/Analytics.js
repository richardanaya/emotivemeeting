/**
 * Created by dtreiman on 9/14/14.
 */

function buildAnalyticsDialog() {

    $('.actions','#analyticsDialog').html("")
    getActions({meeting:_meeting}).then(function(actions){
        for (var i in actions){
            var type = actions[i].get("type");
            if(type == "fixBug"){
                $('.actions','#analyticsDialog').append('<li class="action">Fix <a href="#">BUG-'+actions[i].get("data").number+'</a></li>')
            }
            else if(type == "scheduleMeeting"){
                $('.actions','#analyticsDialog').append('<li class="action">Schedule meeting on <a href="#">'+actions[i].get("data")['date-time']+'</a></li>')
            }
            else {
                $('.actions','#analyticsDialog').append('<li class="action">'+actions[i].get("type")+' '+JSON.stringify(actions[i].get("data"))+'</li>')
            }
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

