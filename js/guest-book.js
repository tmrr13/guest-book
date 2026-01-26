
const daysWeek = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function outputDays(quantityDays) {
  let day = '';
  for (let i = 1; i <= quantityDays; i += 1) {
    day += "<span class='day'>" + i + '</span>';
  }
  return day;
}

function outputDaysWeek() {
  return daysWeek.map((day) => "<span class='day'>" + day + '</span>').join('');
}

function renderCalendar() {
  const calendar = document.getElementById('calendar');
  if (!calendar) {
    return;
  }

  const now = new Date();
  const nowMonth = now.getMonth() + 1;
  const nowYear = now.getFullYear();
  const quantityDays = daysInMonth(nowMonth, nowYear);

  const daysWeekContainer = calendar.querySelector('.days-week');
  if (daysWeekContainer) {
    daysWeekContainer.innerHTML = outputDaysWeek();
  }

  calendar.insertAdjacentHTML('beforeend', outputDays(quantityDays));

  const nowDate = document.getElementById('now-date');
  if (nowDate) {
    nowDate.textContent = String(now.getDate());
  }

  const month = document.getElementById('month');
  if (month) {
    month.textContent = now.toLocaleString('en-US', { month: 'long' });
  }
}

function hasPlayableVideoSource(videoEl) {
  if (!videoEl || typeof videoEl.play !== 'function') {
    return false;
  }

  if (typeof videoEl.readyState === 'number' && videoEl.readyState >= 1) {
    return true;
  }

  if (videoEl.getAttribute('src')) {
    return true;
  }

  const sources = Array.from(videoEl.querySelectorAll('source'));
  if (!sources.length) {
    return false;
  }

  return sources.some((source) => {
    const src = source.getAttribute('src');
    if (!src) {
      return false;
    }

    const type = source.getAttribute('type');
    if (!type) {
      return true;
    }

    if (typeof videoEl.canPlayType !== 'function') {
      return true;
    }

    return videoEl.canPlayType(type) !== '';
  });
}

function safePlayVideo(videoEl) {
  if (!hasPlayableVideoSource(videoEl)) {
    return;
  }

  const playPromise = videoEl.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch((error) => {
      if (error && error.name === 'NotSupportedError') {
        return;
      }

      console.warn('Video playback failed.', error);
    });
  }
}

function playVideo(videoEl, shouldPlay) {
  if (!videoEl || typeof videoEl.pause !== 'function') {
    return;
  }

  if (shouldPlay) {
    safePlayVideo(videoEl);
    return;
  }

  videoEl.pause();
}

function initHoverVideos(root = document) {
  const hoverVideos = root.querySelectorAll(
    'video[data-hover-video], video[data-hover-play], .hover-video'
  );
  if (!hoverVideos.length) {
    return;
  }

  hoverVideos.forEach((videoEl) => {
    if (videoEl.tagName && videoEl.tagName.toLowerCase() !== 'video') {
      return;
    }

    videoEl.addEventListener('mouseenter', () => playVideo(videoEl, true));
    videoEl.addEventListener('mouseleave', () => playVideo(videoEl, false));
  });
}

function peopleCarouselInit(root = document) {
  const carousels = root.querySelectorAll('[data-people-carousel], .people-carousel');
  if (!carousels.length) {
    return;
  }

  carousels.forEach((carousel) => {
    const items = carousel.querySelectorAll('[data-people-card], .people-card');
    if (!items.length) {
      return;
    }

    let activeIndex = 0;
    const nextButton = carousel.querySelector('[data-carousel-next], .carousel-next');
    const prevButton = carousel.querySelector('[data-carousel-prev], .carousel-prev');

    const update = () => {
      items.forEach((item, index) => {
        const isActive = index === activeIndex;
        item.hidden = !isActive;
        item.setAttribute('aria-hidden', String(!isActive));
      });
    };

    update();

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        activeIndex = (activeIndex + 1) % items.length;
        update();
      });
    }

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        activeIndex = (activeIndex - 1 + items.length) % items.length;
        update();
      });
    }
  });
}

function onReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

onReady(() => {
  renderCalendar();
  initHoverVideos();
  peopleCarouselInit();
});



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
