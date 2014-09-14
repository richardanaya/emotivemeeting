/**
 * Created by dtreiman on 9/13/14.
 */


/**
 * @param text The text to analyze.
 * @param success
 * @param error
 */
function getSentiment(text, callback, error) {
    var urlBase = 'https://api.idolondemand.com/1/api/sync/analyzesentiment/v1';
    var queryText = text.split(' ').join('+'); // Make+the+input+text+look+like+this
    var url = urlBase + '?text=' + queryText + '&language=eng&apikey=d3ac7dae-8dee-4716-b7fc-96905b9ae834';
    $.ajax({
      url: url
    }).done(function( result ) {
          alert( "Sentiment Result: " + JSON.stringify(result) );
    });

    /*
    curl "https://api.idolondemand.com/1/api/sync/analyzesentiment/v1?text=I+like+oranges+but+I+don't+like+bread&language=eng&apikey=d3ac7dae-8dee-4716-b7fc-96905b9ae834"
     */
};


/**
 {
   "positive": [
     {
       "sentiment": "like",
       "topic": "oranges",
       "score": 0.7176687736973063,
       "original_text": "I like oranges",
       "original_length": 14,
       "normalized_text": "I like oranges",
       "normalized_length": 14
     }
   ],
   "negative": [
     {
       "sentiment": "don't like",
       "topic": "bread",
       "score": -0.7786856817316798,
       "original_text": "but I don't like bread",
       "original_length": 22,
       "normalized_text": "but I don't like bread",
       "normalized_length": 22
     }
   ],
   "aggregate": {
     "sentiment": "neutral",
     "score": -0.03050845401718677
   }
 }
 */
