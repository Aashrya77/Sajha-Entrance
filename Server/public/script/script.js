// const navbar = document.getElementById("navbar");

// // OnScroll event handler
// const onScroll = () => {
//   // Get scroll value
//   const scroll = document.documentElement.scrollTop;

//   // If scroll value is more than 0 - add class
//   if (scroll > 0) {
//     navbar.classList.add("navbar-scroll");
//   } else {
//     navbar.classList.remove("navbar-scroll");
//   }
// };

// Use the function
// window.addEventListener("scroll", onScroll);

const cursor = document.querySelector(".cursor");

document.addEventListener("mousemove", (e) => {
  cursor.setAttribute(
    "style",
    "top: " + (e.pageY - 10) + "px; left: " + (e.pageX - 10) + "px;"
  );
});

document.addEventListener("click", () => {
  cursor.classList.add("expand");

  setTimeout(() => {
    cursor.classList.remove("expand");
  }, 500);
});