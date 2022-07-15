import * as Common from '/jsCommons/commonFuncs.js';
//import {isTab} from '/jsCommons/ponSites.js';

const myStorage = {
    get : async (key,asArr = false,storeType = 'auto') =>{
        return doStorage(await decideStore(key,storeType,'get'),'get',key,null,asArr);
    },
    set :async (key,val,storeType = 'auto') =>{
        return doStorage(await decideStore(key,storeType,'set'),'set',key,val,null);
    },
    remove :async (key,storeType = 'auto')=>{
        if(!Array.isArray(key)) key = [key];
        return doStorage(await decideStore(key,storeType,'remove'),'remove',key,null,null);
    }
}

function doStorage(type,toDo,key,val=null,asArr = false){

    const input = makeInput(toDo,key,val);
    return new Promise(resolve => {
        chrome.storage[type][toDo](input,(result)=>{
            resolve(inner[toDo](result,asArr));
        });
    });
}

function makeInput(toDo,key,val){
    const s_key = shuffle(structuredClone(key),true); //if(key)
    const s_val = shuffle(structuredClone(val),true);//if(val)
    


    const makeFrom = {
        'get': s_key,
        'set' : {[s_key]: s_val},
        'remove': s_key
    }

    return makeFrom[toDo];
}

const inner = {
    get : (result,asArr)=>{
        let retVal;
        if(!result) console.error('in storage get-No result ',retVal);
        if(asArr){
           retVal = Object.values(result);
           retVal = retVal.filter(x => x !== undefined);
        }
        else if (Object.keys(result).length>1) retVal = result;
        else retVal = Object.values(result)[0];

        const sendback = shuffle(retVal,false);
        return sendback;
    },
    set :()=>{
        return true;
    },
    remove:()=>{
        return true;
    }
}


const syncKeys = ['userSettings','inSync','userPswd'];
const localKeys = ['inLocal','loggedOn'];
const moveKeys = ['allSyms','cats','pons'];

async function decideStore(key,storeType){
    //returns where to store 'sync' or 'local';
    if(!key || !storeType) console.error("key or StorageType is null in decideStore");
    else if(['local','sync'].includes(storeType)) return storeType;
    //not implementing remove from specific part now I know that if its in array then its removing symKeys
    else if(Array.isArray(key)) return breakUpKeys(key);
    else if(syncKeys.includes(key)) return 'sync';
    else if(localKeys.includes(key)) return 'local';
    else if(storeType === 'change' || key.substring(0,3)==='hk_' || moveKeys.includes(key)) return (await getUserSettings()).storageSetType;
    else return 'local';
}

async function getUserSettings(){
    let settingsObj = await myStorage.get('userSettings');
    if(settingsObj) return settingsObj;
    return setDefualt();
}

async function setDefualt(){
    const setKeys = {
        'hide' : false,
        'seek' : false,
        'storageSetType' : 'local',
        'closePrivate' : false,
        'hideForAdd' : new Array(5).fill(false),
        'autoPrivate' : false
    }
    
    await myStorage.set('userSettings',setKeys); //this await might not be needed.
    return setKeys;
}


async function breakUpKeys(keys){
    let checkAgainst = null; 
    for(const key of keys){
        const toStorage = await decideStore(key,'auto');
        if(!checkAgainst) checkAgainst = toStorage;
        else if( toStorage!==checkAgainst) console.error("only keys for one storageType allowed");
    }
    return checkAgainst;
}



async function switchStorage(setTo){
    const setFrom = (await getUserSettings()).storageSetType;
    if(setFrom===setTo) return true;
    //-----------------------------------
    await editStorage('userSettings','storageSetType',setTo);
    return moveUserData(setFrom,setTo);
    
}

async function checkStorage(){
    const setType = await getUserSettings().storageSetType;
    let inLocal = await myStorage.get('inLocal');
    let inSync = await  myStorage.get('inSync');

    if(setType === 'sync' && inLocal) //undifined works as well
        return await moveUserData('local','sync');
    //I dont think I need this function bellow-i guess somewhere somehow
    if(setType === 'local' && inSync)
        return await moveUserData('sync','local');

    if(inLocal === undefined) myStorage.set('inLocal',false);
    if(inSync === undefined) myStorage.set('inSync',false);
    return true;

}

async function moveUserData(fromType,ToType){
    

    const allForms = await getForms(await myStorage.get('allSyms',false,fromType),fromType);
    
    
    for(const form of allForms)
        await addNewForm(form);
    
    let otherSyms = await myStorage.get('allSyms',false,fromType);
    if(!otherSyms) otherSyms = [];
    await myStorage.remove([...moveKeys,...otherSyms],fromType);
    if(ToType === 'sync'){
        await myStorage.set('inSync', true);
        await myStorage.set('inLocal',false);
    }
    else if(ToType==='lcoal'){
        await myStorage.set('inLocal',true);
        await myStorage.set('inSync',false);
    }
    return true; //later check to make sure all are true.
}

function shuffle(thisThing,sc=true){
    if(typeof(thisThing) === "object"){
        if(Array.isArray(thisThing)){
            for(let i = 0;i<thisThing.length;i++){
                thisThing[i] = shuffle(thisThing[i],sc);
            }
        }
        else if(thisThing === null){//make if(!thisThing)
            return thisThing;
        }
        else{
            for(const key in thisThing){
                const newKey = shuffle(key,sc);
                thisThing[newKey] = shuffle(thisThing[key],sc);
                if(newKey!==key) delete thisThing[key];
            }
        }
            
    }
    else if ((typeof(thisThing) === 'string')){
        return scramble(thisThing,sc);
    }
    return thisThing;

    function scramble(string,sc){
        const key = [5,18,7,15,15,2,10];//[3,9,5,1,7];
        let scrambledStr = '';
        for(let i= 0;i<string.length;i++){
            let ccode = sc? string.charCodeAt(i)+key[i%(key.length)]:string.charCodeAt(i)-key[i%(key.length)];
            if(string.charCodeAt(i)<=126 && ccode>126) ccode = ccode-95;
            else if(ccode<32) ccode = ccode+95;
            scrambledStr += String.fromCharCode(ccode);
        }
        return scrambledStr;
    }
}

function addUpStr(str){
//uses basic checksum
    if(!str) return 0;
    let hashVal = 0;
    for(let i=0;i< str.length; i++){
        let charVal = str.charCodeAt(i);
        //if(i%2) hashVal = hashVal + 2*charVal;
        hashVal = hashVal + charVal- 65;
    }
    return hashVal.toString();
}

function getHash(url){
    const urlObj =  Common.getUrlObj(url);
    

    const siteName = urlObj.siteName;
    const siteSearch = urlObj.siteSearch;
    let letMatch = siteSearch.match(/[a-zA-Z]/g);
    if(letMatch) letMatch = letMatch.join('');

    let intMatch = siteSearch.match(/[0-9]/g);
    if(intMatch) intMatch = intMatch.join(''); //makes string from array


    const allLets = siteName + letMatch;

    const finalHash = 'hk_' + addUpStr(allLets) + hashCode(intMatch);
    
    return finalHash;
}
//this function bellow taken from 
//https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
function hashCode(str) {
    if(!str) return 0;
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        //hash |= 0; // Convert to 32bit integer
        hash = hash & hash;
    }
    
    return Math.abs(hash).toString();
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    //sender should say from where.
    sendBack(request, sender, sendResponse);
    return true;
});   

async function sendBack(request, sender, sendResponse){
    const action = request[0];
    let val;
    if(request.length>1) val = request[1];
    else val = null;
    //let response = false;
    let form;
    sendResponse( await {
        'saveVal':()=> myStorage.set(val[0],val[1]),
        'getVal':()=> myStorage.get(val),
        'getUrl':()=>  sender.url,
        'getForm':()=> myStorage.get(val),
        'newForm':()=> addNewForm(val),
        'getAllCats':()=> getAllCats(val),
        'getAllUsedForms': async ()=> getForms(getFormIds(await getCatsDic("pons"),true)),
        'getAllForms':async ()=> getForms(await myStorage.get('allSyms')),
        'saveSelCats':()=> myStorage.set('selectedCats',val),
        'saveSelPons':()=> myStorage.set('selectedPons',val),
        'getSelForms': async ()=> getUnion(await myStorage.get('selectedCats'), await getAllCats("cats",true), await myStorage.get('selectedPons'), await getAllCats("pons",true)),
        'removeSelForms':()=> removeForms2(val),
        "clearAll":()=> clearStorage(),
        "getState":()=> getState(getName(sender)),
        "saveState":()=> saveState(getName(sender),val),
        "getLastSaved":()=> getLastSaved(),
        "toEdit":()=> myStorage.set("toEdit",val),
        "getFormbyURL":()=> myStorage.get(getHash(val)),
        "getToEdit": async () =>{
            const toEdit = await myStorage.get("toEdit");
            return [await myStorage.get(toEdit[0]),toEdit[1]];
        },
        "isURLAdded": async ()=>{
            const symId = getHash(val);
            if(!symId) return false;
            form = await myStorage.get(symId);
            if(form) return 'y'; // && "symId" in form also in edit storage
            else return 'n';
        },
        "getContent":()=> myStorage.get(getHash(sender.url)), // saying get my form also only for content script
        "saveElem":()=>{
            if(val[0]==="url") val[0] = getHash(sender.url);
            return editStorage(val[0],val[1],val[2]);
        },
        "popUpToContent":()=> sendToContentScripts(val.hashId,val.message),
        "broadCast":()=> {
            sendToContentScripts({"type" : "refresh"})
        },
        "hide":()=> hideForm(val[0],val[1]),
        "setStorage":()=> switchStorage(val),
        'setSettings':()=> editStorage('userSettings',val[0],val[1]),
        'getSettings':()=> getUserSettings(),
        'popUpOpened':()=> onOpen(getName(sender)),
        "inPrivate":()=> isIncognito(),
        "isPswd": async ()=> !!await myStorage.get('userPswd'),
        "remPswd" : async ()=> await myStorage.set('userPswd',null) && await myStorage.set('loggedOn',true),
        "setPswd":()=> myStorage.set('userPswd',hashCode(val)),
        "logOff": async ()=>{
            const userSet = await getUserSettings();
            if(userSet.closePrivate) killAllIncognitoTabs();
            return logOff();
        },
        "logInAttempt":()=> logUserIn(hashCode(val)),
        "printAll":()=> checkAllStorage(),
        "testSync":()=> testSync(),
    }[action]()); 
}


async function logOff(){
    let response;
    if(await myStorage.get('userPswd'))
        response = await myStorage.set('loggedOn',false);
    if(response){
        setPopup('popUpLogin.html');
        //chrome.browserAction.setPopup({popup: '/htmlPopUps/popUpLogin.html'});
    }
    Common.sendMessage("closePopUps");
    return response;
}

//----------------------------------------------------
//Incognito Killer mayr.sascha

function killAllIncognitoTabs(){
    chrome.tabs.query({}, (tabs) => {
      const incognitoTabs = tabs.filter(tab => tab.incognito).map(tab => tab.id);
      if (incognitoTabs.length > 0) {
        chrome.tabs.remove(incognitoTabs);
      }
    });
    return true;
}

  
chrome.idle.onStateChanged.addListener( async (idleState) => {
    if (idleState === 'locked' && await myStorage.get('loggedOn')) {
        logOff();
        if ((await getUserSettings()).closePrivate) killAllIncognitoTabs();
    }
  });

//--------------------------------------------------

chrome.windows.onRemoved.addListener(function(windowid) {
    chrome.tabs.query({}, (tabs) => {
        const incognitoTabs = tabs.filter(tab => tab.incognito).map(tab => tab.id);
        if (!incognitoTabs.length) logOff();
   });
});



async function onOpen(poUpName){
    if(!await checkLogin(poUpName)){
        return false;
    }
    return checkStorage();
    //you can add more here.
}

function isIncognito(){
    return new Promise( (resolve,reject) => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            var currTab = tabs[0];
            if (currTab) // Sanity check
                resolve(currTab.incognito);
            else resolve(false);
      });
    });
}

async function checkLogin(popUpName){
    if(!await myStorage.get('loggedOn') ){
        if(!await myStorage.get('userPswd') ) myStorage.set('loggedOn',true);
        else{
            setPopup('popUpLogin.html');
            return false;
        }
    }
    setPopup(popUpName);
    return true;
}

function setPopup(popUpName){
    chrome.action.setPopup({popup: '/htmlPopUps/' + popUpName}); //change mv3
    //chrome.browserAction.setPopup({popup: '/htmlPopUps/' + popUpName});
}


async function logUserIn(hashPass){
    if(hashPass === await myStorage.get('userPswd')){
        return myStorage.set('loggedOn',true);
    }
    else return false;
}



async function testSync(){
    await myStorage.remove('syncKey');
    await chrome.storage.sync.remove('syncKey')

    await chrome.storage.sync.set({'syncKey': 'hi its me from sync'});
    return myStorage.get('syncKey');
}


async function editStorage(keys,innerKey,val){
    let added = true;
    if(!Array.isArray(keys)) keys = [keys];

    for(const key of keys){
        let form = await myStorage.get(key);
        if(form){//&& "symId" in form also in switch
            form[innerKey] = val;
            if( !await myStorage.set(key,form) ) added = false;
        }
        else added = false
    }
    return added;
}

async function checkAllStorage(allempty = false){
    console.log("-------------Local Storage-------------------------")
    let pons = await myStorage.get('pons',false,'local');
    console.log("pons",pons);
    let cats = await myStorage.get('cats',false,'local');
    console.log("cats",cats);
    let allSyms = await myStorage.get('allSyms',false,'local');
    console.log("allSyms",allSyms);
    if(allSyms){
        let allForms  = await myStorage.get(allSyms,true,'local');
        console.log("allForms",allForms);
    }
    let userSet = await myStorage.get('userSettings',false,'local');
    console.log("userSettings",userSet);

    //--------------------------------------------------------------------

    console.log("-------------Sync Storage-------------------------")
    pons = await myStorage.get('pons',false,'sync');
    console.log("pons",pons);
    cats = await myStorage.get('cats',false,'sync');
    console.log("cats",cats);
    allSyms = await myStorage.get('allSyms',false,'sync');
    console.log("allSyms",allSyms);
    if(allSyms){
        allForms  = await myStorage.get(allSyms,true,'sync');
        console.log("allForms",allForms);
    }
    userSet = await myStorage.get('userSettings',false,'sync');
    console.log("userSettings",userSet);


    if(allempty){
        console.log("currenty checking if all storage is empty");
        let notEmpty = false
        if(pons && Object.keys(pons).length) notEmpty = true;
        if(cats && Object.keys(cats).length) notEmpty = true;
        if(allSyms && allSyms.length) notEmpty = true;
        if(allForms && allForms.length>1 && allForms[0]!==undefined) notEmpty = true;
        if(notEmpty) console.error("Storage was not cleared completely");
        else console.log("all storage is empty");
    }
    return true;

}

function getName(sender){
    let str = sender.url;
    return str.substring(str.lastIndexOf('/') + 1);
}

async function hideForm(sym,hide){
    const form = await myStorage.get(sym);
    if(hide && !form.hideForm){
        await remCats([form]);
        await editStorage(sym,"hideForm",true);
    }
    else if(!hide && form.hideForm){
        await addCats(form)
        await editStorage(sym,"hideForm",false);
    }
    else return false;
    return true;
}


async function addNewForm(newForm){// here set up multiple storarges.
    let url = newForm.link;
    const sym = getHash(url);//Math.random().toString(); for debugging purposes//change this
    if(!sym) return false;

    let allSyms = await myStorage.get("allSyms");

    if(!allSyms) allSyms = [];
    else if(allSyms.includes(sym)) return false;

    if(!newForm.hasOwnProperty('hideForm')) newForm.hideForm = false;

    newForm.symId = sym;
    allSyms.push(sym);
    await myStorage.set(sym,newForm);


    myStorage.set("allSyms",allSyms);
    if(!newForm.hideForm) return await addCats(newForm);
    return true;
}

async function addCats(form){
    for(const type of ["cats","pons"]){ //no const here before--------
        let list =  await myStorage.get(type);
        let newTypeDic = addToCats(list,form[type],form.symId);
        await myStorage.set(type,newTypeDic);
    }
    return true;
}

async function remCats(formsToRemove){//there was a bug here
    
    if(!Array.isArray(formsToRemove)) formsToRemove= [formsToRemove];
    for(const type of ["cats","pons"]){ //no const here before 2nd 1--------
        const catsdic = await myStorage.get(type);
        for(const form of formsToRemove){//--- 3rd no const
            if(form.hideForm) continue;
            
            for(const cat of form[type]){//4th no const
                removeVal(catsdic[cat],form.symId)
                if(!catsdic[cat].length) delete catsdic[cat];
            }
        }
        myStorage.set(type, catsdic);
    }
}

function addToCats(allCatsdic,newCatsArr,sym){
    if (allCatsdic === undefined){
        allCatsdic = {};//why cant I put it here
    }
    
    for(const cat of newCatsArr){
        if (allCatsdic[cat] === undefined){
            allCatsdic[cat] = [];
        }
        allCatsdic[cat].push(sym);
    }
    return allCatsdic;
}

async function getAllCats(val,ids = false){
    let result = await myStorage.get(val);
    if(result === undefined) return [];
    else if(ids) return result;
    else{
        let twoDArr = [];
        for(const cat in result){//maybe in future way to sort as push;
            if(cat.toLowerCase()==='none') twoDArr.push([cat,-1]);
            else twoDArr.push([cat,result[cat].length]);
        }
        twoDArr = twoDArr.sort( (a,b) => b[1] - a[1]);
        const retArr = [];
        for(const arr of twoDArr){
            retArr.push(arr[0]);
        }
        return retArr;
    }
}

async function getCatsDic(val){
        
    let cats = await myStorage.get(val);
    if(cats === undefined) return {};
    else return cats;
}

async function getForms(ids,StoreType = 'auto'){ //this returns all forms
    
    if(!ids || ids.length<1) return [];
    const result = await myStorage.get(ids,true,StoreType);
    //const allFormsArr =  Object.values(result).sort( (a,b) => b.rating - a.rating);
    const allFormsArr =  result.sort( (a,b) => b.rating - a.rating);
    const nonHidForms = [];
    const hidForms = [];
    for(const form of allFormsArr)
        form.hideForm? hidForms.push(form):nonHidForms.push(form);
    return [...nonHidForms,...hidForms];
}

function getFormIds(catsDic, all = false, selectedCats = null){
    let symArr = [];
    //let formsArr = [];
    for(const cat in catsDic){ // looking for key
        let catSymArr = [];
        for(const sym of catsDic[cat]){// dif between of and in
            if( all || selectedCats.includes(cat) )
            if(!symArr.includes(sym)){
                catSymArr.push(sym)
            }
        }
        symArr.push(...catSymArr); 
    }
    return symArr;
}


async function removeForms2(symKeys){
    
    if(!Array.isArray(symKeys)) symKeys = [symKeys];
    //curently set to all forms = empty array;
    let allforms = false;
    if(symKeys.length<1){
        symKeys = await myStorage.get("allSyms");
        allforms = true;
    }

    const formsToRemove = await myStorage.get(symKeys,true);//asArr true
    //''
    await remCats(formsToRemove);
    await myStorage.remove(symKeys); //this was problem, need to edit this one; /----------------I added await here
    const allSyms = new Set(await myStorage.get("allSyms"));
    
    if(!Array.isArray(symKeys)) symKeys = [symKeys];
    for(const symKey of symKeys) allSyms.delete(symKey);
    myStorage.set("allSyms",[...allSyms]);
    //}
    if(allforms){
        checkAllStorage(true);
    }
    return true;
}

function clearStorage(){//this is only one I keep in the old ages
    setPopup('popUpMain.html');
    return new Promise(async resolve => {
       await chrome.storage.local.clear(function() {
            let StorErr = chrome.runtime.lastError;
            if (StorErr) {
                console.error(StorErr);
                resolve(false);
            }
        });
        await chrome.storage.sync.clear(function() {
            let StorErr = chrome.runtime.lastError;
            if (StorErr) {
                console.error(StorErr);
                resolve(false);
            }
        });
        //maybe later have combined string check both for errors
        resolve("removed all storage");
    });
    //return "removed all storage";
}

async function saveState(popUpName,inputArr){
    return await myStorage.set(popUpName,inputArr);
}

async function getState(popUpName){//,otherPage
    if(popUpName === "popUpMain.html"){
        let toRemove = ["popUpChoose.html","popUpRemove.html"];
        await myStorage.remove(toRemove);
    }

    setPopup(popUpName);

    const result = await myStorage.get(popUpName);
    if(!result) return [];
    else return result;
}

async function getLastSaved() //might not be used anymore
{
    const result = await myStorage.get("lastSaved");
    if(!result) return "popUpMain.html";
    else return result;
}

async function getUnion(selCats,myCats,selPons,myPons){
    if(selCats==='all' && selPons==='all'){  //
        let allForms = await getForms(getFormIds(await getCatsDic("cats"),true));
        return([{"cat":"All Links", "forms": allForms}]);
    }

    if(!selPons) selPons = [];
    if(!selCats) selCats = [];

    const selType = [...selPons,...selCats];
    const myType = {...myPons,...myCats};
    const idSet  = {};
    for(const cat in myType){
        if(selType.includes(cat) || !selType.length){   //for now map !selCats || 
            for(const sym of myType[cat]){
                if(idSet[sym]=== undefined )
                    idSet[sym] = new Array();
                idSet[sym].push(cat);
            }
        }
    }
    
    let conStr; //= "";
    let concatSet = {};
    for(let id in idSet){
        conStr = idSet[id];//.toString();
        if(concatSet[conStr] === undefined)
            concatSet[conStr] = new Array();
        concatSet[conStr].push(id);
    }

    for(let cat in concatSet){
        concatSet[cat] = await myStorage.get(concatSet[cat],true);//chromee.storage.local.get(concatSet[cat]);
    }

    //convert all to obj in array and return
    let finArr = [];
    let catOrdd = Object.keys(concatSet).sort((a,b) =>b.length-a.length);
    for(let cat of catOrdd){
        finArr.push({
            "cat": cat,
            "forms":  concatSet[cat].sort( (a,b) => b.rating - a.rating) //concatSet[cat]
        });
    }

    return finArr;
}

function removeVal(arr,val){ //removeVal = 
    if(arr.indexOf(val)===-1) console. error('element not in array to remove');
    arr.splice((arr.indexOf(val)),1);
}

function sendToContentScripts(message){
    return new Promise(resolve => {
        chrome.tabs.query({}, function(tabs){
            tabs.forEach(tb => {
                //console.log(tb);
                if(Common.isTab(tb.url)){
                    chrome.tabs.sendMessage(tb.id, message);
                }
                //if(chrome.runtime.lastError) resolve(false);
                resolve(true);
            });
        });
    });
}
