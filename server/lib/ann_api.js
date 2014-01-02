var ANN_API = 'http://cdn.animenewsnetwork.com/encyclopedia/api.xml';
var ANN_REPORTS = 'http://cdn.animenewsnetwork.com/encyclopedia/reports.xml';

function getSingleField(value) {
    return value && value.length > 0 ? value[0] : null;
}
function getArrayField(value) {
    return value && value.length > 0 ? value: null;
}

Meteor.methods({

    fetchCompleteAnimeList: function(){
        // if we are issuing this request, then we must be getting info
        // from the source API.
        var response = HTTP.get(ANN_REPORTS+'?id=155&type=anime&nlist=all');
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
        var response = HTTP.get(ANN_API+'?anime='+parseInt(animeId,10));
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
                    case 'Genres': doc.genres.push(value.toLowerCase()); break;
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
            result = Meteor.call('fetchAnimeData');
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
    var matches2 = matches[3].match(/^(.*)\s\((ep.*)\)$/);
    return {
        num      : parseInt(matches[1],10),
        song     : matches[2].replace(/"/g,''),
        artist   : matches2 ? matches2[1] : matches[3],
        episodes : matches2 ? matches2[2] : null
    };
}