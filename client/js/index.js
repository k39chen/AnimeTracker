$(document).ready(function(){
    
    Sidebar.init();         // intitialize the sidebar
    MetricsMenu.init();     // initialize the metrics menu
    OptionsMenu.init();     // initialize the options menu
    AnimeInfoModal.init();  // initialize the anime info modal

    // test revealing
    $('#toggle-addanime').hoverable().click(function(){
        $('#modalAddAnime').reveal();
    });
});

/** SIDEBAR **/
var Sidebar = {
    init: function(){
        // initialize the scrollbars
        $('#notifications-list').mCustomScrollbar();

        // initialize controls
        $('#toggle-sidebar').hoverable().click(function(){
            Sidebar.isVisible() ? Sidebar.hide(500) : Sidebar.show(500);
        });
        $('.navitem').click(function(){
            Sidebar.setPage($(this).attr('data-page'));
        });
        $('#profile-text-group, .navitem, .notification, .ack').hoverable();

        // show the sidebar by default
        Sidebar.show();

        // show the collection page by default
        Sidebar.setPage('collection');
    },
    setPage: function(page){
        // show the requested page
        $('.page').hide();
        $('.page[data-page="'+page+'"]').show().css({opacity:0}).stop().animate({opacity:1},500);

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
        duration = duration ? duration : 0;
        $('#sidebar').animate({left:-240},duration);
        $('#mainpanel').animate({left:0},duration);
        $('#toggle-sidebar').removeClass('active');
    }
};

/** METRICS MENUS **/
var MetricsMenu = {
    init: function() {
        $('#toggle-metricsmenu').hoverable().click(function(){
            MetricsMenu.isVisible() ? MetricsMenu.hide(500) : MetricsMenu.show(500);
        });
        // hide the metrics menu by default
        MetricsMenu.hide();
    },
    isVisible: function(){
        return $('#toggle-metricsmenu').hasClass('active');
    },
    show: function(duration){
        duration = duration ? duration : 0;
        $('#metricsmenu').show().animate({height:64},duration);
        $('#pagecontainer').animate({top:128},duration);
        $('#toggle-metricsmenu').addClass('active');
    },
    hide: function(duration){
        duration = duration ? duration : 0;
        $('#metricsmenu').animate({height:0},duration,function(){$(this).hide()});
        $('#pagecontainer').animate({top:64},duration);
        $('#toggle-metricsmenu').removeClass('active');
    }
}

/** OPTIONS MENUS **/
var OptionsMenu = {
    init: function(){
        // initialize the scrollbar
        $('#optionsmenu-sections').mCustomScrollbar();

        // handle toggling of search options pane
        $('#toggle-optionsmenu').hoverable().click(function(){
            OptionsMenu.isVisible() ? OptionsMenu.hide(500) : OptionsMenu.show(500);
        });

        // allow selecting of options in the optionmenu
        $('.optionsmenu-item').hoverable().click(function(){
            var section = $(this).parent('.optionsmenu-section').attr('data-section');
            OptionsMenu.selectOption(section,$(this).attr('data-value'));
        });

        // select all the default options
        OptionsMenu.resetOptions();

        // hide the options menu by default
        OptionsMenu.hide();
    },
    isVisible: function(){
        return $('#toggle-optionsmenu').hasClass('active');
    },
    resetOptions: function(){
        $('.optionsmenu-section').each(function(){
            var section = $(this).attr('data-section');
            var value = $('.optionsmenu-item[data-default]',this).attr('data-value');
            OptionsMenu.selectOption(section,value);
        });
    },
    selectOption: function(section,value){
        var sectionObj = $('.optionsmenu-section[data-section="'+section+'"]');
        var itemObj = $('.optionsmenu-item[data-value="'+value+'"]',sectionObj);
        var iconObj = $('.tickbox',itemObj);

        $('.optionsmenu-item',sectionObj).removeClass('active');
        $('.tickbox',sectionObj).addClass('fa-circle');
        itemObj.addClass('active');
        iconObj.removeClass('fa-circle').addClass('fa-check-circle');
    },
    show: function(duration){
        duration = duration ? duration : 0;
        $('#optionsmenu').animate({right:0},duration);
        $('#mainpanel').animate({right:240},duration);
        $('#toggle-optionsmenu').addClass('active');
    },
    hide: function(duration){
        duration = duration ? duration : 0;
        $('#optionsmenu').animate({right:-240},duration);
        $('#mainpanel').animate({right:0},duration);
        $('#toggle-optionsmenu').removeClass('active');
    }
};

/** ANIME INFO MODAL **/
var AnimeInfoModal = {

    init: function() {
        // initialize hoverable items
        $('.subscribed-flag, .animeInfo-navtrigger, .animeInfo-navitem').hoverable();

        // intialize dropdown menu for the navbar
        $('.animeInfo-navbar').dropit({
            action: 'click',
            triggerEl: '.animeInfo-navtrigger'
        });
        // set up interaction to switch pages
        $('.animeInfo-navitem').click(function(){
            AnimeInfoModal.setPage($(this).attr('data-page'));
        });

        // by default set the profile page
        AnimeInfoModal.setPage('profile');
    },
    setPage: function(page) {
        var pageObj = $('.modalpage[data-page="'+page+'"]');

        // show the requested page
        $('.modalpage').hide();
        pageObj.show().css({opacity:0}).stop().animate({opacity:1},500);

        // update the navbar controls
        $('.animeInfo-navtrigger span').text(page.capitalize());
        $('.animeInfo-navitem').removeClass('active');
        $('.animeInfo-navitem[data-page="'+page+'"]').addClass('active');

        // reinitialize the scrollbar
        $('.modalpagecontainer').mCustomScrollbar('destroy');
        $('.modalpagecontainer').mCustomScrollbar();
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
