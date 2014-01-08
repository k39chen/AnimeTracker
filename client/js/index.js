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

    Session.set('animeId',4240);

    //CropperWizard.init();

    // $('#subscribe-btn').click(function(){
    //     Meteor.call('subscribeToAnime',4240,function(err,res){
    //         console.log('subscribeToAnime',res);
    //     });
    // });
    // $('#unsubscribe-btn').click(function(){
    //     Meteor.call('unsubscribeFromAnime',4240,function(err,res){
    //         console.log('unsubscribeFromAnime',res);
    //     });
    // });

});

/** CROPPER WIZARD **/
var CropperWizard = {
    jcropPortraitApi: null,
    jcropThumbnailApi: null,
    srcUrl: null,
    srcWidth: 0,
    srcHeight: 0,
    init: function(){
        $('#cropper-trigger').leanModal({closeButton:'.close-btn,.cancel-btn'});

        $('.input-url').click(function(){
            $(this).select();
        }).change(function(){
            CropperWizard.srcUrl = $(this).val();
            CropperWizard.loadImage();
        });

        $('.save-btn').click(function(){
            if (CropperWizard.srcUrl) {
                var portrait = CropperWizard.jcropPortraitApi.tellSelect();
                var thumbnail = CropperWizard.jcropThumbnailApi.tellSelect();

                // add the portrait picture component
                Meteor.call('addPicture',{
                    animeId: Session.get('animeId'),
                    type: 'portrait',
                    src: CropperWizard.srcUrl,
                    x: Math.round(portrait.x),
                    y: Math.round(portrait.y),
                    w: Math.round(portrait.w),
                    h: Math.round(portrait.h)
                });
                // add the thumbnail picture component
                Meteor.call('addPicture',{
                    animeId: Session.get('animeId'),
                    type: 'thumbnail',
                    src: CropperWizard.srcUrl,
                    x: Math.round(thumbnail.x),
                    y: Math.round(thumbnail.y),
                    w: Math.round(thumbnail.w),
                    h: Math.round(thumbnail.h)
                });
                CropperWizard.showSuccessBanner();
            }
        });
        $('.cancel-btn,.close-btn').click(function(){
            $('.input-url').val('');
            CropperWizard.destroyTool();
        });
    },
    loadImage: function(){
        var img = $('<img>').attr('src',CropperWizard.srcUrl)
            .load(function(){
                CropperWizard.srcWidth = this.width;
                CropperWizard.srcHeight = this.height;
                
                // destroy the previous tool
                CropperWizard.destroyTool();

                // assign the url to the tool image
                $('.tool-container').each(function(){
                    var toolsrc = $('<img>')
                        .addClass('tool-src')
                        .attr('src',CropperWizard.srcUrl)
                        .appendTo($(this));
                });

                var thumbW, thumbH, portW, portH;
                if (CropperWizard.srcWidth > CropperWizard.srcHeight) {
                    thumbW = thumbH = portH = CropperWizard.srcHeight;
                    portW = portH * (10/16);
                } else {
                    thumbW = thumbH = CropperWizard.srcWidth;
                    portH = CropperWizard.srcHeight;
                    portW = portH * (10/16);
                }

                // create the tools
                $('.tool-group.thumbnail .tool-src').Jcrop({
                    aspectRatio: 1/1,
                    boxWidth: 300,
                    boxHeight: 300,
                    minSize: [100,100],
                    setSelect: [
                        (CropperWizard.srcWidth-thumbW)/2,
                        (CropperWizard.srcHeight-thumbH)/2,
                        (CropperWizard.srcWidth-thumbW)/2+thumbW,
                        (CropperWizard.srcHeight-thumbH)/2+thumbH
                    ]
                },function(){
                    CropperWizard.jcropThumbnailApi = this;
                });
                $('.tool-group.portrait .tool-src').Jcrop({
                    aspectRatio: 10/16,
                    boxWidth: 300,
                    boxHeight: 300,
                    minSize: [80,50],
                    setSelect: [
                        (CropperWizard.srcWidth-portW)/2,
                        (CropperWizard.srcHeight-portH)/2,
                        (CropperWizard.srcWidth-portW)/2+portW,
                        (CropperWizard.srcHeight-portH)/2+portH
                    ]
                }, function(){
                    CropperWizard.jcropPortraitApi = this;
                });
            })
            .error(function(){
                CropperWizard.srcUrl = null;
                $('.input-url').val('');
                CropperWizard.showErrorBanner();
            });
    },
    destroyTool: function(){
        if (CropperWizard.jcropThumbnailApi) {
            CropperWizard.jcropThumbnailApi.destroy();
        }
        if (CropperWizard.jcropPortraitApi) {
            CropperWizard.jcropPortraitApi.destroy();
        }
        $('.tool-container').empty();
    },
    showErrorBanner: function(){
        $('.error-notification-banner').css({height:0})
            .stop().animate({height:32},400)
            .delay(3000)
            .animate({height:0},400);
    },
    showSuccessBanner: function(){
        $('.success-notification-banner').css({height:0})
            .stop().animate({height:32},400)
            .delay(3000)
            .animate({height:0},400);
    }
};
