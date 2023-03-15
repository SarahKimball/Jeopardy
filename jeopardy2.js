class TriviaGameShow {
   constructor(element, options={}) {
      
      //Which categories we should use (or use default is nothing provided)
      this.useCategoryIds = options.useCategoryIds || [ 1892, 4483, 88, 218]; 
      
      //Database
      this.categories = [];
      this.clues = {};
      
      //State of game
      this.currentClue = null;
      this.score = 0;
      
      //Elements
      this.boardElement = element.querySelector(".board");
      this.scoreCountElement = element.querySelector(".score-count");
      this.formElement = element.querySelector("form");
      this.inputElement = element.querySelector("input[name=user-answer]");
      this.modalElement = element.querySelector(".card-modal");
      this.clueTextElement = element.querySelector(".clue-text");
      this.resultElement = element.querySelector(".result");
      this.resultTextElement = element.querySelector(".result_correct-answer-text");
      this.successTextElement = element.querySelector(".result_success");
      this.failTextElement = element.querySelector(".result_fail");
   }

   initGame() {
      //Bind event handlers
      this.boardElement.addEventListener("click", event => {
         if (event.target.dataset.clueId) {
            this.handleClueClick(event);
         }
      });
      this.formElement.addEventListener("submit", event => {
         this.handleFormSubmit(event);
      });
      
      //Render initial state of score
      this.updateScore(0);
      
      //Kick off the category fetch
      this.fetchCategories();
   }
   


   fetchCategories() {      
      //Fetch all of the data from the API
      const categories = this.useCategoryIds.map(category_id => {
         return new Promise((resolve, reject) => {
            fetch(`https://jservice.io/api/category?id=${category_id}`)
               .then(response => response.json()).then(data => {
                  resolve(data);
               });
         });
      });
      
      //Sift through the data when all categories come back
      Promise.all(categories).then(results => {
         
         //Build up our list of categories
         results.forEach((result, categoryIndex) => {
            
            //Start with a blank category
            var category = {
               title: result.title,
               clues: []
            }
            
            //Add every clue within a category to our database of clues
            var clues = shuffle(result.clues).splice(0,5).forEach((clue, index) => {
               console.log(clue)
               
               //Create unique ID for this clue
               var clueId = categoryIndex + "-" + index;
               category.clues.push(clueId);
               
               //Add clue to DB
               this.clues[clueId] = {
                  question: clue.question,
                  answer: clue.answer,
                  value: (index + 1) * 100
               };
            })
            
            //Add this category to our DB of categories
            this.categories.push(category);
         });
         
         //Render each category to the DOM
         this.categories.forEach((c) => {
            this.renderCategory(c);
         });
      });
   }

   renderCategory(category) {      
      let column = document.createElement("div");
      column.classList.add("column");
      column.innerHTML = (
         `<header>${category.title}</header>
         <ul>
         </ul>`
      ).trim();
      
      var ul = column.querySelector("ul");
      category.clues.forEach(clueId => {
         var clue = this.clues[clueId];
         ul.innerHTML += `<li><button data-clue-id=${clueId}>${clue.value}</button></li>`
      })
      
      //Add to DOM
      this.boardElement.appendChild(column);
   }

   updateScore(change) {
      this.score += change;
      this.scoreCountElement.textContent = this.score;
   }

   handleClueClick(event) {
      var clue = this.clues[event.target.dataset.clueId];

      //Mark this button as used
      event.target.classList.add("used");
      
      //Clear out the input field
      this.inputElement.value = "";
      
      //Update current clue
      this.currentClue = clue;

      //Update the text
      this.clueTextElement.textContent = this.currentClue.question;
      this.resultTextElement.textContent = this.currentClue.answer;

      //Hide the result
      this.modalElement.classList.remove("showing-result");
      
      //Show the modal
      this.modalElement.classList.add("visible");
      this.inputElement.focus();
   }

   //Handle an answer from user
   handleFormSubmit(event) {
      event.preventDefault();
      
      var isCorrect = this.cleanseAnswer(this.inputElement.value) === this.cleanseAnswer(this.currentClue.answer);
      if (isCorrect) {
         this.updateScore(this.currentClue.value);
      }
      
      //Show answer
      this.revealAnswer(isCorrect);
   }
   
   //Standardize an answer string so we can compare and accept variations
   cleanseAnswer(input="") {
      var friendlyAnswer = input.toLowerCase();
      friendlyAnswer = friendlyAnswer.replace("<i>", "");
      friendlyAnswer = friendlyAnswer.replace("</i>", "");
      friendlyAnswer = friendlyAnswer.replace(/ /g, "");
      friendlyAnswer = friendlyAnswer.replace(/"/g, "");
      friendlyAnswer = friendlyAnswer.replace(/^a /, "");
      friendlyAnswer = friendlyAnswer.replace(/^an /, "");      
      return friendlyAnswer.trim();
   }
   
   
   revealAnswer(isCorrect) {
      
      //Show the individual success/fail case
      this.successTextElement.style.display = isCorrect ? "block" : "none";
      this.failTextElement.style.display = !isCorrect ? "block" : "none";
      
      //Show the whole result container
      this.modalElement.classList.add("showing-result");
      
      //Disappear after a short bit
      setTimeout(() => {
         this.modalElement.classList.remove("visible");
      }, 1000);
   }
   
}

function restartGame() {
   // Set score back to zero
   const scoreCount = document.querySelectorAll(".score-count");
   scoreCount.forEach((score) => (score.textContent = "0"));
 
   // Remove "used" class from all buttons
   const usedButtons = document.querySelectorAll(".used");
   usedButtons.forEach((button) => button.classList.remove("used"));
 
   // Hide winner modal if visible
   const winnerModal = document.querySelector("#winner-modal");
   winnerModal.classList.remove("visible");
 }

 
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
} 

function showWinnerModal(score1, score2) {
   const winnerModal = document.getElementById('winner-modal');
   const finalScoreElement = winnerModal.querySelector('.final-score');
   const player1Score = parseInt(score1);
   const player2Score = parseInt(score2);
   
   // Determine the winner
   let winner = '';
   if (player1Score > player2Score) {
       winner = 'Player 1';
   } else if (player2Score > player1Score) {
       winner = 'Player 2';
   } else {
       winner = 'It\'s a tie!';
   }
   
   // Set the final score text and show the modal
   finalScoreElement.textContent = `Player 1: ${player1Score} - Player 2: ${player2Score}`;
   winnerModal.style.display = 'block';
   winnerModal.querySelector('h2').textContent = `Congratulations, ${winner}!`;
}


const game = new TriviaGameShow( document.querySelector(".app"), {});
game.initGame();

