
const calendar = document.getElementById('calendar');
const now = new Date();
const nowMonth = now.getMonth();
const nowYear = now.getFullYear();
const daysWeek = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

function daysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate();
}

function outputDaysWeek() {
  return daysWeek
    .map(function (dayName) {
      return "<span class='weekday'>" + dayName + "</span>";
    })
    .join('');
}

function outputDays() {
  const quantityDays = daysInMonth(nowMonth, nowYear);
  const firstWeekday = new Date(nowYear, nowMonth, 1).getDay();
  let dayCells = '';

  for (let i = 0; i < firstWeekday; i++) {
    dayCells += "<span class='day day--empty'></span>";
  }

  for (let i = 1; i <= quantityDays; i++) {
    dayCells += "<span class='day'>" + i + "</span>";
  }

  return dayCells;
}

calendar.innerHTML =
  "<div class='days-week'>" + outputDaysWeek() + "</div>" +
  "<div class='days-grid'>" + outputDays() + "</div>";



// console.log(daysWeek[new Date().getDay()]);



















/*
function getWeekDay(date, month) {
  return new Date(date, month, 0).getDate();
}
let quantityDaysWeek = daysInMonth(nowMonth,daysWeek);

*/
// getWeekDay(date)















// const myForm = document.getElementById("myForm");
//
// let paginationBox = document.getElementById("pagination");
// let fieldTextUser = document.getElementById("text-user");
// let contentPage = document.getElementById("content-page");
//
// let userName = "egor";
//
// let message = JSON.parse(localStorage.getItem("messages") || "[]");
// let pageSize = 10;
//
// function messageOutput(e) {
//   e.preventDefault();
//   message.push({
//     name: userName,
//     text: fieldTextUser.value
//   });
//
//   render();
//   localStorage.setItem('messages', JSON.stringify(message));
// }
//
// let pageNumber;
//
// function render(p) {
//
//   pageNumber = p || Math.ceil(message.length / pageSize);
//   contentPage.innerHTML = "";
//   let total = message.length > pageSize * pageNumber ? pageSize * pageNumber : message.length;
//   for (var i = pageSize * (pageNumber - 1); i < total; i++) {
//     let user = message[i];
//     let userName = "<span class='user-name'>" + user.name + "</span>";
//     let userText = "<span class='user-text'>" + user.text + "</span>";
//     let row = "<div class='row'>" + userName + userText + "</div>";
//     contentPage.innerHTML += row;
//   }
//   pagination()
// }
//
// function pagination() {
//   let page = "";
//   let totalPage = Math.ceil(message.length / pageSize);
//
//   if (totalPage > 1) {
//     if (pageNumber > 1) {
//       page += "<a href='javascript:void(0)' onclick='render(" + (pageNumber - 1) + ")'\>prev</a>";
//     }
//     for (let i = 0; i < totalPage; i++) {
//       page += "<a href='javascript:void(0)' onclick='render(" + (i + 1) + ")'\>" + (i + 1) + "</a>";
//     }
//     if (pageNumber < totalPage) {
//       page += "<a href='javascript:void(0)' onclick='render(" + (pageNumber + 1) + ")'\> next </a>";
//     }
//     paginationBox.innerHTML = page;
//   }
// }
//
// // function moveToPage() {
// //   pageNumber ++;
// //   render(pageNumber);
// // })
// //
// // btnNext.addEventListener('click', moveToPage() {
// //
// // })
// //
// // btnBack.addEventListener('click', function() {
// //   pageNumber --;
// //   render(pageNumber)
// // });
//
// myForm.onsubmit = messageOutput;
// render();
//
// // pagination();
