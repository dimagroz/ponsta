
import * as Common from '/jsCommons/commonFuncs.js';
import {FormInputs} from '/jsCommons/Classes.js';
//import {ShowMenu} from '/DropDown.js';
Common.addX();
const newForm = document.getElementById("inputForm");
document.getElementById("addLink").addEventListener("click",add_form);
document.getElementById("clearInputs").addEventListener("click",()=>clear_page());
const thisForm = new FormInputs(newForm);
let lastUrl = '';
let locked = false;
let validUrl = true;

//document.getElementById("hideElemWhole").addEventListener('mouseover',() =>{document.getElementById("hideElem").hidden=false});
//document.getElementById("hideElemWhole").addEventListener('mouseout',() => {document.getElementById("hideElem").hidden=true});

function hideElements(elemArry){
    const hideButtons = document.getElementById('hideElem').getElementsByTagName('button');
    for(let i = 0;i<elemArry.length;i++){
        const elem = elemArry[i];
        if(elem.hidden) hideButtons[i].innerText = '+';
        else hideButtons[i].innerText = '-';
        hideButtons[i].addEventListener("click",(e)=>hideIt(e,elem));
    }
}


function hideIt(e,elem){
    elem.hidden? elem.hidden = false : elem.hidden = true;
    if(elem.hidden) e.target.innerText = '+';
    else e.target.innerText = '-';

    updateSave();
}

const hideElems= ["link","pons","cats","rating","comment"];
function updateSave(givenArr = null){

    if(givenArr){
        const elemArry = [];
        for(let i=0;i<givenArr.length;i++){
            elemArry.push(newForm.getElementsByClassName(hideElems[i])[0]);
            elemArry[i].hidden = givenArr[i];
        }
        return hideElements(elemArry);
    }

    const hideArr = [];
    for(const elem of hideElems){
        hideArr.push(newForm.getElementsByClassName(elem)[0].hidden)
    }
    Common.sendMessage('setSettings',['hideForAdd',hideArr]);
}

const linkBut = document.getElementById('setUrl');
linkBut.addEventListener("click",updateUrl)


function updateUrlLab(userEdited = false){
    const ph = thisForm.getPlaceHolder('link');
    const curUrl = Common.stripUrl(thisForm.getInput('link'));
    const lab = document.getElementById('urlDesc');

    if(ph && (!curUrl || ph===curUrl)){
        linkBut.hidden = true
        lab.innerText = "Adding for Current Tab";
        lab.hidden = false;
    }
    else if(curUrl === '' && !ph ){ 
        linkBut.hidden = true;
        lab.innerText = 'Tab Added';
        lab.hidden = false;
    }else if(locked){
        lab.innerText = 'this url has been added';
        lab.hidden = false;
    }

    else if((ph!==curUrl)){
        lab.hidden = true;
        if(!userEdited) linkBut.hidden = false;
        else linkBut.hidden = true;
    }
    else{
        lab.hidden = true;
        linkBut.hidden = true;
    }
}

function updateUrl(){
    thisForm.setInput('link','');
    updateUrlLab();
    thisForm.saveState();
}

at_start();
async function at_start(){
    updateSave( (await Common.sendMessage('getSettings')).hideForAdd );

    await thisForm.setState();
    thisForm.saveStates();
    await checkUrl(); 
    await plHolder();
    updateUrlLab();
    thisForm.addFunkonDetect("link","change",checkUrl);
    thisForm.addFunkonDetect("link","change",()=>updateUrlLab(true));
}

async function plHolder(){
    const url = await Common.getUrl(true);
    const isAdded = await Common.sendMessage("isURLAdded",url);

    if(isAdded==='y'){
        thisForm.setPlaceHolder("link",'');
    }
    else if(isAdded==='n') {
        thisForm.setPlaceHolder("link",url);
    }
    else if(!isAdded){
        validUrl = false;
    }
}

async function add_form(){
    if(!locked && validUrl && await thisForm.addForm()){
        await clear_page(true);
        Common.sendMessage("broadCast");
    }
}

async function clear_page(clearPh = false){

    if(clearPh && await thisForm.isPhAdded()==='y'){ 
        thisForm.setPlaceHolder('link','');
    }

    thisForm.clearPage();
    await checkUrl(); //why needed here?
    updateUrlLab();
}



async function checkUrl(){


    const curLink = Common.stripUrl(thisForm.getInput("link"));

    if(curLink!== lastUrl){
        locked = false;
        if(curLink){
            const isAdded =  await thisForm.isAdded();
            if(isAdded==='y') {
                locked = true; 
                updateUrlLab();
            } //why does blank return a form????
            else{
                if(!isAdded) validUrl = false;
                else validUrl = true;
            }
        }
        thisForm.lockInputs(['pons','cats','rating','comment'],locked);
        lastUrl = thisForm.getInput("link");
    }
}