import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";


const firebaseConfig = {
  apiKey: "AIzaSyCnVoyXHd-3NQ4VcvjXdjncoyaTnqDjHVA",
  authDomain: "music-reviews-2fe39.firebaseapp.com",
  projectId: "music-reviews-2fe39",
  storageBucket: "music-reviews-2fe39.firebasestorage.app",
  messagingSenderId: "524571811015",
  appId: "1:524571811015:web:501fe3d7b447dc58abb2e2",
  measurementId: "G-MHKTNCJV3R"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const API_KEY = "ed6ec23ae7bb84b65fab1f7bf168e979";
const mainContent = document.getElementById("main-content");
const loginForm = document.getElementById("login-form");
const reviewsList = document.getElementById("reviews-list");
const registerForm = document.getElementById("register-form");
const registerBtn = document.getElementById("register-btn");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const switchToLogin = document.getElementById("switch-to-login");
const switchToRegister = document.getElementById("switch-to-register");
const profileSection = document.getElementById("profile-section");
const saveProfileBtn = document.getElementById("save-profile");
const displayNameInput = document.getElementById("display-name");
const photoFileInput = document.getElementById("photo-file");
const profileInfo = document.getElementById("profile-info");
const photoPreview = document.getElementById("profile-photo-preview");
const userDisplay = document.getElementById("user-display");
const userHeader = document.getElementById("user-header");
const userNameDisplay = document.getElementById("user-name");
const userAvatar = document.getElementById("user-avatar");
let photoUrlInput = { value: "" }
const fileInput = document.getElementById("photo-file");
const closeProfileBtn = document.getElementById("close-profile");

if (fileInput) {
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        photoPreview.src = e.target.result;
        photoPreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });
}
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

onAuthStateChanged(auth, (user) => {
  async function loadUsers() {
  const usersContainer = document.getElementById("users-list"); // если хочешь отобразить где-то
  if (!usersContainer) return;

  try {
    const snapshot = await getDocs(collection(db, "users"));
    usersContainer.innerHTML = "";
    snapshot.forEach(doc => {
      const user = doc.data();
      const userDiv = document.createElement("div");
      userDiv.className = "user-card";
      userDiv.innerHTML = `
        <img src="${user.photoURL || 'https://via.placeholder.com/40'}" style="width: 40px; border-radius: 50%;">
        <span>${user.displayName || 'Без имени'}</span>
        <button onclick="showUserProfile('${user.uid}', '${user.displayName || "Профиль"}', '${user.photoURL || ""}')">Посмотреть профиль</button>
      `;
      usersContainer.appendChild(userDiv);
    });
  } catch (error) {
    console.error("Ошибка при загрузке пользователей:", error);
  }
}
  async function syncUserProfile(user) {
  if (!user) return;
  const userDocRef = doc(db, "users", user.uid);
  await setDoc(userDocRef, {
    uid: user.uid,
    displayName: user.displayName || "Без имени",
    photoURL: user.photoURL || "",
  }, { merge: true });
}
  if (user) {
    syncUserProfile(user);
    loginForm.style.display = "none";
    registerForm.style.display = "none";
    mainContent.style.display = "block";

    userHeader.style.display = "flex";
    userNameDisplay.textContent = user.displayName || "Профиль";
    if (user.photoURL) {
      userAvatar.src = user.photoURL;
      userAvatar.style.display = "inline-block";
    }

    displayNameInput.value = user.displayName || "";
    

    loadReviews();
    loadUsers();
    updateProfileInfo();
  } else {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    mainContent.style.display = "none";
    userHeader.style.display = "none";
    profileSection.style.display = "none";
  }
});

if (saveProfileBtn) {
  saveProfileBtn.onclick = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const newName = displayNameInput.value.trim();
let finalPhotoURL = user.photoURL || "";

const file = fileInput?.files[0];
if (file) {
  const storagePath = `avatars/${user.uid}/${file.name}`;
  const imageRef = storageRef(storage, storagePath);
  await uploadBytes(imageRef, file);
  finalPhotoURL = await getDownloadURL(imageRef);
}

    try {
      await updateProfile(user, {
        displayName: newName,
        photoURL: finalPhotoURL
      });

      alert("Профиль обновлён!");

      userAvatar.src = finalPhotoURL || "https://via.placeholder.com/40";
      userNameDisplay.textContent = newName || "Профиль";
      photoPreview.src = finalPhotoURL;
      photoPreview.style.display = "block";
      photoUrlInput.value = finalPhotoURL;

    } catch (error) {
      alert("Ошибка при обновлении профиля: " + error.message);
    }
  };
}



window.showUserProfile = function(uid, name, photo) {
  alert(`Профиль пользователя: ${name}`);
};
async function showUserProfile(userId, userName, photoURL) {
  const container = document.getElementById("public-profile");
  container.innerHTML = `<h2>Профиль: ${userName}</h2>
    <img src="${photoURL || 'https://via.placeholder.com/80'}" style="width: 80px; border-radius: 50%; margin-bottom: 10px;">
    <div id="user-reviews"></div>`;
  container.style.display = "block";

  const reviewsSnapshot = await getDocs(collection(db, "reviews"));
  const userReviews = reviewsSnapshot.docs
    .map(doc => doc.data())
    .filter(r => r.userId === userId);

  const reviewsDiv = container.querySelector("#user-reviews");
  reviewsDiv.innerHTML = "";

  userReviews.forEach(review => {
    const reviewDiv = document.createElement("div");
    reviewDiv.className = "review";
    reviewDiv.innerHTML = `
      <strong>${review.title}</strong> (${review.year})<br>
      Автор: ${review.author}<br>
      Песен: ${review.trackCount} | Оценка: ${review.rating}/10<br>
      <div class="comment-text">${review.comment}</div>
    `;
    reviewsDiv.appendChild(reviewDiv);
  });

  // Скрываем личный профиль и форму
  document.getElementById("profile-section").style.display = "none";
}

let albumTracks = [];
function loadReviews() {
  const user = auth.currentUser;
  if (!user) return;

  getDocs(collection(db, "reviews")).then(snapshot => {
    const reviews = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(r => r.userId === user.uid);

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
          <button data-id="${review.id}" class="edit-btn">Редактировать</button>
          <button data-id="${review.id}" class="delete-btn">Удалить</button>
        </div>
      `;

      reviewDiv.appendChild(bgDiv);
      reviewDiv.appendChild(innerDiv);
      reviewsList.appendChild(reviewDiv);
    });

    document.querySelectorAll(".delete-btn").forEach(btn =>
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        await deleteDoc(doc(db, "reviews", id));
        loadReviews();
        loadUsers();
      })
    );

    document.querySelectorAll(".edit-btn").forEach(btn =>
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        const snapshot = await getDoc(doc(db, "reviews", id));
        const review = snapshot.data();
        editIndex = id;

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
      })
    );

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
  });
}

async function updateProfileInfo() {
  const user = auth.currentUser;
  if (!user) return;

  const reviewCountEl = document.getElementById("review-count");
  const likedTracksCountEl = document.getElementById("liked-tracks-count");
  const recentReviewsList = document.getElementById("recent-reviews-list");
  const likedTracksList = document.getElementById("liked-tracks-list");

  try {
    const snapshot = await getDocs(collection(db, "reviews"));
    const userReviews = snapshot.docs
      .map(doc => doc.data())
      .filter(r => r.userId === user.uid);

    // Отзывы
    reviewCountEl.textContent = userReviews.length;

    // Любимые треки (уникальные)
    const likedTracks = new Set();
    userReviews.forEach(r => {
      (r.likedTracks || []).forEach(t => likedTracks.add(t));
    });
    likedTracksCountEl.textContent = likedTracks.size;

    // Последние 3 отзыва
    const latest = userReviews.slice(-3).reverse();
    recentReviewsList.innerHTML = latest.map(r => `<li>${r.title} (${r.year})</li>`).join("") || "<li>Нет отзывов</li>";

    // Любимые треки (до 5)
    likedTracksList.innerHTML = [...likedTracks].slice(0, 5).map(t => `<li>${t}</li>`).join("") || "<li>Нет любимых треков</li>";
  } catch (error) {
    console.error("Ошибка при обновлении профиля:", error);
  }
}
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

// Открытие/закрытие профиля
userHeader.addEventListener("click", (e) => {
  e.stopPropagation();
  profileSection.style.display = profileSection.style.display === "block" ? "none" : "block";
});

// Клик вне профиля — закрытие
document.addEventListener("click", (e) => {
  const target = e.target;
  if (!target.closest("#profile-section") && !target.closest("#user-header")) {
    profileSection.style.display = "none";
  }
});
closeProfileBtn.onclick = () => {
  profileSection.style.display = "none";
};

// Предотврати всплытие при кликах внутри профиля
profileSection.addEventListener("click", (e) => {
  e.stopPropagation();
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".review-form");
  const reviewsList = document.getElementById("reviews-list");
  const albumInput = document.getElementById("albumInput");
  const suggestionsBox = document.getElementById("suggestions");

  let editIndex = null;
  
  function handleDelete(e) {
    const index = e.target.dataset.index;
    const reviews = JSON.parse(localStorage.getItem("reviews")) || [];
    reviews.splice(index, 1);
    localStorage.setItem("reviews", JSON.stringify(reviews));
    loadReviews();
    loadUsers();
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

  form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const likedTracks = albumTracks.filter(track => track.liked);
  const user = auth.currentUser;
  if (!user) return;

  const review = {
    userId: user.uid,
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

  if (editIndex !== null) {
    await updateDoc(doc(db, "reviews", editIndex), review);
    editIndex = null;
  } else {
    await addDoc(collection(db, "reviews"), review);
  }

  form.reset();
  albumInput.dataset.cover = "";
  albumInput.dataset.genres = "";
  albumTracks = [];
  document.getElementById("track-list").innerHTML = "";
  loadReviews();
  loadUsers();
  updateProfileInfo();
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
  loadReviews();
});
