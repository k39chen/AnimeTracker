// Meteor.call('searchHummingbird',' Junjō Romantica', function(err,res){
//     console.log('searchHummingbird',res);
// });

// Meteor.call('fetchHummingbirdInfo',' Junjo\'s:gate Romantica',function(err,res){
//     console.log('fetchHummingbirdInfo',res);
// });

Meteor.call('getFullAnimeData',1,function(err,res){
    console.log('getFullAnimeData',res);
});

// Meteor.call('getShallowAnimeData',4240,function(err,res){
//     console.log('getShallowAnimeData',res);
// });

// Meteor.call('fetchCompleteAnimeList',function(err,res){
//     console.log('fetchCompleteAnimeList',err,res);
// });
