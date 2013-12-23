Template.animelist.list = function() {
    return Animes.find();
}

$(document).ready(function(){


    Meteor.call('getAnimeData', {id: 1234}, function(err,result){
        console.log(result);
        $('body').append(JSON.stringify(result));
    });


});