/*global tau, tizen, LANG_JSON_DATA, ActionMenu, $, SAP, Utils, GearModel, FourSquare, ToastMessage, List, Log, VenueDetails*/
/*jshint unused: false*/
/*jslint laxbreak: true*/

var selectedVenueId = null;
var selectedVenue = null;
var sap = null;
var model = null;
var actionMenu = null;
var openLinkMenu = null;
var fourSquare = null;
var toastMessage = null;
var selectedFriends = [];
var list;
var friendsList;
var venueMenu = null;

function handleError(err) {
    switch (err) {
        case FourSquare.ERRORS.OFFLINE:
            if (!fourSquare.user) {
                if (!confirm(LANG_JSON_DATA.OFFLINE_TRY_AGAIN)) {
                    exitapp();
                    return;
                }
                getUser();
                return;
            }

            if (Utils.getActivePage() === 'main') {
                toastMessage.show(LANG_JSON_DATA.OFFLINE);
            } else {
                $('#main').one('pageshow', function () {
                    toastMessage.show(LANG_JSON_DATA.OFFLINE);
                });
                tau.changePage("#main");
            }
            break;
        case FourSquare.ERRORS.NOT_AUTHORIZED:
            if (!confirm(LANG_JSON_DATA.LOGIN_ERROR_BODY)) {
                exitapp();
            }
            sap.connectOnDeviceNotConnected = true;
            sap.sendData(SAP.SERVICE_CHANNEL_ID, SAP.AUTH_NEEDED).then(function () {
                sap.connectOnDeviceNotConnected = false;
            });
            break;
        default:
            alert(err);
            break;
    }
}

function exitapp() {
    tizen.application.getCurrentApplication().exit();
}

function openMenuLink() {
    openLinkMenu.show();
}

/*
 * Display load page text - text to display
 */
function showLoadPage(text, pageOpened) {
    if (tau.support.shape.circle) {
        $('#processingPageText').html(text);
        $('#processingPage').one('pageshow', pageOpened);
        tau.changePage('#processingPage');
    } else {
        $("#smallProcessingText").html(text);
        $('#smallProcessingPage').one('pageshow', pageOpened);
        tau.changePage("#smallProcessingPage");
    }
}

function showScoreText(sender) {
    toastMessage.show(sender.innerHTML);
}

function getUserName(user) {
    if (!user.firstName && !user.lastName) {
        return null;
    }
    if (user.firstName && !user.lastName) {
        return user.firstName;
    }
    if (!user.firstName && user.lastName) {
        return user.lastName;
    }
    return user.firstName + ' ' + user.lastName;
}

function requestTipsClick() {

    showLoadPage(LANG_JSON_DATA.LOADING_TIPS, function () {

        fourSquare.getTips(selectedVenue.id).then(function (tips) {
            var list = $("#tipsPage ul");
            list.empty();
            $("#tipsPage h2").html(selectedVenue.name);

            if (tips.length === 0) {
                $('#venueDetails').one('pageshow', function () {
                    toastMessage.show(LANG_JSON_DATA.NO_TIPS);
                });
                tau.changePage("#venueDetails");
                return;
            }

            for (var i = 0; i < tips.length; i += 1) {
                var friendName = getUserName(tips[i].user);
                if (!friendName) {
                    continue;
                }
                list.append('<li class="li-has-multiline" id="' + tips[i].id + '"><label>' + friendName + '<span class="li-text-sub ui-li-sub-text">' + tips[i].text + '</span></label></li>');
            }

            tau.changePage("#tipsPage");
        }, handleError, function () {
        });
    });
}

function openLinkClick() {
    $("#urlPage iFrame").prop('src', selectedVenue.url);
    tau.changePage("#urlPage");
}

function openLinkBrowserClick() {
    sap.openLinkOnPhone(selectedVenue.url);
}

function getUser() {
    fourSquare.getUser().then(function () {
        getVenuesList();
    }, handleError, function () {
    });
}

function getVenuesList() {

    fourSquare.getVenues().then(function (venues) {
        var i;
        var mainList = $('#main ul');
        navigator.vibrate([100, 100, 100, 100]);

        mainList.empty();
        var l = '';

        switch (Utils.getGearVersion(model)) {
            case GearModel.GEAR_1:
            case GearModel.GEAR_2:
                for (i = 0; i < venues.length; i += 1) {
                    l += '<li onclick="getVenueDetails(this.id)" id="' + venues[i].id + '">' + venues[i].name + '</li>';
                }
                break;
            default:
                for (i = 0; i < venues.length; i += 1) {
                    // noinspection HtmlRequiredAltAttribute
                    l += '<li class="li-has-thumb-left" onclick="getVenueDetails(this.id)" id="' + venues[i].id + '">' + venues[i].name + '<img src="' + venues[i].image + '" class="ui-li-thumb-left"/></li>';
                }
                break;
        }

        mainList.append(l);

        tau.changePage("#main");
    }, function (err) {
        switch (err.code) {
            case SAP.LOCATION_ERROR_CODES.POSITION_UNAVAILABLE:
                if (!confirm(LANG_JSON_DATA.POSITION_UNAVAILABLE)) {
                    exitapp();
                    return;
                }
                getVenuesList();
                break;
            case SAP.LOCATION_ERROR_CODES.PERMISSION_DENIED:
                if (!confirm(LANG_JSON_DATA.PERMISSION_DENIED)) {
                    exitapp();
                    return;
                }
                getVenuesList();
                break;
            case SAP.LOCATION_ERROR_CODES.TIMEOUT:
                if (!confirm(LANG_JSON_DATA.GPS_TIMEOUT)) {
                    exitapp();
                    return;
                }
                getVenuesList();
                break;
            default:
                alert(err.message);
                exitapp();
                break;
        }
    }, handleError);
}

function onreceive(channelId, data) {

    switch (channelId) {
        case SAP.SERVICE_CHANNEL_ID:
            if (data === SAP.AUTH_NEEDED) {
                FourSquare.accessToken = '';
                if (!confirm(LANG_JSON_DATA.LOGIN_ERROR_BODY)) {
                    exitapp();
                }
                sap.connectOnDeviceNotConnected = true;
                sap.sendData(SAP.SERVICE_CHANNEL_ID, SAP.AUTH_NEEDED).then(function () {
                    sap.connectOnDeviceNotConnected = false;
                });
                return;
            }

            if (fourSquare.accessToken !== data) {
                fourSquare.accessToken = data;
                getUser();
            }
            break;
    }
}

function callVenue() {
    if (!confirm(LANG_JSON_DATA.CALL + " " + selectedVenue.name + "?")) {
        return;
    }
    // noinspection HttpUrlsUsage
    var appControl = new tizen.ApplicationControl("http://tizen.org/appcontrol/operation/call", "tel:" + selectedVenue.contactPhone);
    tizen.application.launchAppControl(appControl, null, null, null, null);
}


/*
 * Request for venue details sender - selected venue in venues list
 */
function getVenueDetails(id) {
    selectedVenueId = id;
    venueMenu.show();
}

function openVenue(id) {
    var venuePreview = $('#venuePreview');

    fourSquare.getVenueDetails(id)
        .then(function (venue) {

            switch (Utils.getGearVersion(model)) {
                case GearModel.GEAR_1:
                case GearModel.GEAR_2:
                    venuePreview.parent().removeClass('li-has-thumb-left');
                    venuePreview.hide();
                    break;
                default:
                    venuePreview.parent().addClass('li-has-thumb-left');
                    break;
            }

            selectedVenue = venue;
            venuePreview.attr('src', venue.image);

            $("#venueName").html(selectedVenue.name);
            $("#venueDetails h2").html(selectedVenue.name);

            // Address
            $("#venueAddress span").html(selectedVenue.address);

            // Stats
            $("#venueTotalCheckins span").html(selectedVenue.checkinsCount);
            $("#venueUserCheckins span").html(selectedVenue.usersCount);
            $("#venueTipsCount span").html(selectedVenue.tipCount);

            // Description
            $("#venueDescription span").html(selectedVenue.description);

            // Been here
            $("#venueBeenHere span").html(selectedVenue.beenHere);

            // Site
            if (selectedVenue.url !== VenueDetails.NO_DATA) {
                switch (Utils.getGearVersion(model)) {
                    case GearModel.GEAR_1:
                    case GearModel.GEAR_2:
                        openLinkMenu.hideMenuItem('openLinkMenuItem');
                        break;
                    default:
                        openLinkMenu.showMenuItem('openLinkMenuItem');
                        break;
                }
            }
            $("#venueUrl span").html(selectedVenue.url);

            // HereNow
            $("#venuePeopleHere span").html(selectedVenue.hereNow);

            // Rating
            $("#venueRating span").html(selectedVenue.rating);

            // Phone
            $("#phoneLabel span").html(selectedVenue.contactPhone);

            // Twitter
            $("#twitterLabel span").html(selectedVenue.contactTwitter);

            tau.changePage('#venueDetails');
        }, handleError, function () {
        });
}

function createListItem(id, name, checked) {
    if (checked === true) {
        return $('<li class="li-has-radio" onclick="friendClick(' + id + ')"><label id="' + id + '">' + name + '<input type="radio" name="radio-el" checked="true" value=' + id + '"/></label></li>');
    }
    return $('<li class="li-has-radio" onclick="friendClick(' + id + ')"><label id="' + id + '">' + name + '<input type="radio" name="radio-el" value=' + id + '"/></label></li>');
}

/*
 * Request friends for user
 */
function getFriends() {

    fourSquare
        .getFriends()
        .then(function (friends) {

            $('#friendsPage').one('pageshow', function () {

                friendsList.empty();

                friendsList.append(createListItem(FourSquare.NO_FRIEND_ID, LANG_JSON_DATA.NO_FRIENDS, selectedFriends.length === 0 || selectedFriends[0] === FourSquare.NO_FRIEND_ID));

                for (var i = 0; i < friends.length; i += 1) {
                    var friendName = getUserName(friends[i]);

                    if (!friendName) {
                        continue;
                    }

                    friendsList.append(createListItem(friends[i].id, friendName, selectedFriends.length > 0 && selectedFriends[0].toString() === friends[i].id));
                }
            });

            tau.changePage("#friendsPage");

        }, handleError, function () {
        });

}

function friendClick(id) {
    var radio = friendsList.getFirstSubByRootId(id, 'input');
    radio.prop('checked', true);
    selectedFriends = [];
    selectedFriends.push(id);
}


/*
 * Closing friends page
 */
function closeFriends() {
    tau.changePage("#venueDetails");
}

/*
 * Checkin request
 */
function checkin(venueId) {

    showLoadPage(LANG_JSON_DATA.PERFORM_CHECKIN, function () {
        fourSquare
            .checkin(venueId, selectedFriends, LANG_JSON_DATA.WITH)
            .then(function (checkin) {
                selectedFriends = [];
                $('#checkinResultPage').one('pageshow', function () {
                    var res = '';
                    list.empty();
                    // noinspection JSUnresolvedVariable
                    if (checkin && checkin.score && checkin.score.scores && checkin.score.scores.length > 0) {
                        for (var i = 0; i < checkin.score.scores.length; i += 1) {
                            res = $('<li class="li-has-multiline"><a href="#" onclick="showScoreText(this)">' + checkin.score.scores[i].message + '<span class="li-text-sub ui-li-sub-text">' + LANG_JSON_DATA.POINTS + ': '
                                + checkin.score.scores[i].points + '</span></a></li>');
                            list.append(res);
                        }
                    } else {
                        res = $('<li class="li-has-multiline"><a href="#">' + LANG_JSON_DATA.CHECKIN_NO_RESULTS + '<span class="li-text-sub ui-li-sub-text"></span></a></li>');
                        list.append(res);
                    }
                });
                tau.changePage("#checkinResultPage");
                navigator.vibrate([250, 250, 250]);
            }, handleError, function () {
            });
    });
}

function initLanguage() {
    $("#2btnPopup-ok").html(LANG_JSON_DATA.CHECKIN_READY_OK_BUTTON);
    $("#loginErrorHeader").html(LANG_JSON_DATA.LOGIN_ERROR_HEADER);
    $("#loginErrorBody").html(LANG_JSON_DATA.LOGIN_ERROR_BODY);
    $("#loginErrorOkButton").html(LANG_JSON_DATA.LOGIN_ERROR_OK_BUTTON);
    $('#friendsForMentionLabel').html(LANG_JSON_DATA.FRIENDS_FOR_MENTION);
    $('#checkinResultPageHeader').html(LANG_JSON_DATA.CHECKIN_RESULT);
    $("#processingText").html(LANG_JSON_DATA.LOADING_VENUES);
    $("#smallProcessingText").html(LANG_JSON_DATA.LOADING_VENUES);
    $("#friendsPage h2").html(LANG_JSON_DATA.FRIENDS);
    $("#checkinCircleButton").attr("data-title", LANG_JSON_DATA.CHECKIN);
    $("#friendsCircleButton").attr("data-title", LANG_JSON_DATA.FRIENDS);
    $("#openLinkMenuItem").html(LANG_JSON_DATA.OPEN_LINK);
    $("#openLinkOnPhoneItem").html(LANG_JSON_DATA.OPEN_LINK_PHONE);
    $('#venueUrl a').prepend(LANG_JSON_DATA.URL);
    $('#venueTipsCount a').prepend(LANG_JSON_DATA.TIPS);
    $("#venueUserCheckins a").prepend(LANG_JSON_DATA.TOTAL_USERS);
    $('#venueTotalCheckins a').prepend(LANG_JSON_DATA.TOTAL_CHECKINS);
    $('#venueBeenHere a').prepend(LANG_JSON_DATA.HAVE_BEEN_HERE);
    $('#venuePeopleHere a').prepend(LANG_JSON_DATA.PEOPLE_HERE);
    $('#venueDescription a').prepend(LANG_JSON_DATA.DESCRIPTION);
    $('#venuePhone a').prepend(LANG_JSON_DATA.PHONE);
    $('#venueTwitter a').prepend(LANG_JSON_DATA.TWITTER);
    $('#venueRating a').prepend(LANG_JSON_DATA.RATING);
    $('#venueAddress a').prepend(LANG_JSON_DATA.ADDRESS);

    $('#main h2').html('SquareGear');
}

$(window).on("load", function () {

    Log.DEBUG = false;

    initLanguage();

    list = new List('#checkinResultPage');
    friendsList = new List('#friendsPage');

    actionMenu = new ActionMenu('venueDetailsMenuPage', 'venueDetailsMenu', [{
        name: 'checkinMenuItem',
        title: LANG_JSON_DATA.CHECKIN,
        image: '/images/checkin.png',
        onclick: function () {
            checkin(selectedVenue.id);
        }
    }, {
        name: 'getFriendsMenuItem',
        title: LANG_JSON_DATA.FRIENDS,
        image: '/images/friends.png',
        onclick: getFriends
    }]);

    openLinkMenu = new ActionMenu('openLinkMenuPage', 'openLinkMenuMenu', [{
        name: 'openLinkMenuItem',
        title: LANG_JSON_DATA.OPEN_LINK,
        image: '/images/open_browser.png',
        onclick: openLinkClick
    }, {
        name: 'openLinkPhoneItem',
        title: LANG_JSON_DATA.OPEN_LINK_PHONE,
        image: '/images/open_browser_phone.png',
        onclick: openLinkBrowserClick
    }]);

    venueMenu = new ActionMenu('venueMenuPage', 'venueMenuMenu', [
        {
            name: 'checkinNowMenuItem',
            title: LANG_JSON_DATA.CHECKIN,
            image: '/images/checkin.png',
            onclick: function () {
                checkin(selectedVenueId);
            }
        },
        {
            name: 'openVenueMenuItem',
            title: LANG_JSON_DATA.DETAILS,
            image: '/images/view.png',
            onclick: function () {
                openVenue(selectedVenueId);
            }
        }
    ]);

    toastMessage = new ToastMessage('popupToastMsg', 'popupToast');

    $('#venueDetailsMenuButton').on('click', function () {
        actionMenu.show();
    });

    sap = new SAP('SquareGearProvider', onreceive);


    tizen.systeminfo.getPropertyValue("BUILD", function (res) {
        model = res.model;

        fourSquare = new FourSquare(sap, model);

        sap.connect().then(function () {
        });
        getUser();

        if (!Utils.isNewGear(model)) {
            try {
                $("$openLinkMenuItem").hide();
            } catch (ignore) {
            }
        }
    });

    $("#urlPage iFrame").on("load", function () {
        $("#urlPage progress").hide();
    });

    // add eventListener for tizenhwkey
    document.addEventListener('tizenhwkey', function (e) {

        if (e.keyName === "back") {
            if (actionMenu.isOpened === true) {
                actionMenu.close();
                return;
            }

            if (venueMenu.isOpened === true) {
                venueMenu.close();
                return;
            }

            if (openLinkMenu.isOpened === true) {
                openLinkMenu.close();
                return;
            }

            switch (Utils.getActivePage()) {
                case 'main':
                case 'startPage':
                case 'smallProcessingPage':
                case 'processingPage':
                case 'errorPage':
                    tizen.application.getCurrentApplication().exit();
                    break;
                case 'friendsPage':
                    tau.changePage('#venueDetails');
                    break;
                case "tipsPage":
                    tau.changePage("#venueDetails");
                    break;
                case 'venueDetails':
                    tau.changePage("#main");
                    break;
                case 'checkinResultPage':
                    tau.changePage("#main");
                    break;
                case "urlPage":
                    $("#urlPage iFrame").prop('src', '');
                    tau.changePage("#venueDetails");
                    break;

            }
        }
    });
});
