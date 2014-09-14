function getChatMessages (data) {
    var q = new Parse.Query("Note");
    q.equalTo("meeting", data.meeting);
    q.include("person");
    q.include("sentiments");
    q.ascending("createdAt");
    return q.find().then(function(notes) {
        return _.map(notes, function(note) {
            var sentiments = note.get("sentiments");
            // A sentiment with no topic is the sentiment for this post
            var aggregate = _.find(sentiments, function (sentiment) { return !sentiment.get('topic'); });
            if (!aggregate) {
                console.log('Warning: no aggregate sentiment for note: ' + note.get('text'));
                aggregate = new Parse.Object('Sentiment', {
                    score: 0,
                    sentiment: 'neutral'
                });
            }
            return {
                user:note.get("person").get("name"),
                text:note.get("text"),
                sentiment: aggregate.get('sentiment'),
                score: aggregate.get('score')
            };
        });
    });
}