

function sendMessageToMeeting(data, callback){
    var Note = Parse.Object.extend("Note");
    var Sentiment = Parse.Object.extend("Sentiment");

    getSentiments(data.text).then(function(sentimentResult) {
        var sentiments = [];

        _.forEach(sentimentResult.positive, function(positive) {
            sentiments.push(new Sentiment(_.pick(positive, 'sentiment', 'topic', 'score')));
        });

        _.forEach(sentimentResult.negative, function(negative) {
            sentiments.push(new Sentiment(_.pick(negative, 'sentiment', 'topic', 'score')));
        });

        if (sentimentResult.aggregate) {
            sentiments.push(new Sentiment(sentimentResult.aggregate));
        }

        return Parse.Object.saveAll(sentiments);
    }).then(function(sentiments) {
        var newNote = new Note(data);
        newNote.set('sentiments', sentiments);
        newNote.save().then(callback);
    });
}