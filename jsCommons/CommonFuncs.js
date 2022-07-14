import {sitesSearch} from '/jsCommons/checkSite.js';

export function sendMessage(action = null, value = null, debugMes = null){
    return new Promise( (resolve,reject) => {
        chrome.runtime.sendMessage([action,value], function(response) {
            if(chrome.runtime.lastError) resolve(false);
            else resolve(response);
        });
    });
}

//becaue chrome is giving me this bullshit, I have to send ever single ducking time something is typed in
export function detectChange(form,inputType=null){
    //later if needed will make input type optional and maybe save multiple types
    for(const input of form){
        input.addEventListener("change", ()=> { saveState(form,inputType)});
    }
}

let noneChecked = true;
const funcArr = new Array();

export function saveState(upForm,inputType){
    for(const func of funcArr) if(!func[1]) func[0]();
    const savedArr = [];
    noneChecked = true;
    if(upForm){
        for(let i = 0;i< upForm.length;i++){
            if(inputType === "text" && (upForm[i].type === 'text')) // || upForm[i].tagName==="SPAN"
                savedArr.push(getText(upForm[i]));
            else if(inputType === "check" && upForm[i].type === 'checkbox' && upForm[i].checked){
                savedArr.push(i);
                noneChecked = false;
            }
        }
    }
    for(const func of funcArr) if(func[1]) func[0]();
    sendMessage("saveState",savedArr);
}

export function addfunc(func,atEnd=false){
    funcArr.push([func,atEnd]);
}


export function getNoneChecked(){ //review why this doesnt work later
    return noneChecked;
}


//for now each one will have its own
export async function setState(form, inputType = null){
    //later will make set multiple types at once for saved state
    let stateArr = await sendMessage("getState");
    if(!form || !inputType) return false; //why or !inputType?
    if (stateArr.length){
        let n = 0;
        if(inputType === "text"){
            for(let i=0;i<form.length;i++){
                if(form[i].type === 'text'){ // ||form[i].tagName === "SPAN"
                    setText(form[i],stateArr[n]);
                } 
                n++;
            }
        }
        else if(inputType === "check"){
            for(let i of stateArr) 
                form[i].checked = true;
        }
    }
    return true;
}

export function strToArr(str){
    const namesArr = str.split(',');
    for(let i=0;i<namesArr.length;i++){
        namesArr[i] = namesArr[i].trim();
    }
    return namesArr;
}

export function strTime(sec_num) {
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}


    if(!hours) return minutes+':'+seconds;
        return hours +':'+minutes+':'+seconds;
}

export function getUrl(strip = false){
    return new Promise(resolve => {
    chrome.tabs.query(
    {
        'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
        (tabs) => {
            const url = tabs[0].url;
            if(strip) resolve(stripUrl(url));
            else resolve(url);
        });
    });
}

export function stripUrl(url){
    //const urlObj = new URL(url);
    url = url.trim();
    if(!url) return "";
    if(url.substring(0,8) === "https://") url = url.substring(8);
    if(url.substring(0,4)=== "www.") url = url.substring(4);
    if(url.includes('#')) url = url.substring(0,url.indexOf('#'));
    if(url.includes('&')) url = url.substring(0,url.indexOf('&')); //&t=
    return url;
}

export function buildUrl(url){
    url = stripUrl(url);
    if(url.substring(0,4)!== "http"){
        url = "https://www." + url;
    }
    return url;
}

export function getUrlObj(url) {
    url = stripUrl(url);

    if(url.indexOf('.')>=0){
        return {
            'siteName': url.substring(0, url.indexOf('.')),
            'siteSearch': url.substring(url.indexOf('.')+5)
        }; 
    }
    return {'siteName' : url,'siteSearch':''};
}

export function insertNew(arr,val){//glitchy
    let added = false
    for(let i=0;i<arr.length;i++){
        if(val[0][0]<= arr[i][0][0]){
            added = true;
            if(val[1][0]< arr[i][0][0]){
                arr.splice(i,0,val); //adds elemnt at i
                break;
            }
            else if(val[1][0]<=arr[i][1][0]) arr[i][0] = val[0];
            else arr[i] = val;
            val = structuredClone(arr[i]);//arr[i]; //make this object its own.
        }
        else if(val[0][0]<= arr[i][1][0]){
            added = true;
            if(val[1][0]>arr[i][1][0]) arr[i][1] = val[1];
            val = structuredClone(arr[i]);//arr[i];
            
        }
        
        if(!val) console.log("val is null again");
        //val = structuredClone[arr[i]];
        
    }
    if (!added) arr.push(val);
    
    if(!val) console.log("val is null again");
    return remDup(arr);

}

function remDup(arr){
    const skipsNew = []
    for(let i=0;i<arr.length;i++){
        if( !i || (arr[i][0][0] !== arr[i-1][0][0] && arr[i][1][0] !== arr[i-1][1][0]))
            skipsNew.push(arr[i]);
    }
    return skipsNew;
}

export async function setUser(obj){
    const settingObjs = await sendMessage('getSettings');
    for(const key in obj){
        obj[key].checked = settingObjs[key];
    }
    detectUser(obj);
    return true;
}

export function detectUser(obj){//broadcasting doesn't hurt
    for(const key in obj){
        obj[key].addEventListener("change", (e)=> changeUserSettings(e,key,obj));
    }
    return true;
}
async function changeUserSettings(e,key,obj){
    if(await sendMessage('setSettings', [ key, obj[key].checked ]))
        return await sendMessage('broadCast');
    else console.error("failed to change settings");
}

//recieve messages from backend to popUp
export function listen(){
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            sendBack(request, sender, sendResponse);
        return true;
    });

    const sendBack = (request, sender, sendResponse)=>{
        const action = request[0];
        let val;
        if(request.length>1) val = request[1];
        else val = null;
        if(action === "closePopUps" && chrome.windows){//not best check but what I could find
            sendResponse(true);
            window.close();
        }
    }

}

export async function closeAll(){
    await sendMessage('logOff'); 
    //window.close();
}



//if(chrome.windows && window && window.location.pathname!==buildPath('popUpLogin.html')){
export function addX()
{
    makeXButt();
    listen();
}

function makeXButt(){
    const xOut = document.createElement('button');
    xOut.innerText = 'X';
    xOut.className = 'leaveBut';
    document.getElementsByTagName('body')[0].appendChild(xOut);
    xOut.addEventListener('click',closeAll);
}


function getInputName(obj){
    return{
        'INPUT' : 'value',
        'LABEL' : 'textContent'
        //SPAN
    }[obj.tagName];
}


export function getText(inObj){
    //check for now just for tagname and Label, then add mroe
    const textType = getInputName(inObj);//textFieldMap[inObj.tagName];
    if(textType) return inObj[textType];
    else console.error('problem in getText no textValue for ' + inObj.tagName);
}


export function setText(inObj,text){
    const textType = getInputName(inObj);//textFieldMap[inObj.tagName];
    if(textType){
        inObj[textType] = text;
        return true;
    }
    else return false;
}

//responds if its one of the sites.
export function isTab(url){
    return !!sitesSearch((getUrlObj(url)));
}

//so only need to edit once
export function buildPath(popUpName){
    return '/htmlPopUps/' + popUpName;
}