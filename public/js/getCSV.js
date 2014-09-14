/**
 * Created by dtreiman on 9/13/14.
 */

/**
 * Get a CSV report of all notes and sentiments in this meeting.
 * @param meeting
 */
function getCSV(meeting, afterDate)
{
    var Note = Parse.Object.extend('Note');

    var query = new Parse.Query(Note);
    query.equalTo('meeting', meeting);
    query.include('person');
    query.include('sentiments');
    query.include('action');
    query.ascending('createdAt');
    if (afterDate) {
        query.greaterThan('createdAt', afterDate);
    }
    query.limit(1000);
    return query.find().then(function(notes) {
        var lines = [];
        lines.push('date,noteID,topic,sentiment,score,text,actionType,actionData,user,role');
        _.forEach(notes, function(note) {
            var userName = note.get('person').get('name');
            var roleName = note.get('person').get('role');
            var sentiments = note.get('sentiments');
            var text = note.get('text');
            var action = note.get('action');
            var actionType = action ? action.get('type') : 'none';
            var actionData = action ? action.get('data') : '';
            _.forEach(sentiments, function(sentiment) {
                var topic = sentiment.get('topic');
                var sentimentType = sentiment.get('sentiment');
                var line = [
                    JSON.stringify(sentiment.createdAt),
                    sentiment.get('topic') ? sentiment.get('topic') : '',
                    sentimentType,
                    sentiment.get('score'),
                    JSON.stringify(text),
                    actionType,
                    JSON.stringify(actionData),
                    userName,
                    roleName
                ];
                lines.push(line.join(','));
            });
        });

        return lines.join('\n');
    });
}