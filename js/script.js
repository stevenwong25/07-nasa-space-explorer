// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

const API_KEY = 'fDWhJnFhkqfpLBMmDgkmrqRCqJ6cmp6gwwqrWNrW';
const gallery = document.getElementById('gallery');
const button = document.querySelector('button');
let startDate = startInput.value;
let endDate = endInput.value;

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

function openModal(image) {
  modalMedia.innerHTML = '';

  if (image.media_type === 'video') {
    const video = document.createElement('iframe');
    video.src = image.url;
    video.title = image.title;
    video.allowFullscreen = true;
    video.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    modalMedia.appendChild(video);
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
    gallery.innerHTML = '<p class="placeholder">Please select a valid date range.</p>';
    button.disabled = false;
    button.classList.remove('disabled');
    return;
  }

  const url = `https://science.nasa.gov/wp-json/wp/v2/apod-basic/?api_key=${API_KEY}&start_date=${selectedStartDate}&end_date=${selectedEndDate}`;
  console.log(url);

  gallery.innerHTML = '<p class="placeholder">Loading space images...</p>';

  try {
    // await wait(1000);
    const response = await fetch(url);

    console.log('NASA API status:', response.status, response.statusText);
    console.log('NASA API request rate limit:', {
      limit: response.headers.get('X-RateLimit-Limit') || 'unknown',
      remaining: response.headers.get('X-RateLimit-Remaining') || 'unknown'
    });

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

    images.slice(0, selectedDays).forEach((image) => {
      const { hdurl, alt, date, title, media_type, url } = image;
      const galleryItem = document.createElement('div');
      galleryItem.classList.add('gallery-item');
      galleryItem.addEventListener('click', () => openModal(image));

      if (media_type === 'video') {
        const video = document.createElement('iframe');
        video.src = url;
        video.title = title;
        video.allowFullscreen = true;
        video.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        galleryItem.appendChild(video);
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
  } catch (error) {
    gallery.innerHTML = `<p class="placeholder">${error.message}</p>`;
  } finally {
    button.disabled = false;
    button.classList.remove('disabled');
  }
}

button.addEventListener('click', fetchSpaceImages);
