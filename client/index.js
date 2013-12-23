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
            'k39chen@gmail.com',
            'k39chen@gmail.com',
            'Hello from Meteor!',
            'This is test of Email.send'
        );
    });


});