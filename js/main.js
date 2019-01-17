let input = document.getElementById('inp');
let button = document.getElementById('btn');
let form = document.getElementById('form');
let paginationContainer = document.getElementById('pagination');

var div = document.createElement("div");

var date = new Date();
var hours = date.getHours();
var minutes = date.getMinutes();
var year = date.getFullYear();

var dateValue = hours + ":" + minutes + " " + year;

let message = JSON.parse(localStorage.getItem("messages") || "[]");

button.onclick = function(){
  message.push({
    name: "Egor:",
    text: input.value,
    time: new Date()
  });

  render();
  localStorage.setItem('messages', JSON.stringify(message))
};

function render() {
  form.innerHTML = "";
  for(i = 0; i < message.length; i++) {
    var div = document.createElement("div");
    var user = message[i];
    div.innerHTML = user.name + user.text + new Date(user.time);
    form.appendChild(div);
  }
}

render();

var number = document.getElementById('number');
var pagNumber;
var page = "";

function paginaton() {
  if (message.length <= 5) {
    pagNumber = 1;
  } else {
    pagNumber = Math.ceil(message.length / 5);
  }
  for (var i = 0; i < pagNumber; i++) {
    page += "<a href='javascript:void(0)'" + " id=\"page" + (i + 1) + "\">" + (i + 1) + "</a>";
  }
  paginationContainer.innerHTML = page;
}

paginaton();

for (var i = 0; i < form.length; i++) {
  if (i < cnt) {
    form[i].style.display = "block";
  }
}