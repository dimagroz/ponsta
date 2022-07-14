//import * as Common from '/jsCommons/commonFuncs.js';

const allSites = [
    
    {
        name: "onqmgta",
        videoPath:"view_video.php", //?viewkey=
        keepContent:{
            ids:["headerWrapper","under-player-comments"], //"header" "under-player-comments"
            classes:["title-container","video-actions-menu"], //"video-info-row",'userRow' multiple names
            startDiv: "player"
        },
        inputDiv: "headerSearchWrapperFree",
        videoPlayerDiv: "player",
        setDepth: 2
    },
    
    {
        name: "wuhcdnr",
        videoPath:"video",
        keepContent:{
            ids:["video-tabs","v-actions-container","site-logo-link","site-logo-svg","xv-search-form"], //"site-logo-svg" "site-logo-link","header"
            classes: ["page-title",], //"stripe white-stripe" "video-actions-menu"
            startDiv:"video-player-bg"
        },
        inputDiv:'xv-search-form',
        videoPlayerDiv:"html5video",
        setDepth: 3
    },

    {
        name: "wg`lrsdq",
        videoPath:"videos",
        keepContent:{
            ids:["commentBox"],
            classes:["search-section","controls"], //,''
            startDiv:"player-container"
        },
        inputDiv: "search-text",
        videoPlayerDiv:"player-container",
        setDepth: 4
    },

    {
        name: "wmww",
        videoPath:"video-",
        keepContent:{
            ids:["tabComments"],
            classes:["topbar","clear-infobar","metadata-row video-metadata"], //"clear-infobar","clear-infobar"
            startDiv:"video-player-bg"
        },
        inputDiv: "form-group",
        videoPlayerDiv:"html5video",
        setDepth: 4
    },

    {
        name: "xntonqm",
        videoPath:"watch/",
        keepContent:{
            ids:["videoComments"],
            classes:["title-bar twelve-column","watch-metadata","header-search","ypLogo"], //"site-header","watch-metadata" ,"upper-menu", "ypLogo" "headerSearchWrapper"
            startDiv:"videoContainer"
        },
        inputDiv: "headerSearch",
        videoPlayerDiv:"videoContainer",
        setDepth: 6
    },

]

export function sitesSearch(urlObj){
    //const urlObj = Common.getUrlObj(url);
    for(const site of allSites){
        if(urlObj.siteName===site.name && urlObj.siteSearch.includes(site.videoPath)){
            return site;
        }
    }
    return null;
}


checkSites();
function checkSites(){
    for(const site of allSites){
        let curName = '';
        for(const l of site.name) curName += String.fromCharCode(l.charCodeAt(0)+1);
        site.name = curName;
    }
}