

//alert("Content Script Running");
//document.getElementById('playerDiv_' + document.getElementById('player').getAttribute("data-video-id")).requestFullscreen(); //chrome does not allow this

let vid = null;
let ponsObj =null;

//console.log("am I in incogneto mode?",chrome.extension.inIncognitoContext); this is a stupid stupid api.

async function atStart(){
    //sendMessage("contentOpen"); 
    await doImports();
    if(!await getPage()) return false;
    if(!await Common.sendMessage("getVal",'loggedOn')) return false;
    await refresh();
}

let Common;
let sitesSearch;
async function doImports()
{
    //console.log("URL over here",chrome.runtime.getURL('/jsCommons/CommonFuncs.js'));
    Common = await import(chrome.runtime.getURL('/jsCommons/CommonFuncs.js'));
    ponsJs = await import(chrome.runtime.getURL('/jsCommons/checkSite.js'));
    sitesSearch = ponsJs.sitesSearch;
    return true;
}


//let mouseOver = false;
let keepContent=null;
let detectDiv;
async function getPage(){
    const urlObj = Common.getUrlObj(await Common.sendMessage("getUrl"));
    ponsObj = sitesSearch(urlObj);
    if(!ponsObj) return false;
    
    //fix this to only get seeker.
    const savedPage = await Common.sendMessage("getContent");
    if(savedPage && savedPage.seeker){
        //if(!savedPage.seeker) throw "wtf no in seeker"
        timesArr = savedPage.seeker;
    }

    document.addEventListener('keydown', detectPress,{'passive': true});
    document.addEventListener('keyup', detectPress,{'passive': true});

    try{
        vid = document.getElementById(ponsObj.videoPlayerDiv).getElementsByTagName("video")[0];
    }
    catch(error){
        //console.log('vid------------------------------',vid);
        vid = null; //idk why video sometimes is not already null., maybe it redirects
        return false;
    }
    
    if(ponsObj.inputDiv!==undefined)
        detectDiv = document.getElementById(ponsObj.inputDiv);
    else detectDiv = null;

    if(ponsObj.setDepth===undefined || ponsObj.setDepth<0) ponsObj.setDepth = 3;
    return true;
}

let hidden = false;
let skipsOn = false;
atStart();

async function refresh(){
    //console.log("--------------------------refreshed-----------------------------");
    if(!ponsObj || !vid) return false;

    const settingsPage = await Common.sendMessage('getSettings');
    const hide = settingsPage.hide;//chkArr.includes(0);
    const skip = settingsPage.seek;//chkArr.includes(1);

    if((!hidden && hide)||(hidden && !hide)){
        //butCont(hide);
        hidElems(hide);
        hidden = hide;
    }
    if(skip) seeker(); //moved uo here
    

    if(!skipsOn && skip){
        skipsOn = true;
    }

    if(skipsOn && !skip){
        skipsOn = false;
    }

    if (timesArr) Common.sendMessage("saveElem",["url","seeker",timesArr]);

    return true;
}

async function hidElems(hide,goAgain = 0){
    let curDiv = document.getElementById(ponsObj.keepContent.startDiv);
    if(!curDiv) return;
    let parDiv = curDiv.parentNode;

    
    while(parDiv !==document.documentElement){
        recursiveHide(parDiv,0,curDiv,hide);

        curDiv = curDiv.parentNode;
        parDiv = curDiv.parentNode;
    }
    if(hide && goAgain <1){
        await sleep(300);
        hidElems(true,++goAgain);
    }
}

function recursiveHide(parDiv,deepness,keepDiv,hide){
    let keep = false;
    if(deepness>ponsObj.setDepth) return false; //!parDiv.children dont need
    for(let divChild of [...parDiv.children]){
        if(decideKeep(divChild,keepDiv) || recursiveHide(divChild,++deepness,null,hide)){
            keep = true;
        }
        else removeDiv(divChild,parDiv,hide);
    }
    return keep;
}

function decideKeep(divChild,keepDiv){
    return ( (keepDiv && divChild===keepDiv) || (ponsObj.keepContent  
    && (ponsObj.keepContent.ids.includes(divChild.id)
    || ponsObj.keepContent.classes.includes(divChild.className))))
}


function removeDiv(divChild,parDiv,hide){
    divChild.hidden = hide;
    //if(hide) parDiv.removeChild(divChild);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let timesArr = [];
async function seeker(){
    const savedPage = await Common.sendMessage("getContent");
    if(savedPage && savedPage.seeker){
        timesArr = savedPage.seeker;
    }
    let firstLoad = true;
    while(timesArr && skipsOn){// aslo make not paused. and change pop up //refresh()??? why
        if(!vid.paused || firstLoad){
            for(const time of timesArr){
                if(vid.currentTime > time[0][0]-.1 && vid.currentTime < time[0][0]+.1 ){
                    if(time[1]) vid.currentTime = time[1][0];
                }
            }
        }
        if(vid.currentTime > vid.duration -.2)  vid.pause();
        if(firstLoad) firstLoad = false;
        await sleep(100);
    }
}

let isKeyDown = false;
let intervalArr = [];

let xDownCount = 0;

async function detectPress(e){
    if (detectDiv && detectDiv.contains(document.activeElement)) return;
    if( e.key ==='c' && skipsOn ){
        if(isKeyDown && e.type ==="keydown") return;

        //console.log("I see c");
        let curTime = [
            Math.round(vid.currentTime*1e2)/1e2,Common.strTime(vid.currentTime.toFixed(0))]; // cur time [num,str]
        if(e.type === "keydown"){
            isKeyDown = true;
            intervalArr[0] = curTime;
        }
        else if(e.type === "keyup" && intervalArr.length>0){
            intervalArr[1] = curTime;
            editSeek("add",intervalArr);
            intervalArr =[];
            isKeyDown = false;
        }

    }
    else if(e.key === 'x'){
        xDownCount++;
        if(xDownCount===5) Common.sendMessage('logOff');
        if(e.type === "keyup"){
            xDownCount = 0;
        }

    }
}

function editSeek(remAdd,val,saveIt = true){
    if(remAdd === "remove"){
        for(let i = 0;i<timesArr.length;i++){
            if(timesArr[i][0][1] === val[0][1] && (timesArr[i].length<2 || timesArr[i][1][1] === val[1][1])){ //changed here
                timesArr.splice(i,1);
                break;
            }
        }
    }

    
    else if(remAdd === "add"){
        if(val[0][0] > val[1][0]){
            let pos0 =  val[0];
            val[0] = val[1];
            val[1] = pos0;
        }
        if(val[1][0]-val[0][0]>.5) timesArr = Common.insertNew(timesArr,val); //new edit
    }


    if(saveIt)//&& timesArr.length>0 && timesArr[timesArr.length-1].length===2
        Common.sendMessage("saveElem",["url","seeker",timesArr]);
    return true
}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    sendBack(request, sender, sendResponse);
    return true;
});   
  function sendBack(request, sender, sendResponse){
    let response = false
    //console.log(request.type,'----------------------------------------------------');
    if(ponsObj && vid){
        if(request.type === 'refresh') response = refresh();
        else if(request.type === 'editSeek') response = editSeek(
            request.content[0],request.content[1]);
        else if(request.type === 'getSeeks') response = timesArr;
        else if(request.type === 'isHiding') response = true;
    }
    sendResponse(response);
 }
