Template.animelist.list = function() {
    return Animes.find();
}

$(document).ready(function(){


    Meteor.call('getAnimeData', {id: 1234}, function(err,result){
        console.log(result);
        $('body').append(JSON.stringify(result));
    });

    $('#send-email-btn').click(function(){
        Meteor.call('sendEmail',
            'AnimeTracker@notifications.com',
            'k39chen@gmail.com',
            'Hot and Fresh Anime Episodes (2)!',
            Template.emailContent({
                message:"You must see this, it's amazing!",
                url:"http://animetracker.meteor.com/",
                title:"Amazing stuff, click me!"
            })
        );
    });


});