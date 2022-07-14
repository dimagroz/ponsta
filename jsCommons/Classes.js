//start of next version
import * as Common from '/jsCommons/commonFuncs.js';
import {ShowMenu} from '/jsCommons/DropDown.js';

function newForm({link,pons,cats,rating,comment},pArr,catsArr,fromBack){
    const formObj = {
        "link" : fromBack?fromBack.link: Common.getText(link).trim(),//(link.tagName==="INPUT")?link.value:link.textContent,//def edit this.
        "pons" : pArr, //: Common.getText(pons).split(','),
        "cats" : catsArr, //: Common.getText(cats).split(','),
        "rating" : Common.getText(rating).trim(),//.tagName==="INPUT")?rating.value:rating.textContent,
        "comment" : Common.getText(comment).trim() //(comment.tagName==="INPUT")?comment.value:comment.textContent,
    };
    if(fromBack){
        formObj.seeker = fromBack.seeker;
    }
    return formObj;
}

export class FormInputs {
    constructor(form,newData=true) {
        const inArr = form.getElementsByClassName("fill");
        this.formElems = {
            "link" : inArr[0],
            "pons" :inArr[1],
            "cats" : inArr[2],
            "rating" : inArr[3],
            "comment" : inArr[4]
        }
        this.newData = newData;
        if(this.newData) this.showTits(true);

    }

    showTits(newData){
        this.ponsDD = new ShowMenu("ponsLi","chosenPons","pons",this,newData);
        this.catsDD = new ShowMenu("catsLi","chosenCats","cats",this,newData);
    }

    addFormData(data){
        this.fromBack = {};

        for(const key of Object.keys(data)){
            this.fromBack[key] = data[key];
            if(!this.newData && ["symId","pons","cats"].includes(key)) continue; //this.symId = data[key];
            else if(key === 'link'){
                this.setInput(key ,data.link.substring(0,50) + '\n' + data.link.substring(50,100) + (data.link.length>100?'...':''));
            }
            else this.setInput(key ,data[key]);
        }
        if(!this.newData) this.showTits(false); 
    }


    async addForm(){
        const placehold = this.formElems.link.placeholder; //will be undefined for edit
        //const placehold = this.placeholder;
        const elem = this.formElems;

        //sends the form provided.
        if (!Common.getText(elem.link) ){ //is it textcontent or value 
            if(!placehold) return false; //over here, start here------------------
            Common.setText(elem.link,placehold);//await Common.getUrl();
        }

        Common.setText(elem.link,Common.buildUrl(Common.getText(elem.link)));


        this.ponsDD.addfinalCats();
        this.catsDD.addfinalCats();

        let catsArr= [...this.catsDD.chosSet];
        let pArr= [...this.ponsDD.chosSet];

        if(await Common.sendMessage("newForm",newForm(elem,pArr,catsArr,this.fromBack)) ){
            return true;
        }
        else return false;
    }

    async updateForm(){

        await Common.sendMessage("removeSelForms", this.fromBack.symId);
        return this.addForm(); //[...this.ponsDD.chosSet],[...this.catsDD.chosSet]
    }

    deleteForm(){

        return this.deleteFormUsingId( this.fromBack.symId);
    }

    deleteFormUsingId(id){

        return Common.sendMessage("removeSelForms",id);
    }

   saveStates(){


        Common.addfunc(()=>{
            let inputVal = false;
            if(this.formElems.link.placeholder && Common.getText(this.formElems.link)===''){
                for(const ins in this.formElems){
                    if(!( Common.getText(this.formElems[ins]) ==='')){
                        inputVal = true;
                        continue;
                    }
                }
                if(inputVal || (this.ponsDD.hasVals||this.catsDD.hasVals))
                    Common.setText(this.formElems.link,this.formElems.link.placeholder) // = this.formElems.link.placeholder;
            }
        })

        Common.detectChange(Object.values(this.formElems),'text');
    }

    saveState(){
        Common.saveState(Object.values(this.formElems),"text");
    }

    async setState(){

       await Common.setState(Object.values(this.formElems),"text");
    }

    addFunkonDetect(key,type,funk){
        this.formElems[key].addEventListener(type,funk);
    }

    isAdded(){
        return  Common.sendMessage("isURLAdded",this.getInput('link'));
    }

    isPhAdded(){
        return Common.sendMessage("isURLAdded",this.getPlaceHolder('link'));
    }

    setPlaceHolder(place,str){//in add.js
        this.formElems[place].placeholder = str;
    }

    getPlaceHolder(place){
        const val = this.formElems[place].placeholder;
        return val;
    }
    
    getInput(place){
        return Common.getText(this.formElems[place]);
    }

    setInput(place ,str){
        if(place in this.formElems){
            const elem = this.formElems[place];
            return Common.setText(elem,str);
        }
        return true; //why this return true is here?
    }

    setFocus(place){
        const elem = this.formElems[place];
        elem.focus();
        elem.select();
        return true;
    }

    lockInputs(elemLock,lock){
        for(const elem of elemLock){
                if(lock) this.formElems[elem].disabled = true;
                else this.formElems[elem].disabled = false;
        }
    }

    clearPage(){//used in add.js
        //will do this now
        for(let inpObj of Object.values(this.formElems)){
            Common.setText(inpObj,'');//as long as this does not effect labels
        }
        this.catsDD.clearMenu();
        this.ponsDD.clearMenu();
        this.saveState();//def change this
    }

}

export class Chcks {
    constructor(id,chcks = true) {
        this.formId = document.getElementById(id);;
        this.addChcks = chcks;
        this.curDiv = document.createElement("div");
    }

    addToDiv(wholeElem){
        //if(!this.newDiv) this.newDiv =  document.createDiv();
        let chkbx = null;
        const curLi = document.createElement("li");
        if(this.addChcks){
            chkbx = document.createElement("input");
            chkbx.setAttribute("type", "checkbox");
            if(!Object.keys(wholeElem).includes('label'))
                curLi.appendChild(chkbx);
        }

        let elem;
        for(const elemType in wholeElem){
            if(elemType ==="label"){
                elem = document.createElement("label");
                if(chkbx)elem.appendChild(chkbx);
                if(wholeElem[elemType]) elem.appendChild(document.createTextNode(wholeElem[elemType]));
                else if(wholeElem.form) Chcks.addFormStr(wholeElem.form,elem);
               elem.className = "ListLabel";
            }
            else if(elemType==="button"){
                elem = document.createElement("button");
                elem.innerHTML = wholeElem[elemType][0];
                elem.addEventListener("click",wholeElem[elemType][1]);
                elem.className = "ListButton";
            }
            curLi.appendChild(elem);
        }
        this.curDiv.appendChild(curLi);
    }
    postToHtml(){
        this.formId.appendChild(this.curDiv);
        this.curDiv = document.createElement("div"); //new or no new???

        this.chkesArr = this.formId.getElementsByTagName("input");
        this.labelsArr = this.formId.getElementsByTagName("label");
    }

   ///bellow three will be based on what I need there.
    getLabels(type, poss = null){//all bellow will take either by checked,notchecked,poss
        //loop through and get labels
        const getLab = new Array();
        switch(type){// I will jsut make loops
            case "checked":
                for(let i = 0;i<this.chkesArr.length;i++){
                    if(this.chkesArr[i].checked) getLab.push(Common.getText(this.labelsArr[i])); 
                }
                break;
            case "notCheked":
                for(let i = 0;i<this.chkesArr.length;i++){
                    if(!this.chkesArr[i].checked) getLab.push(Common.getText(this.labelsArr[i]));
                }
                break;
            case "poss":
                for(const pos of poss){
                    getLab.push(Common.getText(this.labelsArr[pos]));
                }
                break;
        }
        if(getLab.length) return getLab;
        else return null;
    }

    getInputs(type,arr = null){//secArg???
        const getInp = new Array();
        switch(type){// I will jsut make loops
            case "labels":
                for(let i = 0;i<this.labelsArr.length;i++){
                    if(arr.contains(Common.getText(this.labelsArr[i]))) getInp.push(this.chkesArr[i]); 
                }
                break;
            case "poss":
                for(const pos of arr){
                    getInp.push(this.chkesArr[pos]);
                }
                break;
        }
        return getInp;
    }


    getPoss(type,labels = null){//checked,notcheceked,labels
        //loop through and get poss
        const getPos = new Array();
        switch(type){// I will jsut make loops
            case "checked":
                for(let i = 0;i<this.chkesArr.length;i++){
                    if(this.chkesArr[i].checked) getPos.push(i); 
                }
                break;
            case "notCheked":
                for(let i = 0;i<this.chkesArr.length;i++){
                    if(!this.chkesArr[i].checked) getPos.push(i);
                }
                break;
            case "labels":
                for(let i = 0;i<this.labelsArr.length;i++){
                    getPos.push(Common.getText(this.labelsArr[pos]));
                }
                break;
        }
        return getPos;
    }

    refreshElems(){ // to complicated not doing now
        //go to back end and do refresh
    }


    clearChks(bool = true){
        //loop and make all chcks false
        for(const chck of this.chkesArr){
          if(bool) chck.checked = false;
          else chck.checked = true;  
        }
    }


    hideElems(){//checeks,notchecked,poss,labels
        //hide checked elemes
        for(pos of this.getPoss("checked")){
            pos.hidden = true;
        }
    }

    isChecked(){//pos,label might be able to do with normal js

    }

    static saveStates(chkesArr){
        Common.detectChange(chkesArr,"check");
    }

    static async saveState(chkesArr){
        await Common.saveState(chkesArr,"check");
    }

    static async setState(chkesArr){
        await Common.setState(chkesArr,"check")
    }

    buttFunc(butt,nonTxt,chckdTxt){//run func on change and start
        //will remove------------------
        let buttTxt; 
        if(this.getPoss("checked").length) buttTxt = chckdTxt;
        else buttTxt = nonTxt;
        butt.innerHTML = buttTxt;
        //--------------------------------
        Common.addfunc(()=>{
            let buttTxt; 
            if(Common.getNoneChecked()) buttTxt = nonTxt;
            else buttTxt = chckdTxt;
            butt.innerHTML = buttTxt;
        },true);
    }

    static addFormStr(form,elem){

        const pRating = form.rating? form.rating + ' ': '';
        const pComment = form.comment? form.comment + ': ': '';
        let pPons = form.pons.join(', ');
        let pCats = form.cats.join(', ');
        pPons = pPons!=='None'? pPons + ' ': '';
        pCats = pCats!=='none'? pCats + ' ': '';
        
        const maxFit = 38;
        const ponSiteName = ' (' + Common.getUrlObj(form.link).siteName + ')';
        const fulltxt = pRating + pComment + pPons + pCats;
        let innerText = (fulltxt + ponSiteName).substring(0,maxFit) + ((fulltxt+ponSiteName).length>maxFit?'..':'');
        elem.appendChild(document.createTextNode(innerText));
        if(fulltxt) {
            elem.title = fulltxt + ponSiteName;
        }
        else {
            elem.title = form.link;
        }
    }
}