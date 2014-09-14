var _data = {
    "messages": [
        {
            "user": "Richard",
            "text": "Hey man, how are you?",
            "emotion": "neutral"
        },
        {
            "user": "Dan",
            "text": "Good, I really like that new robot!",
            "emotion": "happy"
        }
    ]
};

function getChatMessages (data,callback){
    callback(_data)
}