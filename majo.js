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

function getFromLocalStorage(key) {
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
}

function loadFromLocalStorage() {
  let theme = getFromLocalStorage("majo-theme");
  if (theme === "light") {
    darkModeInput.checked = false;
  }
  document.documentElement.setAttribute("data-theme", theme);

  savedCorrectAnswer = getFromLocalStorage("correct-answer");

  correctAnswer = savedCorrectAnswer ?? correctAnswer;
  let usedWords = getFromLocalStorage("attemptedWords");
  if (usedWords ?? false) {
    attemptedWords = JSON.parse(usedWords);
    if (attemptedWords.length === 6) {
      reset();
      startNewGame();
    }
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
    setTimeout(() => element.classList.add("flip"), (index * 500) / 2);
    element.addEventListener(
      "transitionend",
      (e) => {
        if (e.propertyName === "transform") {
          element.classList.remove("flip");
          element.classList.add(COLOR[stats[index]]);
        }
      },
      { once: true }
    );
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
  let stats = getStatistics(currentWordString, correctAnswer);
  attemptedWords.push(currentWordString.toUpperCase());
  setLocalStorage("attemptedWords", JSON.stringify(attemptedWords));

  updateRowWithStats(stats, currentAttempt);
  updateKeyBoardWithStats(stats, currentWord);
  currentWord = [];
  currentAttempt = currentAttempt + 1;
  checkWinLose(currentWordString);
}

function checkWinLose(guess) {
  if (guess === correctAnswer) {
    alertWinLose(MESSAGES.WIN_MESSAGE + correctAnswer, 2000, true);
  } else if (currentAttempt > 5) {
    stopInputing();
    alertWinLose(MESSAGES.LOSE_MESSAGE + correctAnswer, 2000, false);
  }
}

function alertWinLose(message, duration = 2000, hasWon) {
  setTimeout(() => {
    let alertBox = AlertModal(message, hasWon);
    document.body.appendChild(alertBox);
    reset();
    startNewGame();
  }, duration);
}

function handleKeyPress(e) {
  let keyCode = e.keyCode;
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
  currentAttempt = attemptedWords.length;
  currentWord = [];
  startInputing();
}

function AlertModal(message, hasWon) {
  let modalFragment = document.createDocumentFragment();
  let overlayElement = document.createElement("div");
  overlayElement.classList.add("modal_overlay");
  let containerElement = document.createElement("div");
  containerElement.classList.add("modal_container");
  let headingElement = document.createElement("h3");
  headingElement.classList.add("modal_heading");
  headingElement.innerText = hasWon ? "You Won !!" : "You Lost";
  let messageElement = document.createElement("p");
  messageElement.classList.add("modal_message");
  messageElement.innerText = message;
  let buttonElement = document.createElement("button");
  buttonElement.classList.add("modal_button");
  buttonElement.innerText = MESSAGES.NEW_GAME;
  containerElement.appendChild(headingElement);
  containerElement.appendChild(messageElement);
  containerElement.appendChild(buttonElement);

  modalFragment.appendChild(overlayElement);
  modalFragment.appendChild(containerElement);

  buttonElement.addEventListener("click", () => {
    document.body.removeChild(overlayElement);
    document.body.removeChild(containerElement);
  });

  return modalFragment;
}

loadFromLocalStorage();
startNewGame();
