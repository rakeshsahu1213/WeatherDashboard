//open weather api key
      const OPENWEATHER_KEY = 'bcba7471fb9c7786a3af63c23e5b127a';

      const cityInput = document.getElementById('cityInput');
      const searchBtn = document.getElementById('searchBtn');
      const tempVal = document.getElementById('tempVal');
      const minmax = document.getElementById('minmax');
      const locationName = document.getElementById('locationName');
      const updatedAt = document.getElementById('updatedAt');
      const weatherDesc = document.getElementById('weatherDesc');
      const localTimeEl = document.getElementById('localTime');
      const humidityEl = document.getElementById('humidity');
      const pressureEl = document.getElementById('pressure');
      const windEl = document.getElementById('wind');
      const feelsEl = document.getElementById('feels');
      const weatherIcon = document.getElementById('weatherIcon');
      const sunriseEl = document.getElementById('sunrise');
      const sunsetEl = document.getElementById('sunset');
      const forecastEl = document.getElementById('forecast');
      const errorBox = document.getElementById('errorBox');
      const bgVideo = document.getElementById('bgVideo');
      const bgSource = document.getElementById('bgSource');

      const videos = {
         Clear: "clear.mp4",
         Clouds: "clouds.mp4",
         Rain: "rain.mp4",
         Drizzle: "drizzle.mp4",
         Thunderstorm: "thunderstorm.mp4",
         Snow: "snow.mp4",
         Mist: "mist.mp4",
         Smoke: "smoke.mp4",
         Haze: "haze.mp4",
         Dust: "dust.mp4",
         Fog: "fog.mp4",
         Sand: "sand.mp4",
         Ash: "ash.mp4",
         Squall: "squall.mp4",
         Tornado: "tornado.mp4",
         Atmosphere: "clouds.mp4"
      };

      let clockInterval = null;

      function showError(msg) {
         errorBox.style.display = 'block';
         errorBox.textContent = msg;
      }
      function clearError() {
         errorBox.style.display = 'none';
         errorBox.textContent = '';
      }

      function iconUrl(icon) {
         return icon ? `https://openweathermap.org/img/wn/${icon}@4x.png` : '';
      }

      function degToCompass(num) {
         if (num === undefined || num === null) return '';
         const val = Math.floor((num / 22.5) + 0.5);
         const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
         return arr[(val % 16)];
      }

      function toLocalTime(unixUTC, offsetSeconds) {
         const date = new Date((unixUTC + offsetSeconds) * 1000);
         const hours = date.getUTCHours().toString().padStart(2, '0');
         const minutes = date.getUTCMinutes().toString().padStart(2, '0');
         const seconds = date.getUTCSeconds().toString().padStart(2, '0');
         return `${hours}:${minutes}:${seconds}`;
      }

      function setBackground(condition) {
         const chosen = videos[condition] || videos['Atmosphere'];
         if (bgSource.src.includes(chosen)) return;
         bgSource.src = chosen;
         bgVideo.load();
         bgVideo.play().catch(() => { });
      }

      async function fetchCurrent(city) {
         const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${OPENWEATHER_KEY}`);
         if (!res.ok) throw { status: res.status };
         return res.json();
      }

      async function fetchForecast(lat, lon) {
         const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_KEY}`);
         if (!res.ok) throw { status: res.status };
         return res.json();
      }

      function reduceForecast(list) {
         const days = {};
         list.forEach(item => {
            const day = new Date(item.dt * 1000).toISOString().slice(0, 10);
            if (!days[day]) days[day] = [];
            days[day].push(item);
         });
         return Object.keys(days).slice(0, 5).map(day => {
            const arr = days[day];
            let min = Infinity, max = -Infinity, icon = null, desc = '';
            arr.forEach(it => {
               min = Math.min(min, it.main.temp_min);
               max = Math.max(max, it.main.temp_max);
               if (!icon) icon = it.weather[0].icon;
               desc = it.weather[0].main;
            });
            return { day, min: Math.round(min), max: Math.round(max), icon, desc };
         });
      }

      function clearClock() {
         if (clockInterval) { clearInterval(clockInterval); clockInterval = null; }
      }
      // main function of js
      async function showWeather(city) {
         if (!city) return;
         clearError();
         forecastEl.innerHTML = '';
         try {
            const cur = await fetchCurrent(city);
            const { coord, weather, main, wind, name, sys, dt, timezone } = cur;
            const tz = timezone || 0;

            // Current weather
            tempVal.textContent = Math.round(main.temp) + '°C';
            minmax.textContent = `Min ${Math.round(main.temp_min)}° / Max ${Math.round(main.temp_max)}°`;
            locationName.textContent = `${name}, ${sys.country}`;
            updatedAt.textContent = 'Updated: ' + toLocalTime(dt, tz);
            weatherDesc.textContent = `${weather[0].description} · ${weather[0].main}`;
            humidityEl.textContent = main.humidity + '%';
            pressureEl.textContent = main.pressure + ' hPa';
            windEl.textContent = `${wind.speed} m/s • ${degToCompass(wind.deg)}`;
            feelsEl.textContent = Math.round(main.feels_like) + '°C';

            sunriseEl.textContent = toLocalTime(sys.sunrise, tz);
            sunsetEl.textContent = toLocalTime(sys.sunset, tz);

            weatherIcon.src = iconUrl(weather[0].icon);
            weatherIcon.alt = weather[0].description;

            setBackground(weather[0].main);

            // live clock
            clearClock();
            let cityTime = new Date((dt + tz) * 1000);
            localTimeEl.textContent = 'Local time: ' + toLocalTime(dt, tz);
            clockInterval = setInterval(() => {
               cityTime.setUTCSeconds(cityTime.getUTCSeconds() + 1);
               const h = cityTime.getUTCHours().toString().padStart(2, '0');
               const m = cityTime.getUTCMinutes().toString().padStart(2, '0');
               const s = cityTime.getUTCSeconds().toString().padStart(2, '0');
               localTimeEl.textContent = `Local time: ${h}:${m}:${s}`;
            }, 1000);

            // forecast
            try {
               const fc = await fetchForecast(coord.lat, coord.lon);
               const daily = reduceForecast(fc.list);
               forecastEl.innerHTML = '';
               daily.forEach(d => {
                  const el = document.createElement('div');
                  el.className = 'day';
                  const dayName = new Date(d.day).toLocaleDateString(undefined, { weekday: 'short' });
                  el.innerHTML = `
          <div class="dayname">${dayName}</div>
          <div class="tempmax">${d.max}°</div>
          <div class="muted">${d.min}°</div>
          <img src="${iconUrl(d.icon)}" alt="${d.desc}" style="width:56px;height:56px;margin:6px auto;display:block"/>
          <div class="muted" style="font-size:13px;margin-top:6px">${d.desc}</div>`;
                  forecastEl.appendChild(el);
               });
            } catch (e) { console.warn('Forecast error', e); }

         } catch (err) {
            clearClock();
            if (err.status === 404) showError('City not found');
            else if (err.status === 401) showError('Invalid API key');
            else showError('Cannot fetch weather data');
         }
      }

      searchBtn.addEventListener('click', () => showWeather(cityInput.value.trim()));
      cityInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') showWeather(cityInput.value.trim()); });