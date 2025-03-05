/*global Log*/

FourSquare.ACCESS_TOKEN = 'ACCESS_TOKEN';
FourSquare.USER_PREF = 'USER';
FourSquare.API = 'https://api.foursquare.com/v2/';
FourSquare.API_VERSION = '20140806';
FourSquare.ERRORS = {
    OFFLINE: 'OFFLINE',
    UNKNOWN: 'UNKNOWN',
    NOT_AUTHORIZED: 'NOT_AUTHORIZED'
};

function FourSquare(sap, model) {

    var accessToken = localStorage.getItem(FourSquare.ACCESS_TOKEN), user = null, lastVenues = [];
    if (!accessToken) {
        if (Log.DEBUG === true) {
            //accessToken = 'YOUR_TEST_ACCESS_TOKEN_HERE';
        } else {
            accessToken = '';
        }
    }

    Object.defineProperties(this, {
        'isAuthorized': {
            get: function () {
                return accessToken && accessToken !== '';
            }
        },
        'lastVenues': {
            get: function () {
                return lastVenues;
            },
            set: function (val) {
                lastVenues = val;
            }
        },
        'accessToken': {
            get: function () {
                return accessToken;
            },
            set: function (val) {
                localStorage.setItem(FourSquare.ACCESS_TOKEN, val);
                accessToken = val;
            }
        },
        'user': {
            get: function () {
                return user;
            },
            set: function (val) {
                user = val;
            }
        },
        'sap': {
            get: function () {
                return sap;
            }
        },
        'apiSuffix': {
            get: function () {
                return 'v=' + FourSquare.API_VERSION + '&m=' + FourSquare.VENUES_MODE + '&oauth_token=' + accessToken;
            }
        },
        'model' : {
            get: function(){
                return model;
            }
        }
    });
}
