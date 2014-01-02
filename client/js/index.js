Meteor.call('getFullAnimeData',4240,function(err,res){
    console.log('getFullAnimeData',err,res);
});

Meteor.call('getShallowAnimeData',4240,function(err,res){
    console.log('getShallowAnimeData',err,res);
});

// Meteor.call('getCompleteAnimeList',function(err,res){
//     console.log('getCompleteAnimeList',err,res);
// });