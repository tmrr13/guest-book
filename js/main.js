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

  var pageSize = 10;
function render(p) {
  var page = p || 1;
  form.innerHTML = "";
  for(i = pageSize * (page - 1); i < (pageSize * page); i++) {
    var div = document.createElement("div");
    var user = message[i];
    div.innerHTML = user.name + user.text + new Date(user.time);
    form.appendChild(div);
  }
  paginaton();
}

render();

function paginaton() {
  var page = "";
  var pagNumber = Math.ceil(message.length / pageSize);

  for (var i = 0; i < pagNumber; i++) {
    page += "<a href='javascript:void(0)'" + " id=\"page" + (i + 1) + "\">" + (i + 1) + "</a>";
  }
  paginationContainer.innerHTML = page;
}

setTimeout(render, 5000, 2);
