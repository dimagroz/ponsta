import * as Common from '/jsCommons/commonFuncs.js';
import {FormInputs} from '/jsCommons/Classes.js';
//import {ShowMenu} from '/DropDown.js';
Common.addX();
let thisForm;
const form = document.getElementById('inputForm2');
document.getElementById("editForm").addEventListener("click",()=> formFunc(true));
document.getElementById("deleteForm").addEventListener("click", ()=> formFunc(false));
document.getElementById("backToLinks").addEventListener("click", ()=> window.location.href = backLink);

let backLink;
let formData;
getForm();
async function getForm(){ //def change this
    let response = await Common.sendMessage("getToEdit");
    formData = response[0];
    backLink = Common.buildPath(response[1]);
    thisForm = new FormInputs(form,false);
    thisForm.addFormData(formData);
}

async function formFunc(edit){
    if(edit) {
        await thisForm.updateForm();
    }
    else await thisForm.deleteForm();
    window.location.href = backLink;
}
