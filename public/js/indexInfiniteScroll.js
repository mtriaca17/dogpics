const postBox = document.querySelector('#post-box');
// const baseUrl = 'http://localhost:5005/api/posts';
const baseUrl = '/api/posts';
let page = 2;
const size = 6;

async function getData() {
  try {
    const res = await fetch(`${baseUrl}?page=${page}&size=${size}`);
    const data = await res.json();
    if (data.data.length < 1) return;
    appendToPage(data);
    page++;
  } catch (e) {
    console.log(e);
  }
}

function appendToPage(data) {
  data.data.forEach(post => {
    console.log(post);
    const markup = `<div class="box has-text-centered index-box">
    <a href="/posts/${post._id}">
      <h4 class="title">${post.title}</h4>
      <figure class="image">
        <img src="${post.image}" alt="" />
      </figure>
    </a>
    <a href="/posts/${post._id} class="card-footer-item">View Full Post!</a>
  </div>`;
    const newPost = document.createElement('div');
    newPost.classList.add('column', 'block', 'is-one-third');
    newPost.innerHTML = markup;
    console.log(newPost);
    postBox.append(newPost);
  });
}

window.addEventListener('scroll', e => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
    getData();
  }
});
