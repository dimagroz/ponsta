
import * as Common from '/jsCommons/commonFuncs.js';
import {Chcks} from '/jsCommons/Classes.js';
Common.addX();
let allCats
let allPons;

let catsForm;
let ponsForm;
const butt = document.getElementById("pickCats");
choose();
async function choose(){
    allCats = await Common.sendMessage("getAllCats","cats");
    allPons = await Common.sendMessage("getAllCats","pons");

    if(!allCats.lenth&& !allPons.length){
        butt.hidden = true;
    }


    catsForm = new Chcks('showAllCats'); //this is id of form createChecklst();
    ponsForm = new Chcks('showAllPons');

    createChecklst(catsForm,allCats);
    createChecklst(ponsForm,allPons);

    let setStateArr = [...catsForm.chkesArr,...ponsForm.chkesArr];
    await Chcks.setState(setStateArr);
    await Chcks.saveStates(setStateArr);


    catsForm.buttFunc(butt,"show all","show checked");
    ponsForm.buttFunc(butt,"show all","show checked");

    butt.addEventListener("click",sendClick);

}

async function sendClick(){
    if(await Common.sendMessage("saveSelCats",catsForm.getLabels("checked"))
    && await Common.sendMessage("saveSelPons",ponsForm.getLabels("checked")))//
        Common.saveState(null);
        window.location.href = Common.buildPath('popUpLinks.html');
}

function createChecklst(curForm,allType){
        for(const str of allType){
            curForm.addToDiv({"label":str});
        }
    curForm.postToHtml();
}
