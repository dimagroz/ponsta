
import * as Common from '/jsCommons/commonFuncs.js';
import { Chcks } from '/jsCommons/Classes.js';
Common.addX();
let butt; //dont know If I need to keep it in this scope
let allForms;
let chcksForm;

atStart();
async function atStart(){
    butt = document.getElementById("remChecked");
    butt.addEventListener("click",onClickRemove);
    fillRemoveForms(true);

}

async function fillRemoveForms(sState = false){

    allForms = await Common.sendMessage("getAllForms")//getAllForms();
    chcksForm = new Chcks("checksDiv");
    createChklst(); //if (allForms) 
    if(sState) await Chcks.setState(chcksForm.chkesArr);
    //make this one save state the other one common
    Chcks.saveStates(chcksForm.chkesArr);
    if(allForms && allForms.length>0){
        butt.hidden=false;
    }
    else butt.hidden=true;
    return true;
}


async function onClickRemove(){
    const checkedFormIds = getChked();
    if(!checkedFormIds.length) return false;
    if(await Common.sendMessage("removeSelForms",checkedFormIds)){ //sendRemove(checkedFormIds
        await refreshHtml();
    }
    Chcks.saveState(chcksForm.chkesArr);
}

function createChklst(){
    //creates html button with text that will be cleared using css
    document.getElementById("checksDiv").innerHTML = null;
        for(const dic of allForms){
            const hideButt = (e) => doOnClick(e,dic);
            chcksForm.addToDiv({"label": null, "form" : dic,
                "button": [butText(dic.hideForm),hideButt]});
    }
    chcksForm.postToHtml();
}

function butText(hidden){
    if(hidden) return "show";
    else return "hide"
}

async function doOnClick(e,dic){
    let form = await Common.sendMessage("getForm",dic.symId);
    if(form.hideForm){ 
        await Common.sendMessage("hide",[form.symId,false]);
        e.target.innerText = "hide"
    }
    else{
        await Common.sendMessage("hide",[form.symId,true]);
        e.target.innerText = "show";
    }
    
}


function getChked(){
    const symIds = []; //this might be done through chcks class function
    const allchekes = chcksForm.chkesArr;
    for(let i = 0;i<allchekes.length; i++){
        if(allchekes[i].checked){
            symIds.push(allForms[i].symId);
        }
    }
    return symIds;
}
async function refreshHtml(){
    return await fillRemoveForms(); //do I need await here?
}


//------------------------------------------------------------------------------
//Clear All Storage gets its own thing so it never breaks
document.getElementById("clearStorage").addEventListener("click", clearAll);
function clearAll(){
  
    chrome.runtime.sendMessage(["clearAll",""], function(result){
        refreshHtml();
        document.getElementById("delete").innerText = "result: " + result;
    });
  }
