Meteor.call('getFullAnimeData',4240,function(err,res){
    console.log('getFullAnimeData',res);
});

Meteor.call('getShallowAnimeData',4240,function(err,res){
    console.log('getShallowAnimeData',res);
});

// Meteor.call('getCompleteAnimeList',function(err,res){
//     console.log('getCompleteAnimeList',err,res);
// });

$(function(){


    CropperWizard.init();

    $('#subscribe-btn').click(function(){
        Meteor.call('subscribeToAnime',4240,function(err,res){
            console.log('subscribeToAnime',res);
        });
    });
    $('#unsubscribe-btn').click(function(){
        Meteor.call('unsubscribeFromAnime',4240,function(err,res){
            console.log('unsubscribeFromAnime',res);
        });
    });

});

/** CROPPER WIZARD **/
var CropperWizard = {
    jcropPortraitApi: null,
    jcropThumbnailApi: null,
    srcUrl: null,
    srcWidth: 0,
    srcHeight: 0,
    init: function(){
        $('#cropper-trigger').leanModal({closeButton:".close-btn, .cancel-btn"});

        $('.input-url').click(function(){
            $(this).select();
        }).change(function(){
            CropperWizard.srcUrl = $(this).val();
            CropperWizard.loadImage();
        });

        $('.save-btn').click(function(){
            CropperWizard.jcropThumbnailApi.destroy();
            CropperWizard.jcropPortraitApi.destroy();
            $('.tool-container').empty();
        });
    },
    loadImage: function(){
        var img = $('<img>').attr('src',CropperWizard.srcUrl)
            .load(function(){
                CropperWizard.srcWidth = this.width;
                CropperWizard.srcHeight = this.height;
                
                // destroy the previous tool
                if (CropperWizard.jcropThumbnailApi) {
                    CropperWizard.jcropThumbnailApi.destroy();
                }
                if (CropperWizard.jcropPortraitApi) {
                    CropperWizard.jcropPortraitApi.destroy();
                }
                $('.tool-container').empty();

                // assign the url to the tool image
                $('.tool-container').each(function(){
                    var toolsrc = $('<img>')
                        .addClass('tool-src')
                        .attr('src',CropperWizard.srcUrl)
                        .appendTo($(this));
                });

                // create the tools
                $('.tool-group.thumbnail .tool-src').Jcrop({
                    aspectRatio: 1/1,
                    boxWidth: 300,
                    boxHeight: 300,
                    setSelect: [
                        0, 0,
                        CropperWizard.srcWidth,
                        CropperWizard.srcHeight
                    ],
                    onChange: function(c){
                        console.log(c);
                    },
                    onSelect: function(c){
                        console.log(c);
                    }
                },function(){
                    CropperWizard.jcropThumbnailApi = this;
                });
                $('.tool-group.portrait .tool-src').Jcrop({
                    aspectRatio: 10/16,
                    boxWidth: 300,
                    boxHeight: 300,
                    setSelect: [
                        (CropperWizard.srcWidth-200)/2,
                        (CropperWizard.srcHeight-320)/2,
                        (CropperWizard.srcWidth-200)/2+200,
                        (CropperWizard.srcHeight-320)/2+320
                    ],
                    onChange: function(c){
                        console.log(c);
                    },
                    onSelect: function(c){
                        console.log(c);
                    }
                }, function(){
                    CropperWizard.jcropPortraitApi = this;
                });
            })
            .error(function(){
                CropperWizard.srcUrl = null;
                $('.input-url').val('');
                CropperWizard.showBanner();
            });
    },
    showBanner: function(){
        $('.notification-banner').css({height:0})
            .stop().animate({height:32},400)
            .delay(3000)
            .animate({height:0},400);
    }
};
