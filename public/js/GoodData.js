/**
 * Created by dtreiman on 9/13/14.
 */


var GD = {}

/**
 * Perform phase 1 of login to GoodData.
 * https://developer.gooddata.com/article/authentication-via-api
 * @return {Parse.Proimse} A promise which resolves with the SST (Super Secure Token).
 */
GD.loginPhase1 = function() {
    var promise = new Parse.Promise();
    $.ajax({
        url : '/gdc/account/login',
        data: {},
        success: function(data, textStatus, jqXHR) {
           console.log('/gdc/account/login returned: \n' + data);
            promise.resolve(data);
        },
        error: function (jqXHR, textStatus, error)
        {
            promise.reject(error);
            console.log(JSON.stringify(error));
        }
    });
    return promise;
};


/**
 * Perform phase 2 of login to GoodData.
 * https://developer.gooddata.com/article/authentication-via-api
 * @return {Parse.Proimse} A promise which resolves with the TT (Temporary Token).
 */
GD.loginPhase2 = function(SST) {
    var promise = new Parse.Promise();
    $.ajax({
        url : '/gdc/account/token?SST=' + encodeURIComponent(SST),
        success: function(data, textStatus, jqXHR) {
           console.log('/gdc/account/token returned: \n' + data);
            promise.resolve(JSON.parse(data));
        },
        error: function (jqXHR, textStatus, error)
        {
            promise.reject(error);
            console.log(JSON.stringify(error));
        }
    });
    return promise;
};
