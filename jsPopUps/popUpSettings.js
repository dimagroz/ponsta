import * as Common from '/jsCommons/commonFuncs.js';
Common.addX();

document.getElementById("but1").addEventListener("click",dload);
document.getElementById("ulfile").addEventListener("change",upLd);
document.getElementById("but3").addEventListener("click", testSync); //openTabs

const passBut = document.getElementById("pass");
const passEdBut = document.getElementById("passEdit");

const passDiv = document.getElementById("pswdInputs");
const passInputs = passDiv.getElementsByTagName("input");
const addPswdBut = passDiv.getElementsByTagName("button")[0];


passBut.addEventListener("click", passClick);
passEdBut.addEventListener("click", changePswdClick);
addPswdBut.addEventListener("click", addPswd);


const syncSwitch = document.getElementById("locSync");
syncSwitch.addEventListener("change",locSyncSwitch);
const pswdResponse = document.getElementById("pswdLabel");


atStart();
async function atStart(){
    Common.sendMessage('getState');
    await Common.setUser({'closePrivate': document.getElementById("closePrivate"),'autoPrivate' : document.getElementById("openPrivate")});
    syncSwitch.checked = (await Common.sendMessage('getSettings')).storageSetType === 'sync';
    await setPswd();
    
}




let isPswd;
let pswdState;
async function setPswd(){
    isPswd = await Common.sendMessage('isPswd');
    pswdState = isPswd? 'remove' : 'add';
    passBut.innerText = isPswd? 'remove Password' : 'Add Password';
    if(isPswd) passEdBut.hidden = false;
    return true;
}


passInputs[0].addEventListener("keypress", (e)=>{if(e.key === 'Enter') passInputs[1].focus()});
passInputs[1].addEventListener("keypress", (e)=>{if(e.key === 'Enter') addPswd()});

async function addPswd(){
    if(!Common.getText(passInputs[0]) || !Common.getText(passInputs[1])) pswdResponse.innerText = "fill both inputs with the same password";
    else if(Common.getText(passInputs[0]) === Common.getText(passInputs[1])){
        if(await Common.sendMessage("setPswd",Common.getText(passInputs[0]))){
            hidePswdInputs(true);
            //pswdResponse.innerText = "Pasword Added";
            passBut.innerText = "Remove Password";
            pswdState = "remove";
            passEdBut.innerText = "Change Password"
            changePswState = "change";
            passEdBut.hidden = false;
        }
        else pswdResponse.innerText = "Failed to Add Password";
    }
    else pswdResponse.innerText = "Passwords don't match";
}



function passClick(e){
    ({
        'add': ()=> {
            hidePswdInputs(false,e.target,'cancel');
            pswdState = 'remove';

        },
        'remove': async ()=> {
            if(await Common.sendMessage('remPswd')){
                hidePswdInputs(true,e.target,'add Password');
                pswdState = 'add';
                passEdBut.hidden = true;
            }
        },
        'cancel': ()=>{
            hidePswdInputs(true,e.target,'add Password');
            pswdState = 'add';
        },
    })[pswdState]();
}

let changePswState = 'change';
function changePswdClick(e){
    ({
        'change' : ()=> {
            hidePswdInputs(false,e.target,'cancel');
            changePswState = 'cancel'
        },
        'cancel': () => {
            hidePswdInputs(true,e.target,'change Password');
            changePswState = 'change';
        },
    })[changePswState]();
}

function hidePswdInputs(hide,butt,text){

    passDiv.hidden = hide;
    if(hide){
        Common.setText(pswdResponse,null);
        for(const inp of passInputs) Common.setText(inp,null);
    }
    if(butt && text) butt.innerText = text;
}






async function locSyncSwitch(e){
    e.target.disabled = true;
    const str = e.target.checked? 'sync':'local';
    let retVal;
    if(await Common.sendMessage('setStorage',str))
        retVal = true
    else{
        e.target.checked = !e.target.checked
        retVal = false;
    }
    e.target.disabled = false;
    return retVal;
}

async function testSync(){
    const message = await Common.sendMessage("printAll");
    console.log('sync test- ',message);
    pswdResponse.innerText = message;
}

async function dload(){
    let allforms = await Common.sendMessage('getAllForms');
    let formStr = "---v1_t5s9a1e6xm---\n\n";

    const fileCats = {
        'link' : (url)=> 'url: ' + Common.stripUrl(url) + '\n',
        'pons' : (pons)=>{
            if(pons.length===1 && pons[0]==='None') return '';
            else return 'names: ' + pons.join(', ') + '\n';
        },
        'cats' : (cats)=>{
            if(cats.length===1 && cats[0]==='none') return '';
            else return 'cats: ' + cats.join(', ') + '\n';
        },
        'rating' : (rating)=>{
            if(rating) return 'rating: ' + rating + '\n';
            else return '';
        },
        'comment' : (com)=>{
            if(com) return 'descript: ' + com + '\n';
            else return '';
        },
        'seeker' : (skip)=>{
            let skipStr = '';
            if(skip && skip.length>0){
                for(let i =0;i<skip.length;i++){
                    skipStr+= skip[i][0][0] + '-' + skip[i][1][0];
                    if(i<skip.length-1) skipStr+=',';
                }
                return 'skips: ' + skipStr + '\n';
            }
            else return '';        //"skips",
        },
        'hideForm' : (hid)=>{
            if(hid) return 'hidden: yes\n';
            else return '';
        }  //"hidden"
    }

    for(let form of allforms){
        for(let key in form){
            const catag = fileCats[key]; 
            if(catag){
                formStr += catag(form[key]);
            }
        }
        formStr += '-----------------------------\n';
    }
    let blob = new Blob([formStr], {type: "text/plain"});
    const finalUrl = URL.createObjectURL(blob);
    chrome.downloads.download({
    url: finalUrl, // The object URL can be used as download URL
    filename: "ponsta_file.txt" // Optional
    //...
    });
}


async function upLd(e){
    const upldLabel = document.getElementById('upldLabel');
    if(e.target.files[0].size>.25e9){//check if size is less then .2 gigabites
        upldLabel.innerText = "File size too large";
    }
    const xxxArry = (await e.target.files[0].text()).split('\n'); //split on new line
    if(!xxxArry[0].includes('v1_t5s9a1e6xm')) return 'incorrect fileCode';
    let newForm = {};
    const formCatags = {
        'url' :(url)=> newForm.link = Common.buildUrl(url),
        'names' : (namesStr)=>{
            const namesArr = Common.strToArr(namesStr);
            if(namesArr.length<1) namesArr.push('None');
            newForm.pons = namesArr;
        },
        'cats' : (catsStr)=>{
            const catsArr = Common.strToArr(catsStr);
            if(catsArr.length<1) catsArr.push('none');
            newForm.cats = catsArr;
        },
        'rating' : (vidRating)=> newForm.rating = vidRating,
        'descript' : (com)=> newForm.comment = com,
        'skips' :  (vidSkips)=>{
            const skipsArr = vidSkips.split(',');
            let retArr = [];
            for(let elem of skipsArr){
                elem = elem.split('-');
                elem[0] = Number(elem[0].trim());
                elem[1] = Number(elem[1].trim());
                retArr = Common.insertNew(retArr,[[elem[0],Common.strTime(elem[0].toFixed(0))],[elem[1],Common.strTime(elem[1].toFixed(0))]]);
            }
            newForm.seeker = retArr;
        },
        'hidden' : (hid)=> newForm.hideForm = hid==='yes'? true:false//'hideForm'
    }

    let rejLinks = 'rejected links';
    let linksRej = false;
    for(let line of xxxArry){
        line = line.trim();
        if(!line) continue;
        else if(line.substring(0,5) === '-----'){
            await addForm();
        }
        else if(line.indexOf(':')!== -1){
            const catType = formCatags[line.substring(0,line.indexOf(':')).trim()];
            if(catType){
                catType(line.substring(line.indexOf(':')+1).trim());
            }
        }
    }
    addForm();
    Common.sendMessage('broadCast');
    //console.log(linksRej? rejLinks:'All links added');
    upldLabel.innerText = linksRej? rejLinks:'All links added';


    async function addForm(){
        if(newForm.link){
            for(const type of ['rating','comment']){
                if(!newForm[type]) newForm[type] = '';
            }
            for(const type of [['pons','None'],['cats','none']]){
                if(!newForm[type[0]]) newForm[type[0]] = [type[1]];
            }
            if(!await Common.sendMessage('newForm',newForm)){
                rejLinks += '\n' + newForm.link;
                linksRej = true;
            }
        }
        newForm = {};
    }
    
}
