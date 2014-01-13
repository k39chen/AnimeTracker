var ANN_API = 'https://animenewsnetwork.p.mashape.com/api.xml';
var ANN_REPORTS = 'https://animenewsnetwork.p.mashape.com/reports.xml';
var HUMMINGBIRD_API = 'https://hummingbirdv1.p.mashape.com/anime/';
var HUMMINGBIRD_SEARCH = 'http://hummingbird.me/search?query={{hbAnimeId}}&type=anime';
var MASHAPE_KEY = 'pT8ejx9ujTSBpdtA3Dz3BT9KdIZn77VK';

// http://www.rabbitpoets.com/anime-planet-com-a-worthy-replacement-for-myanimelist/

// http://www.anime-planet.com/anime/one-piece
// http://anime-pictures.net/pictures/view_posts/0?search_tag=bleach&order_by=rating&ldate=0&lang=en
// http://myanimelist.net/anime/1234

function getSingleField(value) {
    return value && value.length > 0 ? value[0] : null;
}
function getArrayField(value) {
    return value && value.length > 0 ? value: null;
}

Meteor.methods({

    searchHummingbird: function(hbAnimeId){
        var url = HUMMINGBIRD_SEARCH.replace('{{hbAnimeId}}',encodeURI(hbAnimeId)).replace(/ /g,'+');
        var response = HTTP.get(url);

        // see if we have received a healthy response from the Hummingbird service
        if (response.content) {
            var $ = Cheerio.load(response.content);
            if ($('.search-result.cf').length > 0) {
                var match = $('.search-result.cf').first();
                return $('.columns.title a',match).attr('href').replace('/anime/','');
            } else {
                console.log('Error fetching search results for '+hbAnimeId);
            }
        }
        return null;
    },

    fetchHummingbirdInfo: function(hbAnimeId) {
        var result = null;
        try {
            response = HTTP.get(HUMMINGBIRD_API+hbAnimeId,{
                headers: {'X-Mashape-Authorization': MASHAPE_KEY}
            });
            if (response && response.data) {
                result = {
                    hbAnimeId: response.data.slug,
                    pictureUrl: response.data.cover_image,
                    numEpisodes: response.data.status == 'Currently Airing' ? null : response.data.episode_count
                };
            }
        } catch(err) {
            // lets try to a hummingbird search and select the first result, if it exists
            var hbAnimeId = Meteor.call('searchHummingbird',hbAnimeId);
            if (hbAnimeId) {
                return Meteor.call('fetchHummingbirdInfo',hbAnimeId);
            }
        }
        if (!result) {
            console.log('Error fetching picture for '+hbAnimeId);
        }
        return result;
    },

    fetchCompleteAnimeList: function(){
        // if we are issuing this request, then we must be getting info
        // from the source API.
        console.log('Fetching complete anime list');
        var response = HTTP.get(ANN_REPORTS+'?id=155&type=anime&nlist=all',{
            headers: {'X-Mashape-Authorization': MASHAPE_KEY}
        });
        if (response.content) {
            var data = XML2JS.parse(response.content);
        
            // we will try to add new entries into the Animes collection
            for (var i=0; i<data.report.item.length; i++) {
                var item  = data.report.item[i];
                var doc = {
                    id:    parseInt(getSingleField(item.id),10),
                    title: getSingleField(item.name),
                    type:  getSingleField(item.type).toLowerCase(),
                    lastUpdate: null
                };
                console.log('Fetching '+doc.id+': ('+doc.type+') '+doc.title);
                // lets try to get the picture url
                console.log('--- Fetching HBI...');
                var hbi = Meteor.call('fetchHummingbirdInfo',doc.title.slugify());
                if (hbi) {
                    doc.hbAnimeId = hbi.hbAnimeId;
                    if (hbi.pictureUrl == 'http://hummingbird.me/assets/missing-anime-cover.jpg') {
                        hbi.pictureUrl = null;
                    }
                    doc.numEpisodes = hbi.numEpisodes;
                    doc.cover = hbi.pictureUrl;
                    console.log('--- SUCCESS');
                } else {
                    console.log('--- FAILED');
                }
                // if this doesn't exist in the collection, add it
                if (!Animes.findOne({id:doc.id})){
                    Animes.insert(doc);
                }
            }
            return Animes.find().fetch();
        }
        return null;
    },

    fetchAnimeData: function(animeId) {
        var response = HTTP.get(ANN_API+'?anime='+parseInt(animeId,10),{
            headers: {'X-Mashape-Authorization': MASHAPE_KEY}
        });
        if (response.content) {
            var data = XML2JS.parse(response.content);
            data = data.ann.anime[0];
            var doc = {};

            // normalize the general anime data
            var general = data['$'];
            doc.id    = parseInt(general.id,10);
            doc.title = general.name;
            doc.type  = general.type.toLowerCase();

            // normalize the anime info data
            var info = data['info'];
            var foundVintage = false;
            doc.genres = [];
            doc.themes = [];
            for (var i=0; i<info.length; i++) {
                var type = info[i]['$'].type;
                var value = info[i]['_'];
                switch (type) {
                    case 'Picture': doc.annPicture = info[i]['$'].src; break;
                    case 'Genres': 
                        var genre = value.toLowerCase();
                        if (Genres.find({label:genre}).count()>0) {
                            Genres.insert({label:genre});
                        }
                        doc.genres.push(genre);
                        break;
                    case 'Themes': doc.themes.push(value.toLowerCase()); break;
                    case 'Objectionable content': doc.mature = value.toLowerCase(); break;
                    case 'Plot Summary': doc.plot = value; break;
                    case 'Running time': doc.runningTime = value; break;
                    case 'Opening Theme': insertSong('op',animeId,value); break;
                    case 'Ending Theme': insertSong('ed',animeId,value); break;
                    case 'Insert Theme': insertSong('in',animeId,value); break;
                    case 'Number of episodes': doc.numEpisodes = isNaN(parseInt(value)) 
                        ? Episodes.find({animeId:animeId}).count()
                        : parseInt(value);
                        break;
                    case 'Vintage':
                        // TODO: still need to format (start/end)
                        if (!foundVintage) {
                            var reg = /[0-9]{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])/g;
                            var matches = value.match(reg);
                            switch (matches.length) {
                                case 1: doc.startDate = new Date(matches[0]).valueOf();
                                case 2: doc.endDate = new Date(matches[1]).valueOf(); break;
                                default: break;
                            }
                            foundVintage = true;
                        }
                        break;
                    default:
                        break;
                }
            }
            // normalize the anime episode data and add it to the Episodes collection
            var episodes = data['episode'];
            for (var i=0; i<episodes.length; i++) {
                var num = parseInt(episodes[i]['$'].num,10);
                var title = episodes[i].title[0]['_'];
                
                // skip unnumbered episodes
                if (isNaN(num)) continue;

                // add this to the episode collection if it doesn't already exist
                var epDoc = Episodes.findOne({animeId:animeId,num:num});
                if (!epDoc) {
                    Episodes.insert({
                        animeId: animeId,
                        num: num,
                        title: title
                    });
                }
            }
            doc.lastUpdate = new Date().valueOf();

            // we will try to return an existing document in the collection
            var animeDoc = Animes.findOne({id:animeId});

            // if there is a pre-existing document
            if (animeDoc) {
                Animes.update({id:animeId},{$set:doc});
            } else {
                Animes.insert(doc);
            }

            // report the anime data
            return doc;
        }
    },

    getShallowAnimeData: function(animeId){
        // we will try to return an existing document in the collection
        var animeDoc = Animes.findOne({id:animeId});

        // we will only attempt to get updated data if the last time we attempted
        // to fetch from the API is more than 1 day ago.
        var result = {};
        if (timeSinceLastUpdate(animeDoc) > 24) {
            result = Meteor.call('fetchAnimeData',animeId);
        } else {
            result = animeDoc;
        }
        return result;

    },

    getFullAnimeData: function(animeId){
        // the full anime data set is an extension of the shallow data set
        var result = Meteor.call('getShallowAnimeData', animeId);

        // get the additional data
        result.episodes = Episodes.find({animeId:animeId},{$sort:{num:1}}).fetch();
        result.openingThemes = Songs.find({animeId:animeId,type:'op'},{$sort:{num:1}}).fetch();
        result.endingThemes = Songs.find({animeId:animeId,type:'ed'},{$sort:{num:1}}).fetch();
        result.insertSongs = Songs.find({animeId:animeId,type:'in'},{$sort:{num:1}}).fetch();

        return result;
    },

    subscribeToAnime: function(animeId) {
        var userId = Meteor.userId();

        // create a relationship between the user and the anime (described with subscription)
        if (Subscriptions.find({userId:userId,animeId:animeId}).count() > 0) {
            return 'User is already subscribed to anime with id: '+animeId;
        }
        // establish the subscription
        Subscriptions.insert({
            userId: userId,
            animeId: animeId,
            status: -1, // queued,watching,finished,dropped,suspended
            rating: 5
            // ...
        });
        return 'Successfully subscribed user to anime with id: '+animeId;
    },

    // TODO: Make sure that this also removes all user data associated with this anime
    unsubscribeFromAnime: function(animeId) {
        var userId = Meteor.userId();

        // create a relationship between the user and the anime (described with subscription)
        if (Subscriptions.find({userId:userId}).count() > 0) {
            Subscriptions.remove({userId:userId,animeId:animeId});
            return 'Successfully unsubscribed user from anime with id: '+animeId;
        }       
        return 'User was not previously subscribed to anime with id: '+animeId;
    },

    addPicture: function(params){
        var animeId = params.animeId,
            type = params.type,
            pictureDoc = Pictures.findOne({animeId:animeId,type:type});

        if (pictureDoc) {
            Pictures.update({animeId:animeId,type:type},{$set:params});
        } else {
            Pictures.insert(params);
        }
        return params;
    }

});

// gets the time since the last update for this anime document
function timeSinceLastUpdate(doc) {
    var currentDate = new Date();
    var lastUpdate = doc ? doc.lastUpdate : null;
    return (currentDate-lastUpdate)/3600000; // difference in hours
}

// helper functions for parsing song information
function insertSong(type,animeId,songStr){
    var songinfo = parseSongString(songStr);
    if (!songinfo) return null;
    var songobj = {
        animeId: animeId,
        type: type,
        num: songinfo.num,
        song: songinfo.song,
        artist: songinfo.artist,
        episodes: songinfo.episodes
    }
    if (Songs.find({animeId: animeId, type: type, num: songobj.num}).count() > 0) {
        Songs.update({animeId: animeId, type: type, num: songobj.num}, {$set: songobj});
    } else {
        Songs.insert(songobj);
    }
}
function parseSongString(str) {
    var matches = str.match(/^#([0-9]+):\s(.*)\sby\s(.*)$/);
    if (matches) {
        var matches2 = matches[3].match(/^(.*)\s\((ep.*)\)$/);
        return {
            num      : parseInt(matches[1],10),
            song     : matches[2].replace(/"/g,''),
            artist   : matches2 ? matches2[1] : matches[3],
            episodes : matches2 ? matches2[2] : null
        };
    } else {
        matches = str.match(/^(.*)\sby\s(.*)$/);
        return {
            num      : 1,
            song     : matches[1].replace(/"/g,''),
            artist   : matches[2],
            episodes : null
        }
    }
    return null;    
}
String.prototype.slugify = function(){
  var str = this;
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  var from = "ãàáäâẽèéëêìíïîōõòóöôūùúüûñç·/_,:;";
  var to   = "aaaaaeeeeeiiiioooooouuuuunc------";
  for (var i=0, l=from.length ; i<l ; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

  return str;
}
