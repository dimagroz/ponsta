import * as Common from '/jsCommons/commonFuncs.js';

const pswdResLabel = document.getElementById("pswdResponse");
const pswdInput = document.getElementById("pswdInput");
document.getElementById("passSubmit").addEventListener('click', logInPswd)
document.getElementById('pswdInput').addEventListener("keypress", (e)=>{if(e.key === 'Enter') logInPswd();});


atStart();
async function atStart(){
  if( !await Common.sendMessage('getVal','userPswd') || 
    await Common.sendMessage('getVal','loggedOn') ) 
    window.location.href = Common.buildPath('popUpMain.html'); //'popUpMain.html'
}

async function logInPswd(){
  if(await Common.sendMessage('logInAttempt',Common.getText(pswdInput))){
    Common.sendMessage("broadCast");
    window.location.href = Common.buildPath('popUpMain.html');
  } 
  else pswdResLabel.hidden = false;
}