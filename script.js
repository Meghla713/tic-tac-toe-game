let boxs=document.querySelectorAll(".box");
let reset=document.querySelector("#resetGame")
let newGameBtn=document.querySelector("#new-btn");
let msgContainer=document.querySelector
  (".msg-container");
let msg=document.querySelector("#msg");

let turnO=true; //plyerx, plyerY

const winParttan=[
  [0,1,2],
  [0,3,6],
  [0,4,8],
  [1,4,7],
  [2,5,8],
  [2,4,6],
  [3,4,5],
  [6,7,8],
  
  ];

const resetGame=() => {
  turnO=true;
  enableBoxes();
  msgContainer.classList.add("hide");

};


boxs.forEach((box) =>{
  box.addEventListener("click",() =>{
   
    //plyer0
    if(turnO){
    box.innerText ="O";
    turnO=false;
    box.style.color="green";
    }else{
   
    //plyerX
    box.innerText="X";
    turnO=true;
     box.style.color="red"; 
    }
    box.disabled=true;

    checkWinner();
    });
    });


//when game is recommences so button will enable for start that.

const enableBoxes=() => {
  for(let box of boxs){
    box.disabled=false;
    box.innerText="";
    }
};


// when game is over than button will disable.

const disableBoxes=() => {
  for(let box of boxs){
    box.disabled=true;
    }
};



//that's code  show winner then desable boxes

const showWinner = (winner) =>{
 msg.innerText= `🥳Congratutation,Winner is  ${winner}🎉`;
  msgContainer.classList.remove("hide");
  disableBoxes();
};


//winner check and show 

const checkWinner = () => {
for(let parttan of winParttan) {
  

  let pos1Val=boxs[parttan[0]].innerText;
  let pos2Val=boxs[parttan[1]].innerText;
  let pos3Val=boxs[parttan[2]].innerText;

  if(pos1Val!=""&& pos2Val!=""&& pos3Val!=""){
    
  if(pos1Val===pos2Val && pos2Val=== pos3Val){
    
    showWinner(pos1Val);
     }
    }
  }
  
    
};

newGameBtn.addEventListener("click",resetGame);

reset.addEventListener("click",resetGame);





