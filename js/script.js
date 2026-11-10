// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

const gallery = document.getElementById('gallery');
const funFact = document.getElementById('funFact');
const funFactText = document.getElementById('funFactText');
const button = document.querySelector('button');
let startDate = startInput.value;
let endDate = endInput.value;

const funFacts = [
  'NASA’s Apollo 11 mission landed the first humans on the Moon in 1969.',
  'NASA’s Voyager 1 is the farthest human-made object from Earth.',
  'The International Space Station travels around Earth at about 17,500 miles per hour.',
  'NASA’s Hubble Space Telescope has helped scientists observe galaxies billions of light-years away.',
  'NASA’s Perseverance rover is searching for signs of ancient microbial life on Mars.',
  'NASA’s James Webb Space Telescope studies the earliest stars and galaxies in the universe.',
  'A day on Venus is longer than a year on Venus.',
  'One million Earths could fit inside the Sun.',
  'The footprints left by Apollo astronauts could stay on the Moon for millions of years.',
  'Saturn would float in water because it is less dense than water.',
  'There are more stars in the universe than grains of sand on Earth.'
];

const modal = document.createElement('div');
modal.classList.add('modal');
modal.setAttribute('aria-hidden', 'true');
modal.innerHTML = `
  <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <button class="modal-close" type="button" aria-label="Close image details">&times;</button>
    <div class="modal-media"></div>
    <h2 id="modal-title"></h2>
    <p class="modal-date"></p>
    <p class="modal-explanation"></p>
  </div>
`;
document.body.appendChild(modal);

const modalContent = modal.querySelector('.modal-content');
const modalClose = modal.querySelector('.modal-close');
const modalMedia = modal.querySelector('.modal-media');
const modalTitle = modal.querySelector('#modal-title');
const modalDate = modal.querySelector('.modal-date');
const modalExplanation = modal.querySelector('.modal-explanation');

function closeModal() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
}

// Convert YouTube links into URLs that can be used inside an iframe.
function getVideoEmbedUrl(videoUrl) {
  try {
    const url = new URL(videoUrl);
    const hostname = url.hostname.toLowerCase();

    if (hostname === 'www.ligo.caltech.edu' && url.pathname === '/video/ligo20160211v3') {
      return 'https://www.youtube.com/embed/I_88S8DWbcU';
    }

    if (hostname === 'science.nasa.gov' &&
      url.pathname === '/image-article/apod-2024-may-19-jupiter-diving/') {
      return 'https://www.youtube.com/embed/uj3Lq7Gu94Y';
    }

    if (hostname === 'youtu.be') {
      const videoId = url.pathname.slice(1);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (hostname === 'youtube.com' || hostname === 'www.youtube.com' || hostname === 'm.youtube.com') {
      const videoId = url.searchParams.get('v');

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch (error) {
    console.error('Could not prepare video URL:', error);
  }

  return null;
}

// NASA stores the YouTube link in the video's explanation.
function getVideoUrl(videoUrl, explanation) {
  if (getVideoEmbedUrl(videoUrl)) {
    return videoUrl;
  }

  const explanationDocument = new DOMParser().parseFromString(explanation || '', 'text/html');
  const youtubeLink = [...explanationDocument.querySelectorAll('a')].find((link) => {
    return getVideoEmbedUrl(link.href);
  });

  return youtubeLink ? youtubeLink.href : videoUrl;
}

// Use an iframe only for YouTube, because some video pages block iframe embeds.
function createVideoPlayer(videoUrl, title, explanation) {
  const sourceUrl = getVideoUrl(videoUrl, explanation);
  const embedUrl = getVideoEmbedUrl(sourceUrl);

  if (embedUrl) {
    const video = document.createElement('iframe');
    const embedUrlWithOrigin = new URL(embedUrl);
    embedUrlWithOrigin.searchParams.set('origin', window.location.origin);
    video.src = embedUrlWithOrigin.href;
    video.title = title;
    video.allowFullscreen = true;
    video.referrerPolicy = 'strict-origin-when-cross-origin';
    video.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    video.addEventListener('click', (event) => event.stopPropagation());
    return video;
  }

  try {
    const url = new URL(sourceUrl);
    const isDirectVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(url.pathname + url.search);

    if (isDirectVideo) {
      const video = document.createElement('video');
      video.src = url.href;
      video.title = title;
      video.controls = true;
      video.preload = 'metadata';
      video.addEventListener('click', (event) => event.stopPropagation());
      return video;
    }
  } catch (error) {
    console.error('Could not prepare video player:', error);
  }

  const link = document.createElement('a');
  link.href = videoUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Open video';
  return link;
}

function openModal(image) {
  modalMedia.innerHTML = '';

  if (image.media_type === 'video') {
    modalMedia.appendChild(createVideoPlayer(image.url, image.title, image.explanation));
  } else {
    const fullImage = document.createElement('img');
    fullImage.src = image.hdurl || image.url;
    fullImage.alt = image.alt || image.title;
    modalMedia.appendChild(fullImage);
  }

  modalTitle.textContent = image.title;
  modalDate.textContent = new Date(`${image.date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  modalExplanation.innerHTML = image.explanation;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

// Keep the selected dates up to date when either input changes.
function updateSelectedDates() {
  startDate = startInput.value;
  endDate = endInput.value;
  // console.log('Selected date range:', { startDate, endDate });
};

startInput.addEventListener('change', updateSelectedDates);
endInput.addEventListener('change', updateSelectedDates);

// Convert a date input value from YYYY-MM-DD to YYMMDD for the API request.
function formatDateForApi(date) {
  return date.replaceAll('-', '').slice(2);
}

// Wait before sending another API request.
// function wait(milliseconds) {
//   return new Promise((resolve) => {
//     setTimeout(resolve, milliseconds);
//   });
// }

// Fetch space images for the dates selected by the user.
async function fetchSpaceImages() {
  button.disabled = true;
  button.classList.add('disabled');

  let selectedStartDate = startInput.value;
  let selectedEndDate = endInput.value;

  if (!selectedStartDate || !selectedEndDate) {
    funFact.hidden = true;
    gallery.innerHTML = '<p class="placeholder">Please select a valid date range.</p>';
    button.disabled = false;
    button.classList.remove('disabled');
    return;
  }

  const formattedStartDate = formatDateForApi(selectedStartDate);
  const formattedEndDate = formatDateForApi(selectedEndDate);
  // Does not require an API key
  const url = `https://science.nasa.gov/wp-json/wp/v2/apod-basic?&per_page=9&date_from=${formattedStartDate}&date_to=${formattedEndDate}`;
  console.log(url);

  gallery.innerHTML = '<p class="placeholder">Loading space images...</p>';
  funFact.hidden = true;

  try {
    // await wait(1000);
    const response = await fetch(url);

    console.log('NASA API status:', response.status, response.statusText);
    // console.log('NASA API request rate limit:', {
    //   limit: response.headers.get('X-RateLimit-Limit') || 'unknown',
    //   remaining: response.headers.get('X-RateLimit-Remaining') || 'unknown'
    // });

    if (!response.ok) {
      throw new Error('NASA could not provide the images right now.');
    }

    const images = await response.json();
    console.log('Is array:', Array.isArray(images));
    console.log('Images:', images);
    const selectedDays = Math.floor(
      (new Date(`${selectedEndDate}T00:00:00`) - new Date(`${selectedStartDate}T00:00:00`)) /
      (1000 * 60 * 60 * 24)
    ) + 1;

    gallery.innerHTML = '';

    images.forEach((image) => {
      const { hdurl, alt, date, title, media_type, url } = image;
      const galleryItem = document.createElement('div');
      galleryItem.classList.add('gallery-item');
      galleryItem.addEventListener('click', () => openModal(image));

      if (media_type === 'video') {
        galleryItem.appendChild(createVideoPlayer(url, title, image.explanation));
      } else {
        const img = document.createElement('img');
        img.src = hdurl || url;
        img.alt = alt || title;
        galleryItem.appendChild(img);
      }

      // Format the API date as "month day, year".
      const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      const imageTitle = document.createElement('h3');
      imageTitle.textContent = title;
      const dateText = document.createElement('p');
      dateText.textContent = formattedDate;

      galleryItem.appendChild(imageTitle);
      galleryItem.appendChild(dateText);
      gallery.appendChild(galleryItem);
    });

    const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
    funFactText.textContent = randomFact;
    funFact.hidden = false;
  } catch (error) {
    funFact.hidden = true;
    gallery.innerHTML = `<p class="placeholder">${error.message}</p>`;
  } finally {
    button.disabled = false;
    button.classList.remove('disabled');
  }
}

button.addEventListener('click', fetchSpaceImages);
