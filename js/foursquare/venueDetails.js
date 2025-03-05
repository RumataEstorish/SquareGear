VenueDetails.NO_DATA = '-';

function VenueDetails(venue) {
    var self = this;

    // noinspection JSUnresolvedVariable
    Object.defineProperties(this, {
        'venue': {
            get: function () {
                return venue;
            }
        },

        'id': {
            get: function () {
                return venue.id;
            }
        },

        'name': {
            get: function () {
                return venue.name;
            }
        },

        'address': {
            get: function () {
                if (venue.location) {
                    return self._getValue(venue.location.address);
                }
                return VenueDetails.NO_DATA;
            }
        },

        'checkinsCount': {
            get: function () {
                if (venue.stats) {
                    return self._getValue(venue.stats.checkinsCount);
                }
                return VenueDetails.NO_DATA;
            }
        },

        'usersCount': {
            get: function () {
                if (venue.stats) {
                    return self._getValue(venue.stats.usersCount);
                }
                return VenueDetails.NO_DATA;
            }
        },

        'tipCount': {
            get: function () {
                if (venue.stats) {
                    return self._getValue(venue.stats.tipCount);
                }
                return VenueDetails.NO_DATA;
            }
        },

        'description': {
            get: function () {
                return self._getValue(venue.description);
            }
        },

        'beenHere': {
            get: function () {
                if (venue.beenHere) {
                    return self._getValue(venue.beenHere.count);
                }
                return VenueDetails.NO_DATA;
            }
        },

        'hereNow': {
            get: function () {
                if (venue.hereNow) {
                    return self._getValue(venue.hereNow.count);
                }
                return VenueDetails.NO_DATA;
            }
        },

        'rating': {
            get: function () {
                return self._getValue(venue.rating);
            }
        },

        'contactPhone': {
            get: function () {
                if (venue.contact) {
                    // noinspection JSUnresolvedVariable
                    return self._getValue(venue.contact.formattedPhone);
                }
                return VenueDetails.NO_DATA;
            }
        },

        'contactTwitter': {
            get: function () {
                if (venue.contact) {
                    // noinspection JSUnresolvedVariable
                    return self._getValue(venue.contact.twitter);
                }
                return VenueDetails.NO_DATA;
            }
        },

        'url': {
            get: function () {
                return self._getValue(venue.url);
            }
        },

        'image': {
            get: function () {
                if (venue.categories && venue.categories.length > 0 && venue.categories[0].icon) {
                    return venue.categories[0].icon.prefix + 'bg_32' + venue.categories[0].icon.suffix;
                }
                return null;
            }
        }

    });
}

VenueDetails.prototype._getValue = function (val) {
    if (val) {
        return val;
    }
    return VenueDetails.NO_DATA;
};