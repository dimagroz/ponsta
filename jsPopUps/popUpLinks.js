import * as Common from '/jsCommons/commonFuncs.js';
import { Chcks } from '/jsCommons/Classes.js';
Common.addX();
const showForm = document.getElementById('clickTexts');
links();
async function links(){
    const selForms = await Common.sendMessage("getSelForms");
    createClickables(selForms);
    initClickables(selForms);
    Common.sendMessage("getState");
}

function createClickables(selForms)
{
    //creates html button with text that will be cleared using css
   
    showForm.setAttribute("id",'clickForm');
    
    for(const obj of selForms) //gives me the catagories
    {
        const catsStr = obj.cat.toString();
        showForm.appendChild(document.createTextNode(catsStr));
        for(const dic of obj.forms){
            const discript = document.createElement("button");
            discript.className = "descript";

            Chcks.addFormStr(dic,discript);
            const editBut = document.createElement("button");
            editBut.innerHTML = "ed";
            editBut.className = "ListButton";

            const newDiv = document.createElement("div");
            newDiv.appendChild(discript);
            newDiv.appendChild(editBut);

            showForm.appendChild(newDiv);
        }
    }
   
    //showForm.appendChild(catsForm);
   // return showForm;
}

function initClickables(selForms){
    const formsArr = new Array();
    for(const obj of selForms){
        for(const dic of obj.forms){
            formsArr.push(dic);
        }
    }

    const butts = showForm.getElementsByTagName("button");

    for(let i =0; i<butts.length; i+=2){
        butts[i].addEventListener('click',getlink(formsArr[i/2].link));// why false????, 
        butts[i+1].addEventListener('click',getId(formsArr[i/2].symId));//false is usless
    }
}

function getlink(linkStr){
    return () => opentab(linkStr); //check if this works as well
}

function getId(symId){
    return async () =>{
        if(await Common.sendMessage("toEdit",[symId,"popuplinks.html"])) //then go to next page
            window.location.href = Common.buildPath('popUpEdit.html');
    }
}

async function opentab(tabStr){
    //const inPrivate = await Common.sendMessage("inPrivate");
    //const autoPrivate = (await Common.sendMessage("getSettings")).autoPrivate;
    if(await Common.sendMessage("inPrivate") || !(await Common.sendMessage("getSettings")).autoPrivate){
        chrome.tabs.create({ 'url': tabStr});
    }
    else{
        chrome.windows.create({ 'url': tabStr,"incognito": true });
    } 
    window.close();
}




