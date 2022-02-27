let rows = [...document.querySelectorAll(".game_container .row")];
let keyboardKeys = [...document.querySelectorAll(".keyboard-key")];
let keyMaps = new Map();
let size,
  answerIndex,
  correctAnswer,
  hasGuessed,
  currentAttempt,
  currentWord,
  savedCorrectAnswer,
  attemptedWords = [];

//Help Modal Feature
let helpButton = document.querySelector(".navbar .helpButton");
let helpModalButton = document.querySelector(".instruction_container svg");
let helpModal = document.querySelector(".instruction_container");

//Settings Modal Feature
let settingsButton = document.querySelector(".navbar .settingsButton");
let settingsModalButton = document.querySelector(".settings_container svg");
let settingsModal = document.querySelector(".settings_container");

//Dark mode Settings
let darkModeInput = document.querySelector(
  ".settings_container input[name='isDarkMode']"
);
darkModeInput.addEventListener("click", toggleTheme);

function toggleHelp() {
  helpModal.classList.toggle("slideIn");
}

function toggleSettings() {
  settingsModal.classList.toggle("slideIn");
}

function toggleTheme(e) {
  if (e.target.checked) {
    document.documentElement.setAttribute("data-theme", "dark");
    setLocalStorage("majo-theme", "dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    setLocalStorage("majo-theme", "light");
  }
}

function setLocalStorage(key, value) {
  localStorage.setItem(key, value);
}

function getLocalStorage(key) {
  return localStorage.getItem(key);
}

function updateKeysAndBoardFromCache(attemptedWords) {
  let stats;
  currentAttempt = 0;
  attemptedWords.forEach((word, index) => {
    stats = getStatistics(word, correctAnswer ?? savedCorrectAnswer);
    updateRowWithStats(stats, index);
    updateKeyBoardWithStats(stats, word);
    updateRow(word, index);
  });
  currentAttempt = attemptedWords.length;
  console.log(currentAttempt);
}
function loadFromLocalStorage() {
  let theme = getLocalStorage("majo-theme");
  if (theme === "light") {
    darkModeInput.checked = false;
  }
  document.documentElement.setAttribute("data-theme", theme);

  savedCorrectAnswer = getLocalStorage("correct-answer");

  correctAnswer = savedCorrectAnswer ?? correctAnswer;
  let usedWords = getLocalStorage("attemptedWords");
  if (usedWords ?? false) {
    attemptedWords = JSON.parse(usedWords);
    updateKeysAndBoardFromCache(attemptedWords);
  }
}

helpButton.addEventListener("click", toggleHelp);
helpModalButton.addEventListener("click", toggleHelp);

settingsButton.addEventListener("click", toggleSettings);
settingsModalButton.addEventListener("click", toggleSettings);

function startInputing() {
  document.addEventListener("keydown", handleKeyPress);

  keyboardKeys.forEach((key) => key.addEventListener("click", handleKeyClick));
}

function stopInputing() {
  document.removeEventListener("keydown", handleKeyPress);

  keyboardKeys.forEach((key) =>
    key.removeEventListener("click", handleKeyClick)
  );
}

function checkCorrectPosition(element, ans, guess, index) {
  let foundIndex = ans.indexOf(element);
  return (
    (element === ans[foundIndex] && index === foundIndex) ||
    ans.lastIndexOf(element) == index
  );
}

function getStatistics(guess, ans) {
  let arr = Array(5).fill(STATUS.NOT_YET_FOUND);
  ans.split("").forEach((char, index) => {
    if (guess[index] == char) {
      arr[index] = STATUS.CORRECT_POSITION;
    } else {
      for (let i = 0; i < 5; i++) {
        if (arr[i] == STATUS.NOT_YET_FOUND) {
          if (char == guess[i]) {
            arr[i] = STATUS.WRONG_POSITION;
            break;
          }
        }
      }
    }
  });
  arr.forEach((ele, index) => {
    if (ele == STATUS.NOT_YET_FOUND) {
      arr[index] = STATUS.NOT_IN_THE_WORD;
    }
  });
  return arr;
}

function updateRowWithStats(stats, rowIndex) {
  let columns = rows[rowIndex].querySelectorAll(".input_column");
  columns.forEach((element, index) => {
    element.classList.add(COLOR[stats[index]]);
  });
}

function updateKeyBoardWithStats(stats, currentWord) {
  stats.forEach((stat, index) => {
    let currentKeyStatus = keyMaps.get(currentWord[index]);
    if (
      currentKeyStatus == STATUS.CORRECT_POSITION ||
      (currentKeyStatus == STATUS.WRONG_POSITION &&
        stat == STATUS.NOT_IN_THE_WORD)
    )
      return;
    keyMaps.set(currentWord[index], stat);
  });
  updateKeyBoardColor();
}

function updateKeyBoardColor() {
  keyMaps.forEach((v, k) => {
    let element = document.querySelector("[data-key='" + k + "']");
    if (COLOR[v]) {
      // console.log(k, v, element);
      element.classList.add(COLOR[v]);
    }
  });
}

function updateRow(currentWord, rowIndex) {
  let columns = rows[rowIndex].querySelectorAll(".input_column");
  columns.forEach((element, index) => {
    if (currentWord[index]) {
      element.innerHTML = currentWord[index];
    } else {
      element.innerHTML = "";
    }
  });
}

function isValidWord(currentWordString) {
  return dictionary.indexOf(currentWordString.toLowerCase()) === -1
    ? false
    : true;
}

function vibrateWords() {
  let columns = rows[currentAttempt].querySelectorAll(".input_column");
  columns.forEach((el) => {
    el.classList.add("shake");
    setTimeout(() => {
      el.classList.remove("shake");
    }, 200);
  });
}

function handleEnterKeyPress() {
  let currentWordString = currentWord.join("").toUpperCase();
  if (currentWord.length != 5) {
    vibrateWords();
    return;
  }
  if (!isValidWord(currentWordString)) {
    vibrateWords();
    return;
  }
  let stats;
  if (currentWordString === correctAnswer) {
    hasGuessed = true;
    stopInputing();
    stats = Array(5).fill(STATUS.CORRECT_POSITION);
  } else {
    stats = getStatistics(currentWordString, correctAnswer);
    attemptedWords.push(currentWordString.toUpperCase());
  }

  setLocalStorage("attemptedWords", JSON.stringify(attemptedWords));
  updateRowWithStats(stats, currentAttempt);
  updateKeyBoardWithStats(stats, currentWord);
  currentWord = [];
  currentAttempt = currentAttempt + 1;
  if (hasGuessed || (!hasGuessed && currentAttempt > 5)) {
    if (hasGuessed) {
      alert(
        "You got it : " + correctAnswer + "\nStarting a new game right away :)"
      );
    } else {
      stopInputing();
      alert(
        "You've exhausted your attempts. The word was : " +
          correctAnswer +
          "\nStarting a new game right away :)"
      );
    }
    reset();
    startNewGame();
  }
}

function handleKeyPress(e) {
  if (hasGuessed) {
    console.log("Winner");
    return;
  }
  if (currentAttempt > 5) {
    console.log("GameOver");
    return;
  }
  let keyCode = e.keyCode;
  // if (keyCode == 13 || keyCode == 8 || (keyCode >= 65 && keyCode <= 90)) {
  //   console.log(keyCode);
  // }
  if (keyCode >= 65 && keyCode <= 90) {
    if (currentWord.length < 5)
      currentWord.push(String.fromCharCode(keyCode).toUpperCase());
    updateRow(currentWord, currentAttempt);
  }

  if (keyCode == 8) {
    currentWord.pop();
    updateRow(currentWord, currentAttempt);
  }

  if (keyCode == 13) {
    handleEnterKeyPress();
  }

  //65-90 is alphabtets
  //32 is space
  //8 is backspace
  //13 is enter
}

function handleKeyClick(e) {
  let keyCode;
  let textValue = e.target.textContent;
  if (textValue === "ENTER") {
    keyCode = 13;
  } else if (textValue === "CLEAR") {
    keyCode = 8;
  } else {
    keyCode = textValue.charCodeAt(0);
  }
  let pseudoEvent = { keyCode };
  handleKeyPress(pseudoEvent);
}

function reset() {
  for (let i = 65; i <= 90; i++) {
    keyMaps.set(String.fromCharCode(i), STATUS.NOT_YET_FOUND);
  }

  rows.forEach((row) => {
    let columns = [...row.children];
    columns.forEach((column) => {
      column.innerHTML = "";
      column.classList.remove(...["correct", "incorrect", "wrong-position"]);
    });
  });

  keyboardKeys.forEach((key) => {
    key.classList.remove(...["correct", "incorrect", "wrong-position"]);
  });

  localStorage.removeItem("correct-answer");
  localStorage.removeItem("attemptedWords");
  savedCorrectAnswer = null;
  attemptedWords = [];
}

function startNewGame() {
  for (let i = 65; i <= 90; i++) {
    keyMaps.set(String.fromCharCode(i), STATUS.NOT_YET_FOUND);
  }
  size = dictionary.length;
  answerIndex = Math.round(Math.random() * size);
  correctAnswer = savedCorrectAnswer ?? dictionary[answerIndex];
  correctAnswer = correctAnswer.toUpperCase();
  if (correctAnswer !== savedCorrectAnswer) {
    localStorage.setItem("correct-answer", correctAnswer.toUpperCase());
    savedCorrectAnswer = correctAnswer;
  }

  console.log(correctAnswer);
  hasGuessed = false;
  currentAttempt = attemptedWords.length;
  currentWord = [];
  startInputing();
}

loadFromLocalStorage();
startNewGame();
