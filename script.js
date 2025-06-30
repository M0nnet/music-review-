import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const API_KEY = "ed6ec23ae7bb84b65fab1f7bf168e979";

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCnVoyXHd-3NQ4VcvjXdjncoyaTnqDjHVA",
  authDomain: "music-reviews-2fe39.firebaseapp.com",
  projectId: "music-reviews-2fe39",
  storageBucket: "music-reviews-2fe39.firebasestorage.app",
  messagingSenderId: "524571811015",
  appId: "1:524571811015:web:501fe3d7b447dc58abb2e2",
  measurementId: "G-MHKTNCJV3R"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Элементы DOM
const mainContent = document.getElementById("main-content");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const registerBtn = document.getElementById("register-btn");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const switchToLogin = document.getElementById("switch-to-login");
const switchToRegister = document.getElementById("switch-to-register");

if (switchToLogin) switchToLogin.onclick = () => {
  loginForm.style.display = "block";
  registerForm.style.display = "none";
};

if (switchToRegister) switchToRegister.onclick = () => {
  loginForm.style.display = "none";
  registerForm.style.display = "block";
};

if (registerBtn) registerBtn.onclick = async () => {
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (e) {
    alert("Ошибка регистрации: " + e.message);
  }
};

if (loginBtn) loginBtn.onclick = async () => {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    alert("Ошибка входа: " + e.message);
  }
};

if (logoutBtn) logoutBtn.onclick = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    alert("Ошибка выхода: " + e.message);
  }
};

onAuthStateChanged(auth, user => {
  if (user) {
    loginForm.style.display = "none";
    registerForm.style.display = "none";
    mainContent.style.display = "block";
    loadReviews();
  } else {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    mainContent.style.display = "none";
  }
});

let albumTracks = [];

function renderTrackList() {
  const container = document.getElementById("track-list");
  if (!container) return;
  container.innerHTML = "";
  albumTracks.forEach((track, index) => {
    const trackItem = document.createElement("div");
    trackItem.className = "track-item";
    trackItem.innerHTML = `
      <label>
        <input type="checkbox" data-index="${index}" ${track.liked ? "checked" : ""}>
        <i class="fa-solid fa-music" style="color: var(--accent); margin-right: 6px;"></i>
        ${track.name}
      </label>
    `;
    container.appendChild(trackItem);
  });

  container.querySelectorAll("input[type='checkbox']").forEach(input => {
    input.addEventListener("change", (e) => {
      const i = parseInt(e.target.dataset.index);
      albumTracks[i].liked = e.target.checked;
    });
  });
}
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".review-form");
  const reviewsList = document.getElementById("reviews-list");
  const albumInput = document.getElementById("albumInput");
  const suggestionsBox = document.getElementById("suggestions");

  let editIndex = null;

  function loadReviews() {
    const reviews = JSON.parse(localStorage.getItem("reviews")) || [];
    reviewsList.innerHTML = "";

    reviews.forEach((review, index) => {
      const MAX_LENGTH = 300;
      const isLongComment = review.comment.length > MAX_LENGTH;
      const shortComment = review.comment.slice(0, MAX_LENGTH);

      const reviewDiv = document.createElement("div");
      reviewDiv.className = "review";

      const bgDiv = document.createElement("div");
      bgDiv.className = "review-bg";
      if (review.cover) {
        bgDiv.style.backgroundImage = `url('${review.cover}')`;
      }

      const innerDiv = document.createElement("div");
      innerDiv.className = "review-inner";

      let likedTracksHtml = "";
      if (review.tracks && review.tracks.length > 0) {
        likedTracksHtml = `<strong>Треки:</strong><ul>` +
          review.tracks.map(track => {
            const isLiked = review.likedTracks?.includes(track.name);
            return `<li>${track.name} <span style="color: ${isLiked ? 'red' : '#aaa'}">${isLiked ? '❤️' : ''}</span></li>`;
          }).join("") +
        `</ul>`;
      }

      innerDiv.innerHTML = `
        ${review.cover ? `<img src="${review.cover}" alt="Обложка альбома" class="cover-img">` : ""}
        ${review.genres ? `<div class="genres"><strong>Жанры:</strong> ${review.genres}</div>` : ""}
        <div class="review-content">
          <strong>${review.title}</strong> (${review.year})<br>
          Автор: ${review.author}<br>
          Песен: ${review.trackCount} | Оценка: ${review.rating}/10<br>
          ${likedTracksHtml}
          <div class="comment">
            <span class="comment-text" data-full="${review.comment}">
              ${isLongComment ? `${shortComment}...` : review.comment}
            </span>
            ${isLongComment ? `<button class="toggle-btn">Показать полностью</button>` : ""}
          </div>
          <br>
          <button data-index="${index}" class="edit-btn">Редактировать</button>
          <button data-index="${index}" class="delete-btn">Удалить</button>
        </div>
      `;

      reviewDiv.appendChild(bgDiv);
      reviewDiv.appendChild(innerDiv);
      reviewsList.appendChild(reviewDiv);
    });

    document.querySelectorAll(".delete-btn").forEach(btn =>
      btn.addEventListener("click", handleDelete));

    document.querySelectorAll(".edit-btn").forEach(btn =>
      btn.addEventListener("click", handleEdit));

    document.querySelectorAll(".toggle-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const textEl = btn.previousElementSibling;
        const fullText = textEl.dataset.full;
        const isExpanded = btn.textContent === "Скрыть";

        if (isExpanded) {
          textEl.textContent = fullText.slice(0, 300) + "...";
          btn.textContent = "Показать полностью";
        } else {
          textEl.textContent = fullText;
          btn.textContent = "Скрыть";
        }
      });
    });
  }

  function handleDelete(e) {
    const index = e.target.dataset.index;
    const reviews = JSON.parse(localStorage.getItem("reviews")) || [];
    reviews.splice(index, 1);
    localStorage.setItem("reviews", JSON.stringify(reviews));
    loadReviews();
  }

  function handleEdit(e) {
    editIndex = e.target.dataset.index;
    const reviews = JSON.parse(localStorage.getItem("reviews")) || [];
    const review = reviews[editIndex];

    form.title.value = review.title;
    form.trackCount.value = review.trackCount;
    form.year.value = review.year;
    form.author.value = review.author;
    form.rating.value = review.rating;
    form.comment.value = review.comment;
    albumInput.dataset.cover = review.cover || "";
    albumInput.dataset.genres = review.genres || "";
    albumTracks = review.tracks || [];
    renderTrackList();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const likedTracks = albumTracks.filter(track => track.liked);

    const review = {
      title: form.title.value,
      trackCount: form.trackCount.value,
      year: form.year.value,
      author: form.author.value,
      rating: form.rating.value,
      comment: form.comment.value,
      cover: albumInput.dataset.cover || "",
      genres: albumInput.dataset.genres || "",
      tracks: albumTracks,
      likedTracks: likedTracks.map(t => t.name)
    };

    const reviews = JSON.parse(localStorage.getItem("reviews")) || [];

    if (editIndex !== null) {
      reviews[editIndex] = review;
      editIndex = null;
    } else {
      reviews.push(review);
    }

    localStorage.setItem("reviews", JSON.stringify(reviews));
    form.reset();
    albumInput.dataset.cover = "";
    albumInput.dataset.genres = "";
    albumTracks = [];
    document.getElementById("track-list").innerHTML = "";
    loadReviews();
  });

  albumInput.addEventListener("input", async () => {
    const query = albumInput.value.trim();
    suggestionsBox.innerHTML = "";

    if (query.length < 2) {
      suggestionsBox.style.display = "none";
      return;
    }

    const url = `https://ws.audioscrobbler.com/2.0/?method=album.search&album=${encodeURIComponent(query)}&api_key=${API_KEY}&format=json`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      const matches = data.results.albummatches.album.slice(0, 5);

      if (matches.length === 0) {
        suggestionsBox.style.display = "none";
        return;
      }

      matches.forEach(album => {
        const suggestion = document.createElement("div");
        suggestion.textContent = `${album.name} — ${album.artist}`;
        suggestion.addEventListener("click", async () => {
          albumInput.value = album.name;
          form.author.value = album.artist;
          suggestionsBox.style.display = "none";

          let coverUrl = "";
          let genresList = [];
          albumTracks = [];

          const infoUrl = `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${API_KEY}&artist=${encodeURIComponent(album.artist)}&album=${encodeURIComponent(album.name)}&format=json`;

          try {
            const response = await fetch(infoUrl);
            const data = await response.json();

            if (data.album) {
              if (data.album.tracks && data.album.tracks.track) {
                albumTracks = Array.isArray(data.album.tracks.track)
                  ? data.album.tracks.track.map(t => ({ name: t.name, liked: false }))
                  : [{ name: data.album.tracks.track.name, liked: false }];
                form.trackCount.value = albumTracks.length;
              }

              if (data.album.wiki && data.album.wiki.published) {
                const yearMatch = data.album.wiki.published.match(/\d{4}/);
                if (yearMatch) {
                  form.year.value = yearMatch[0];
                }
              }

              const images = data.album.image;
              if (images && images.length > 0) {
                const largeImg = images.find(img => img.size === "extralarge") || images[images.length - 1];
                coverUrl = largeImg["#text"];
              }

              if (data.album.tags && data.album.tags.tag) {
                genresList = data.album.tags.tag.map(tag => tag.name);
              }

              albumInput.dataset.cover = coverUrl;
              albumInput.dataset.genres = genresList.join(", ");
              renderTrackList();
            }
          } catch (error) {
            console.error("Ошибка при получении деталей альбома:", error);
          }
        });
        suggestionsBox.appendChild(suggestion);
      });

      suggestionsBox.style.display = "block";
    } catch (error) {
      console.error("Ошибка при получении альбомов:", error);
    }
  });

  document.addEventListener("click", (e) => {
    if (!albumInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.style.display = "none";
    }
  });

  loadReviews();
});
