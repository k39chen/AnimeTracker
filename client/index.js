Template.animelist.list = function() {
    return Animes.find();
}

$(document).ready(function(){


    Meteor.call('getSampleXMLResponse', function(err,result){
        console.log(result);
        $('body').append(JSON.stringify(result));
    });


});