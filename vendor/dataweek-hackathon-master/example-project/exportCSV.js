/**
 * Created by dtreiman on 9/14/14.
 */

var Parse = require('Parse').Parse;
var fs = require('fs');

Parse.initialize('cGPTSnSjqp5MNITUOfkG9NzNBOn4cMQn4VC1AK7y', '71nkSrtLNREfl2DVzTkrFg9uybf6k4HhvbAYeI0c');
var _ = Parse._;


function writeCSVFile(filename, CSV) {
    var promise = new Parse.Promise();
    fs.writeFile(filename, CSV, function (err) {
        if (err) {
            promise.reject(err);
        }
        else {
            console.log(filename + ' saved');
            promise.resolve();
        }
    });
    return promise;
}


function exportPeople() {
    var CSV = ['personID,name,role,trait'];
    var query = new Parse.Query('Person');
    return query.each(function(person) {
       var line = [person.id,
                   JSON.stringify(person.get('name')),
                   JSON.stringify(person.get('role')),
                   JSON.stringify(person.get('trait'))];
        CSV.push(line.join(','));
    }).then(function() {
        return writeCSVFile('data/persons.csv', CSV.join('\n'));
    });
}

function exportMeetings() {
    var CSV = ['meetingID,name'];
    var query = new Parse.Query('Meeting');
    return query.each(function(meeting) {
       var line = [meeting.id,
                   JSON.stringify(meeting.get('name'))];
        CSV.push(line.join(','));
    }).then(function() {
        return writeCSVFile('data/meetings.csv', CSV.join('\n'));
    });
}

function exportSentiments() {
    var CSV = ['sentimentID,score,sentiment,topic,noteID'];
    var query = new Parse.Query('Sentiment');
    return query.each(function(sentiment) {
        var noteQuery = new Parse.Query('Note');
        noteQuery.equalTo('sentiments', sentiment);
        return noteQuery.first().then(function(note) {
            var noteID = note ? note.id : '';
            // id, score, sentiment, topic, note
            var line = [sentiment.id,
                        sentiment.get('score'),
                        JSON.stringify(sentiment.get('sentiment')),
                        JSON.stringify(sentiment.get('topic')),
                        noteID];
             CSV.push(line.join(','));
        });
    }).then(function() {
        return writeCSVFile('data/sentiments.csv', CSV.join('\n'));
    });
}


function dateToString(date) {
    var options = {
        year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit"
    };
    return (date.getMonth() + 1) + '/' + (date.getDay() + 1) + '/' + date.getFullYear() + ' ' + date.toLocaleTimeString("en-us", options);
}


function exportNotes() {
    var CSV = ['noteID,createdAt,text,aggregate_score,personID,meetingID,actionID'];
    var query = new Parse.Query('Note');
    query.include('sentiments');
    return query.each(function(note) {
        var sentiments = note.get('sentiments');
        var aggregate = _.find(sentiments, function (sentiment) { return !sentiment.get('topic'); });
        if (!aggregate) {
            console.log('Warning: no aggregate sentiment for note: ' + note.get('text'));
            aggregate = new Parse.Object('Sentiment', {
                score: 0,
                sentiment: 'neutral'
            });
        }        // id, createdAt, text, aggregate_score, person, meeting, action
        var action = note.get('action');


       var line = [note.id,
            dateToString(note.createdAt),
            JSON.stringify(note.get('text')),
            aggregate.get('score'),
            note.get('person').id,
            note.get('meeting').id,
            action ? action.id : ''];
        CSV.push(line.join(','));
    }).then(function() {
        return writeCSVFile('data/notes.csv', CSV.join('\n'));
    });
}

function exportActions() {
    var CSV = ['actionID,type,data'];
    var query = new Parse.Query('Action');
    return query.each(function(action) {
        // id, type, data
        var data = JSON.stringify(action.get('data'));
        data = ''; // TEMP: data is JSON but GoodData breaks parsing escape characters
        var line = [action.id,
                   action.get('type'),
                   ''];
        CSV.push(line.join(','));
    }).then(function() {
        return writeCSVFile('data/actions.csv', CSV.join('\n'));
    });
}


Parse.Promise.when([
    exportPeople(),
    exportMeetings(),
    exportSentiments(),
    exportNotes(),
    exportActions()
]).then(function() {
    console.log('export complete');
});

