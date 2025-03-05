/*global FourSquare, $, GearHttp, Log, VenueDetails*/

FourSquare.NO_FRIEND_ID = -1;
FourSquare.VENUES_MODE = 'swarm';
FourSquare.VENUES_RADIUS = 100;
FourSquare.VENUES_LIMIT = 100;
FourSquare.TIPS_LIMIT = 100;
FourSquare.API_VENUES_SEARCH = FourSquare.API + 'venues/search?intent=checkin&radius=' + FourSquare.VENUES_RADIUS + '&m=' + FourSquare.VENUES_MODE;
FourSquare.API_CHECKIN = FourSquare.API + 'checkins/add/';
FourSquare.API_TIPS = FourSquare.API + 'venues/';
FourSquare.API_USERS = FourSquare.API + 'users/';

FourSquare.prototype.getVenues = function () {

    var d = $.Deferred(), self = this, request = new GearHttp(this.sap, this.model);

    if (!this.isAuthorized) {
        d.reject(FourSquare.ERRORS.NOT_AUTHORIZED);
        return d.promise();
    }

    this.sap.getLocation().then(function (position) {

        request.open('GET', FourSquare.API_VENUES_SEARCH + '&ll=' + position.coords.latitude + ',' + position.coords.longitude + '&llAcc=' + position.coords.accuracy + '&limit=' + FourSquare.VENUES_LIMIT + '&' + self.apiSuffix);

        request.onreadystatechange = function () {
            if (request.request.status === 0 && request.request.readyState === 4 && request.request.responseText === '') {
                d.reject(FourSquare.ERRORS.OFFLINE);
                return;
            }

            if (request.request.status === 200 && request.request.readyState === 4) {
                // noinspection JSUnresolvedVariable
                var venues = JSON.parse(request.request.responseText).response.venues;
                var details = venues.map(function (v) {
                    return new VenueDetails(v);
                });

                d.resolve(details);
            }
        };

        request.send();
    }, function (err) {
        d.reject(err);
    });

    return d.promise();

};


FourSquare.prototype.getVenueDetails = function (venueId) {
    var d = $.Deferred(), request = new GearHttp(this.sap, this.model);

    if (!this.isAuthorized) {
        d.reject(FourSquare.ERRORS.NOT_AUTHORIZED);
        return d.promise();
    }

    request.open('GET', FourSquare.API_TIPS + venueId + '/?' + this.apiSuffix);

    request.onreadystatechange = function () {
        if (request.request.status === 0 && request.request.readyState === 4 && request.request.responseText === '') {
            d.reject(FourSquare.ERRORS.OFFLINE);
            return;
        }

        if (request.request.status === 200 && request.request.readyState === 4) {
            var res = JSON.parse(request.request.responseText);
            // noinspection JSUnresolvedVariable
            d.resolve(new VenueDetails(res.response.venue));
        }
    };

    request.send();

    return d.promise();
};

// noinspection JSUnusedGlobalSymbols
FourSquare.prototype.getFriendById = function (id) {
    var d = $.Deferred();

    // noinspection JSUnresolvedVariable
    this.user.friends.groups.forEach(function (group) {
        group.items.forEach(function (item) {
            if (item.id === id) {
                d.resolve(item);
            }
        });
    });

    return d.promise();
};

FourSquare.prototype.getFriends = function () {
    var friends = [], d = $.Deferred();

    // noinspection JSUnresolvedVariable
    this.user.friends.groups.forEach(function (group) {
        group.items.forEach(function (item) {
            friends.push(item);
        });
    });
    d.resolve(friends);

    return d.promise();
};

FourSquare.prototype.getTips = function (venueId) {

    var d = $.Deferred(), request = new GearHttp(this.sap, this.model);

    if (!this.isAuthorized) {
        d.reject(FourSquare.ERRORS.NOT_AUTHORIZED);
        return d.promise();
    }


    request.open('GET', FourSquare.API_TIPS + venueId + '/tips?limit=' + FourSquare.TIPS_LIMIT + '&' + this.apiSuffix);

    request.onreadystatechange = function () {
        if (request.request.status === 0 && request.request.readyState === 4 && request.request.responseText === '') {
            d.reject(FourSquare.ERRORS.OFFLINE);
            return;
        }

        if (request.request.status === 200 && request.request.readyState === 4) {
            var res = JSON.parse(request.request.responseText);
            // noinspection JSUnresolvedVariable
            d.resolve(res.response.tips.items);
        }
    };

    request.send();

    return d.promise();
};

FourSquare.prototype.checkin = function (venueId, friendIds, withWord) {

    var d = $.Deferred(), self = this, request = new GearHttp(this.sap, this.model), getMentions = function () {
        var d = $.Deferred();
        if (!friendIds || friendIds.length === 0 || friendIds[0] === FourSquare.NO_FRIEND_ID) {
            d.resolve({mention: '', shout: ''});
            return d.promise();
        }

        var mention = '';
        var shout = withWord;

        self.getFriends().then(function (friends) {
            friends.forEach(function (friend) {
                for (var i = 0; i < friendIds.length; i++) {
                    if (friend.id === friendIds[i].toString()) {
                        if (i === 0) {
                            shout += ' ';
                        }
                        if (i > 0 && i < friendIds.length) {
                            shout += ', ';
                        }

                        mention += shout.length + ',';
                        shout += friend.firstName;
                        mention += shout.length + ',' + friendIds[i].toString() + ';';
                    }
                }
            });

            d.resolve({
                mention: '&mentions=' + mention,
                shout: '&shout=' + shout
            });
        });

        return d.promise();
    };

    if (!this.isAuthorized) {
        d.reject(FourSquare.ERRORS.NOT_AUTHORIZED);
        return d.promise();
    }


    getMentions().then(function (mentions) {

        request.open('POST', FourSquare.API_CHECKIN + '?' + self.apiSuffix + '&venueId=' + venueId + mentions.mention + mentions.shout);

        request.onreadystatechange = function () {
            if (request.request.status === 0 && request.request.readyState === 4 && request.request.responseText === '') {
                d.reject(FourSquare.ERRORS.OFFLINE);
                return;
            }
            if (request.request.status === 200 && request.request.readyState === 4) {
                var res = JSON.parse(request.request.responseText);
                // noinspection JSUnresolvedVariable
                if (res.meta.code === 200) {
                    d.resolve(res.response.checkin);
                }
            }
        };

        request.send();

    });

    return d.promise();
};

FourSquare.prototype.getUser = function () {
    var d = $.Deferred(), request = new GearHttp(this.sap, this.model), self = this;

    if (!this.isAuthorized) {
        d.reject(FourSquare.ERRORS.NOT_AUTHORIZED);
        return d.promise();
    }


    request.open('GET', FourSquare.API_USERS + 'self' + '?' + this.apiSuffix);

    request.onreadystatechange = function () {
        if (request.request.status === 0 && request.request.readyState === 4 && request.request.responseText === '') {
            d.reject(FourSquare.ERRORS.OFFLINE);
            return;
        }

        Log.d('Got user');
        if (request.request.readyState === 4 && request.request.status === 200) {
            var res = JSON.parse(request.request.responseText);
            self.user = res.response.user;
            d.resolve(res.response.user);
        }
    };

    request.send();

    return d.promise();
};