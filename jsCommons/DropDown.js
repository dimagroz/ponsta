import * as Common from '/jsCommons/commonFuncs.js';


export class ShowMenu {

    constructor(divId,chosenId,type,form,newData = true) {
        this.elem = document.getElementById(divId);
        this.chosElem = document.getElementById(chosenId);
        this.type = type;
        this.form = form;
        this.newData = newData;
        this.declareAllVars();
        this.showCats();
        this.entireElem = document.getElementsByClassName(type)[0];

        this.curInput = {
            get: ()=> form.getInput(type),
            set: (val)=> form.setInput(type,val),
            getElem: ()=> form.formElems[type], //was [place], but was not used
            focus: ()=>form.setFocus(type)
        }
    }

    refresh(){
        this.showCats();
    }

    declareAllVars(){
        this.myCats;
        this.cats;
        this.chosSet = new Set();
    }

    clearMenu(){
        this.chosSet.clear();
        if(this.newData) this.saveCats(false);
        this.chosElem.innerHTML = null;
        this.elem.innerHTML = null;
        this.refresh();
    }

    async showCats(){
        this.myCats = await Common.sendMessage("getAllCats",this.type);
        if(this.myCats.length>0 && this.myCats[this.myCats.length-1].toLowerCase()==='none')
            this.myCats.pop();
        for(let cat of this.myCats){
            if(!cat) continue;
            const entry = document.createElement('li')
            const butt = document.createElement("button");
            butt.innerHTML = cat;
            entry.appendChild(butt);
            this.elem.appendChild(entry);
        }
        this.cats = this.elem.getElementsByTagName("button");
        this.detectChanges(await this.setCats());  //await setCats()
        //onChange();
    }

    detectChanges(selArr = null){
        for(const cat of this.cats){
            
            cat.addEventListener("click",()=>this.addCat(cat,true));
            cat.addEventListener("click",(e)=>this.autoChoose(e,this.cats,this.chosSet));
            //butt.addEventListener("click",()=> remCat(butt,cat)); //will be overlooped
            if(selArr){
                if(selArr.includes(cat.innerHTML)) cat.hidden = true;
            }
        }
        this.entireElem.addEventListener('mouseover',() => this.hoverDetect(true));
        this.entireElem.addEventListener('mouseout',() => this.hoverDetect(false));
        window.addEventListener("keyup",()=> this.focusDetect());
        window.addEventListener("click",()=> this.focusDetect());//"mouseup"
        this.form.addFunkonDetect(this.type,"keydown",(e)=> this.onDown(e,this.curInput.getElem()));
        this.form.addFunkonDetect(this.type,"keyup",(e)=>this.autoChoose(e,this.cats,this.chosSet));
    }

    addCat(cat,used = false,userAdded = true){
        //debugger
        if(!cat) return;
        let catStr;
        if(typeof cat === 'string') catStr = cat;
        else catStr = cat.innerHTML;
            
        if(!this.chosSet.has(catStr)){
            this.chosSet.add(catStr);
            const butt = document.createElement("button");
            butt.innerHTML = ', ' + catStr;
            this.chosElem.appendChild(butt);
    
            if(!used){
                for(const dCat of this.cats){
                    if(dCat.innerHTML === catStr){
                        used = true;
                        cat = dCat;
                        break;
                    }
                }
            }
    
            if(used){
                cat.hidden = true;
                butt.addEventListener("click", ()=> this.remCat(butt,cat));
            }
            else butt.addEventListener("click", ()=> this.remCat(butt)); //passes e
    
            if(userAdded){
                if(this.curInput.get()) this.curInput.set('');
                this.curInput.focus();
                if(this.newData) this.saveCats();
            }
        }
        
    }
    
    remCat(butt, cat=null){
        if(cat) cat.hidden = false;
        this.chosSet.delete(butt.innerHTML.slice(2));
        butt.parentNode.removeChild(butt);
        this.curInput.focus();
        if(this.newData) this.saveCats(false);
        
    }
    
    focusDetect(){
        const curElem = document.getElementsByClassName(this.type)[0];
        if (curElem.contains(document.activeElement)){
            this.elem.hidden = false;
        }
        else this.elem.hidden=true;
    }

    hoverDetect(isOver){
        this.isOver = isOver;
        if(isOver) this.focusDetect();
        else if(!this.curInput.get()) this.elem.hidden = true;
    }

    onDown(e,input){ //or after pressing enter
        if(e.key === 'Enter' || e.key === ','){ //e should be inputbox
            e.preventDefault();
            if(Common.getText(input)){ //if not blank do below

                for(const inp of Common.getText(input).split(',')){
                    if(inp.trim() && inp.toLowerCase()!=='none') this.addCat(inp.trim(),false,false); //add as side text  //add to side text,if not in set
                }
                Common.setText(input,''); //
                if(this.newData) this.saveCats();
            }
        }
    }

    addfinalCats(){
        const input = this.curInput.getElem();

        //better for debugging perposes
        if(Common.getText(input)){ //if not blank do below
            for(const inp of Common.getText(input).split(',')){
                if(inp.trim() && inp.toLowerCase()!=='none') this.chosSet.add(inp.trim());
            }
        }
        if(!this.chosSet.size){
            if(this.type === 'pons') this.chosSet.add('None');
            else if(this.type === 'cats') this.chosSet.add('none');
        } 
    }
    autoChoose(e,cats,chosSet){
        //not going to worry about bold right now
        if(!this.isOver && !this.curInput.get()) this.elem.hidden = true;

        const input = this.curInput.get().toLowerCase();
        for(const cat of cats){
            if(!chosSet.has(cat.innerHTML)){
                if(cat.innerHTML.toLowerCase().includes(input)) // || !input
                    cat.hidden = false;
                else cat.hidden=true;
            }
        }
    }
    
    saveCats(saveState = true){

        //everytime text added, save state
        this.hasVals = !!this.chosSet.size;
        if(saveState) this.form.saveState();
        Common.sendMessage("saveVal",[ this.type + "Save", [...this.chosSet] ]);
    }
    
    async setCats(){
        let arr;
        if(this.newData) arr = await Common.sendMessage("getVal", this.type + "Save");
        else arr = this.form.fromBack[this.type]; //takes the array given by class
        
        if(arr){
            for(const cat of arr){
                if(cat.toLowerCase()!=="none")
                    this.addCat(cat,false,false);
            }
        }
        return arr;
    }
}