
import * as Common from '/jsCommons/commonFuncs.js';
//import {isTab} from '/jsCommons/ponSites.js';
Common.addX();
let form;
let url;
//will edit this to work with Chcks class
let myChecks = document.getElementById("myChecks").getElementsByTagName("input");
document.getElementById("allForms").addEventListener('click', goToAll);
document.getElementById("privateWin").addEventListener('click', PrivateWin);


atStart();
async function atStart(){
  Common.sendMessage('getState');
  if(!await Common.sendMessage('popUpOpened')) window.close();//window.location.href = 'popUpLogin.html';

  await Common.setUser({'hide': myChecks[0],'seek':myChecks[1]});
  Common.addfunc(() => Common.sendMessage("broadCast"));
  //debugger
  
  myChecks[0].addEventListener("change",checkHide);
  myChecks[1].addEventListener("change",seekerToggle);
  seekerToggle();
  checkHide();
}

async function goToAll(){
  await Common.sendMessage("saveSelCats",'all');
  await Common.sendMessage("saveSelPons",'all');
  window.location.href = Common.buildPath('popUpLinks.html');
}


function PrivateWin(){
    chrome.windows.create({ 'url': "chrome://startpageshared/","incognito": true });
    window.close();
}

const hideOn = document.getElementById('hideLabel');

async function checkHide(){
  if(myChecks[0].checked && Common.isTab(url))
    hideOn.hidden = !(await toContent({'type':'isHiding'}));
  else hideOn.hidden =true;
}


doIEdit();
async function doIEdit(){
  url = await Common.getUrl();
  form = await Common.sendMessage("getFormbyURL",url);
  if(form){
    const elem = document.getElementById("editElem");
    const editButt = document.createElement("button");
    editButt.innerText = "Edit for Page";
    if(form.hideForm) editButt.hidden = true;

    const archvButt = document.createElement("button");
    if(form.hideForm) archvButt.innerText = "(hidden) show";
    else archvButt.innerText = "hide";
    
    editButt.className="MainButs";
    archvButt.className = "MainButs";
    const label = document.createElement("label");

    let pPons = form.pons.join(', ');
    let pCats = form.cats.join(', ');

    
    pPons = pPons!=='None'? pPons +'\n': '';
    pCats = pCats!=='none'? pCats +'\n': '';
    let pRating = form.rating? form.rating + '/10\n':'';
    label.innerText = pRating + pPons + pCats + form.comment + '\n\n';

    elem.appendChild(label);
    elem.appendChild(editButt);
    elem.appendChild(archvButt);
      
    editButt.addEventListener("click", toEditPage);
    archvButt.addEventListener("click", () => doOnClick(editButt,archvButt));
    elem.hidden = false;
  }
}

async function toEditPage(e){
  await Common.sendMessage("toEdit",[form.symId,"popUpMain.html"]);
  window.location.href = Common.buildPath('popUpEdit.html');
}

async function doOnClick(editButt,archvButt){
    form = await Common.sendMessage("getForm",form.symId);
    if(form.hideForm){ 
        await Common.sendMessage("hide",[form.symId,false]);
        editButt.hidden=false;
        archvButt.innerText = "hide";
    }
    else{
        await Common.sendMessage("hide",[form.symId,true]);
        editButt.hidden=true;
        archvButt.innerText = "(hidden) show"
    }
}


async function seekerToggle(){
  let seekDiv = document.getElementById("seekable");
  seekDiv.hidden = true;
  document.getElementById("seekSkip").innerHTML = null;
  if(myChecks[1].checked && Common.isTab(url)){
    let seekTimes = await toContent({"type":"getSeeks"});
    if(seekTimes){
      seekDiv.hidden = false;
      setSeek(seekTimes);
    }
  }
}

function showTime(inter){
  
  let catStr; 
  if(inter.length === 1) catStr = '[' + inter[0][1] + "-__]";
  else catStr = '[' + inter[0][1]+'-'+ inter[1][1] + ']';

  const butt = document.createElement("button");
  butt.innerText = catStr;
  document.getElementById("seekSkip").appendChild(butt);
  //appended button up to this point
  butt.addEventListener("click", ()=> remTime(butt,inter)); //passes e
}

function remTime(butt,inter){
  butt.parentNode.removeChild(butt);
  saveSeek(inter);
}

function saveSeek(arrayVal){
  toContent({"type":"editSeek","content": ["remove", arrayVal] });
}

async function setSeek(arr){ //adds times

  if(arr){
      for(const inter of arr){
          showTime(inter);
      }
  }
}


function toContent(val) { //might need promise
  return new Promise((resolve,reject) => {chrome.tabs.query({currentWindow: true, active: true},(tabs)=>{
    let activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, val,(response) => {
      if(chrome.runtime.lastError) resolve(false);
      else resolve(response);
    })
    });
  });
}
