var ANN_API = 'http://cdn.animenewsnetwork.com/encyclopedia/api.xml';

Meteor.methods({

    getAnimeData: function(params){
        var response = HTTP.get(ANN_API+ '?anime='+parseInt(params.id,10));
        if (response.content) {
            return XML2JS.parse(response.content);
        }
        return null;
    }

});