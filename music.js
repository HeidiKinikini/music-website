const clientId = "50fb808e20fd469886ed90829cb89fdd";
const params = new URLSearchParams(window.location.search);
const code = params.get("code");
const cards = [];
let currentCard = 0;

document.getElementById("swipe-right-button").addEventListener("click", () => {
  swipeRight();
});

document.getElementById("swipe-left-button").addEventListener("click", () => {
  swipeLeft();
});

if (!code) {
  redirectToAuthCodeFlow(clientId);
} else {
    const accessToken = await getAccessToken(clientId, code);
    const albums = await fetchProfile(accessToken);
    populateUI(albums);
}

async function redirectToAuthCodeFlow(clientId) {
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem("verifier", verifier);

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("response_type", "code");
  params.append("redirect_uri", "http://127.0.0.1:5500/music.html");
  params.append("scope", "user-read-private user-read-email");
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", challenge);

  document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
}

async function getAccessToken(clientId, code) {
  const verifier = localStorage.getItem("verifier");

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", "http://127.0.0.1:5500/music.html");
  params.append("code_verifier", verifier);

  const result = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
  });

  const { access_token } = await result.json();
  return access_token;
}

async function fetchProfile(token) {
  const result = await fetch("https://api.spotify.com/v1/artists/01RMQtxLlxeZXKceJinOUL/albums", {
    method: "GET", headers: { Authorization: `Bearer ${token}` }
  });

  return await result.json();
}

function populateUI(albums) {
    albums.items.forEach(album => {
        let currentAlbumHTML = `
          <div class="card">
            <p class="card-title">${album.name}</p>
            <img src="${album.images[0].url}" class="card-image">
            <button class="card-button">Explore Song</button>
          </div>
        `;

        cards.push(currentAlbumHTML);
    });

    let currentAlbumsHTML = cards[cards.length - 1];

    for (let i = 0; i < 2; i++)
    {
      currentAlbumsHTML += cards[i];
    }

    let cardContainer = document.getElementById("card-container");
    cardContainer.innerHTML = currentAlbumsHTML;
}

function swipeRight() {
  if (currentCard === (cards.length - 1)) {
    currentCard = 0;
  } else {
    currentCard++;
  }

    updateCurrentAlbums();
}

function swipeLeft() {
  if (currentCard === 0) {
    currentCard = cards.length - 1;
  } else {
    currentCard--;
  }

    updateCurrentAlbums();
}

function updateCurrentAlbums() {
    let previousCard;

    if (currentCard === 0) {
      previousCard = cards[cards.length - 1];
    } else {
      previousCard = cards[currentCard - 1];
    }

    let nextCard;

    if (currentCard === cards.length - 1) {
      nextCard = cards[0];
    } else {
      nextCard = cards[currentCard + 1];
    }

    let currentAlbumsHTML = previousCard + cards[currentCard] + nextCard;

    let cardContainer = document.getElementById("card-container");
    cardContainer.innerHTML = currentAlbumsHTML;

    const cardElements = document.getElementsByClassName("card");

    cardElements[0].className = "card-background";
    cardElements[1].className = "card-background";
}