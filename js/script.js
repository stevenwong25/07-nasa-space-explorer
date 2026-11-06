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

// Wait before sending another API request.
function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

// Fetch space images for the dates selected by the user.
async function fetchSpaceImages() {
  button.disabled = true;
  button.classList.add('disabled');

  const startDate = startInput.value;
  const endDate = endInput.value;
  const url = `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}`;

  gallery.innerHTML = '<p class="placeholder">Loading space images...</p>';

  try {
    await wait(1000);
    const response = await fetch(url);

    console.log('NASA API request rate limit:', {
      limit: response.headers.get('X-RateLimit-Limit'),
      remaining: response.headers.get('X-RateLimit-Remaining')
    });

    if (!response.ok) {
      throw new Error('NASA could not provide the images right now.');
    }

    const images = await response.json();

    // Log every property from each object returned by NASA.
    images.forEach((image, index) => {
      console.log(`NASA image ${index + 1}:`, image);
    });

    gallery.innerHTML = '';

    images.forEach(({ hdurl, alt, date, title, media_type, url }) => {
      const galleryItem = document.createElement('div');
      galleryItem.classList.add('gallery-item');

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
