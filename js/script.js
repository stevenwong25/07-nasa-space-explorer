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

// Fetch space images for the dates selected by the user.
async function fetchSpaceImages() {
  const startDate = startInput.value;
  const endDate = endInput.value;
  const url = `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}`;

  gallery.innerHTML = '<p class="placeholder">Loading space images...</p>';

  try {
    const response = await fetch(url);

    console.log('NASA API request rate limit:', {
      limit: response.headers.get('X-RateLimit-Limit'),
      remaining: response.headers.get('X-RateLimit-Remaining')
    });

    if (!response.ok) {
      throw new Error('NASA could not provide the images right now.');
    }

    const images = await response.json();

    gallery.innerHTML = images.map((image) => `
      <article class="gallery-item">
        <img src="${image.url}" alt="${image.title}">
        <h2>${image.title}</h2>
        <p>${image.date}</p>
      </article>
    `).join('');
  } catch (error) {
    gallery.innerHTML = `<p class="placeholder">${error.message}</p>`;
  }
}

button.addEventListener('click', fetchSpaceImages);
