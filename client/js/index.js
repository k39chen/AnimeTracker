// Meteor.call('searchHummingbird',' Junjō Romantica', function(err,res){
//     console.log('searchHummingbird',res);
// });

// Meteor.call('fetchHummingbirdInfo',' Junjo\'s:gate Romantica',function(err,res){
//     console.log('fetchHummingbirdInfo',res);
// });

// Meteor.call('getFullAnimeData',4240,function(err,res){
//     console.log('getFullAnimeData',res);
// });

// Meteor.call('getShallowAnimeData',4240,function(err,res){
//     console.log('getShallowAnimeData',res);
// });

// Meteor.call('fetchCompleteAnimeList',function(err,res){
//     console.log('fetchCompleteAnimeList',err,res);
// });

Template.collectionPage.animes = function(){
    return Animes.find({},{limit:45}).fetch();
}
Template.collectionPage.rendered = function(){
    $('.gridItem').hoverable();
}

$(function(){

    Session.set('animeId',4240);

    $('#profile-text-group, .navitem, .notification, .ack, .topbar-btn').hoverable();

    // intitialize the sidebar
    Sidebar.init();

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

/** SIDEBAR **/
var Sidebar = {
    init: function(){
        // initialize the scrollbars
        $('#notifications-list').mCustomScrollbar();

        // initialize controls
        $('#toggle-sidebar').click(function(){
            Sidebar.isVisible() ? Sidebar.hide(500) : Sidebar.show(500);
        });
        $('.navitem').click(function(){
            Sidebar.setPage($(this).attr('data-page'));
        });

        // show the sidebar by default
        Sidebar.show();

        // show the collection page by default
        Sidebar.setPage('collection');
    },
    setPage: function(page){
        // show the requested page
        $('.page').hide();
        $('#'+page+'Page').show().css({opacity:0}).stop().animate({opacity:1},500);

        // update the navbar controls
        $('.navitem').removeClass('active');
        $('#navbar-'+page).addClass('active');

        // reinitialize the scrollbar
        $('#pagecontainer').mCustomScrollbar('destroy');
        $('#pagecontainer').mCustomScrollbar();
    },
    isVisible: function(){
        return $('#toggle-sidebar').hasClass('active');
    },
    show: function(duration){
        duration = duration ? duration : 0;
        $('#sidebar').animate({left:0},duration);
        $('#mainpanel').animate({left:240},duration);
        $('#toggle-sidebar').addClass('active');
    },
    hide: function(duration){
        console.log('show');
        duration = duration ? duration : 0;
        $('#sidebar').animate({left:-240},duration);
        $('#mainpanel').animate({left:0},duration);
        $('#toggle-sidebar').removeClass('active');
    }
};

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

String.prototype.slugify = function(){
  var str = this;
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  var from = "ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;";
  var to   = "aaaaaeeeeeiiiiooooouuuunc------";
  for (var i=0, l=from.length ; i<l ; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

  return str;
}