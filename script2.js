//IIFE 
(function() {

    // Elements used for display
    var popupTitleEl = document.getElementsByClassName('popup-title')[0];
    var cityEl = document.getElementById('regionAndCity');
    var countryEl = document.getElementById('country');
    var popupBodyEl = document.getElementsByClassName('popup-body')[0];
    var weatherIconEl = document.getElementById('weatherIcon');
    var temperatureEl = document.getElementById('temperature');
    var descriptionEl = document.getElementById('description');
    var humidityEl = document.getElementById('humidity');
    var cloudsEl = document.getElementById('clouds');
    var windEl = document.getElementById('wind');
    var summaryEl = document.getElementById('weatherSummary');
    var detailEl = document.getElementById('weatherDetail');
    var loadingEl = document.getElementById('loading');
    var nowhereEl = document.getElementById('nowhere');

    var myLatlng = new google.maps.LatLng(-36.848461,174.763336);
    var mapOptions = {
    zoom: 8,
    center: myLatlng
    }
    var map = new google.maps.Map(document.getElementById("map"), mapOptions);

    // Place a draggable marker on the map
    var marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        draggable:true,
        title:"Drag me to check other city's weather :)"
    });

    // Add event listener on the marker,
    // getting coordinates from it whenever the marker is dragged to somewhere
    // Important trigger of the process 
    google.maps.event.addListener(marker, 'dragend', handleNewMapPosition);
   
    // From marker dragging event, this chain reactions will happen
    // It will get coordinates from the position that marker is moved to, from that getting geolocation information
    // Geolocation information is used to get weather information for the area 
    // Data acquired will be displayed through pop up window
    function handleNewMapPosition(marker) {
        var coordinates = getCoordinates(marker);
        let locationInfo;
        let weatherInfo;

        setLoading(true);

        getLocationInfo(coordinates)
            .then(function(data) {
                locationInfo = data;
                return getWeatherInfo(locationInfo);
            })
            .then(function(data) {
                weatherInfo = filterWeatherInfo(data, locationInfo);
            })
            .then(function() {
                setLoading(false);
                if (!locationInfo){
                    displayInvalidLoaction();
                } else if (!weatherInfo){
                    displayNoWeatherAvailable(locationInfo);
                } else {
                    displayWeather(weatherInfo, locationInfo);
                }
            })
            .catch(function(e) {
                console.log(e);
                console.log("something is not working");
            });

    }
    
    // Pop up window related 
    var popupEl = document.getElementById('popup');
    var popup = new Popup(popupEl, {
        width: 600,
        height: 400
    });

    // Get latitude and longitude from the marker after it is dragged to the new position
    function getCoordinates(marker){
        // let : block scope , var : function scope
        var latitude = marker.latLng.lat();
        var longitude = marker.latLng.lng();

        return {
            latitude: latitude,
            longitude: longitude
        };
    }

    // Get location information from coordinates, googleMapsGeolocation API call is made here
    function getLocationInfo(coordinates){
        var lat = coordinates.latitude;
        var long = coordinates.longitude;      
        var geocodeAPIcall = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + lat + "," + long + "&key=AIzaSyCFhxWUZbhlZDGKRzCcPvTSe30F8gaCqhg"

        return new Promise((resolve, reject) => {
            var request = new XMLHttpRequest();

            request.open("GET", geocodeAPIcall, true);
            request.onload = function() {
                if (request.status !== 200) {
                    return reject(new Error('Geocode api returned non 200 status code. Got ' + request.status));
                }

                var geocodeData;
                try {
                    geocodeData = JSON.parse(request.responseText);
                } catch(e) {
                    return reject(new Error('Invalid JSON returned from geocode api.'));
                }

                let length = geocodeData.results.length;
                
                if (geocodeData.status === "ZERO_RESULTS"){
                    return resolve(null);
                }

                if (length === 1) {
                    let locationInfo = {
                        country: geocodeData.results[0].address_components[0].long_name,
                        countryCode: geocodeData.results[0].address_components[0].short_name,
                        region: 0,
                        city: 0
                    };

                    return resolve(locationInfo);
                }

                let locationInfo = {
                    country: geocodeData.results[length-1].address_components[0].long_name,
                    countryCode: geocodeData.results[length-1].address_components[0].short_name,
                    region: geocodeData.results[length-2].address_components[0].long_name,
                };
                if (length === 2) {
                    locationInfo.city = 0;
                } else {
                    locationInfo.city = geocodeData.results[length-3].address_components[0].long_name
                }

                return resolve(locationInfo);
            }
            request.send();
        });
    }

    // Get raw weather information, openWeatherMap API call is made here
    function getWeatherInfo(locationInfo){

        var baseAPI = "http://api.openweathermap.org/data/2.5/weather?q=";
        var apikey = "&APPID=90aa12ad410be3d7a5f9af4f1f7e53d1";

        return new Promise((resolve,reject) => {
            if(!locationInfo){
                return resolve(null);
            }
                    
            var city = locationInfo.city;
            var region = locationInfo.region;
            var countryCode = locationInfo.countryCode;

            var request = new XMLHttpRequest();
            var url;

            // if the city name is invalid
            if(!isNameValid(city)){
                url = baseAPI + region + "," + countryCode + apikey;
            // if the region name is invalid
            } else if(!isNameValid(region)){
                return resolve(null);
            // if the city name is available to search
            } else {
                url = baseAPI + city + "," + countryCode + apikey;
            }
            
            request.open("GET",url,true);
            request.onload = function () {
                if(request.status !== 200 && request.status !== 502){
                    return reject(new Error("Weather api returned non 200 status code. Got " + request.status));

                // When the given city / region's weather is not provided 
                } else if(request.status == 502){
                    return resolve(null);
                }
                var weatherData;

                try{
                    weatherData = JSON.parse(request.responseText);
                } catch(e){
                    return reject(new Error("Invalid JSON returned from weather api"));
                }

                return resolve(weatherData);
            }
            request.send();
        });
        
    }
    
    // Filter the name that is not serachable or usable and return boolean
    function isNameValid(name){
        if(!name || !isNaN(name) || name.includes("-") || name.includes("Unknown") || name.includes(",")){
            return false;
        }
        return true;
    }

    // Filter the required weather information
    function filterWeatherInfo(rawWeather,locationInfo){

        if(!rawWeather || !locationInfo){
            return null;
        }
        return {
        
            temp : (rawWeather.main.temp -273.15).toFixed(2),
            humidity : rawWeather.main.humidity,
            desc : rawWeather.weather[0].description,
            icon : rawWeather.weather[0].icon,
            clouds : rawWeather.clouds.all,
            wind : rawWeather.wind.speed

        };
    }

    // When there is no location data, display this 
    function displayInvalidLoaction(){
        countryEl.innerHTML = "THIS IS MIDDLE OF NOWHERE !";
        nowhereEl.style.display = 'block';
        summaryEl.style.display='none';
        detailEl.style.display='none';
    }

    // When there is no weather data, display this
    function displayNoWeatherAvailable(location){
        popupTitleEditor(location);
        weatherIconEl.innerHTML = "<img src='sad.svg' alt='sorry' height=150 width=150>";
        temperatureEl.innerHTML = "Sorry ! Weather information for this place is unavailable.";
    }
    
    // Display the weather information using pop up window title and body
    function displayWeather(weather,location){
        popupTitleEditor(location);
        popupBodyEditor(weather);
    }

    function popupOpen(){
        popup.open();
    }

    function popupClose(){
        popup.close();
    }

    // Convert wind speed to Beaufort scale
    function beaufortConverter(windSpeed){
        var beaufortScale;
        if (windSpeed <0.3){
            beaufortScale = " calm";
        } else if(windSpeed>=0.3 && windSpeed<1.6) {
            beaufortScale = " like a light air";
        } else if(windSpeed>=1.6 && windSpeed<3.4) {
            beaufortScale = " like a light breeze";
        } else if(windSpeed>=3.4 && windSpeed<5.5) {
            beaufortScale = " like a gentle breeze";
        } else if(windSpeed>=5.5 && windSpeed<8.0) {
            beaufortScale = " like a moderate breeze";
        } else if(windSpeed>=8.0 && windSpeed<10.8) {
            beaufortScale = " like a fresh breeze";
        } else if(windSpeed>=10.8 && windSpeed<13.9) {
            beaufortScale = " like a strong breeze";
        } else if(windSpeed>=13.9 && windSpeed<17.2) {
            beaufortScale = " like a near gale";
        } else if(windSpeed>=17.2 && windSpeed<20.8) {
            beaufortScale = " like a gale";
        } else if(windSpeed>=20.8 && windSpeed<24.5) {
            beaufortScale = " like a strong gale";
        } else if(windSpeed>=24.5 && windSpeed<28.5) {
            beaufortScale = " like a storm";
        } else if(windSpeed>=28.5 && windSpeed<32.7) {
            beaufortScale = " like a violent storm";
        } else if(windSpeed>32.7) {
            beaufortScale = " like a hurricane force";
        }
        return beaufortScale;
    }

    // Inner HTML of elements in the pop up window - title is edited here
    function popupTitleEditor(location){
        var city = location.city;
        var region = location.region;
        var country = location.country.toUpperCase();

        if(!isNameValid(city) && isNameValid(region)){
            cityEl.innerHTML = region.toUpperCase();
        } else if(!isNameValid(city) && !isNameValid(region)){
            cityEl.innerHTML = "";
        } else {
            cityEl.innerHTML = city.toUpperCase() + ", " + region.toUpperCase();
        }

        countryEl.innerHTML = country;
    };

    // Inner HTML of elements in the pop up window - body is edited here
    function popupBodyEditor(weather){
        console.log("body editior opened");

        var iconSrc = iconFinder(weather.icon);
        console.log(weather.icon);
        console.log(iconSrc);
        var iconImage = "<img src='" + iconSrc + ".svg' alt=" + weather.desc + "height=150 width=150 style='cursor : pointer'>";

        // Summary part
        weatherIconEl.innerHTML = iconImage;
        temperatureEl.innerHTML = weather.temp + "°C";

        // Detail part
        descriptionEl.innerHTML = weather.desc.charAt(0).toUpperCase() + weather.desc.slice(1);
        humidityEl.innerHTML = "Humidity is " + weather.humidity + "%.";
        cloudsEl.innerHTML = "Cloudness is " + weather.clouds + "%.";
        var windDescription = beaufortConverter(weather.wind) + ".";
        windEl.innerHTML = "Wind speed is " + weather.wind + "m/s.<br> It means the wind feels" + windDescription;
    }

    // Based on the returned data's icon code, it finds the right icon and return its file name
    function iconFinder(iconCode){
        var index = iconCode.slice(0,2);
        var iconSrc;
        if (index < 3){
            iconSrc = iconCode;
        } else if(index == 4){
            iconSrc = "03";
        } else {
            iconSrc = index;
        }
        return iconSrc;
    }

    google.maps.event.addListener(marker,'dragend', popupOpen);
    google.maps.event.addListener(marker,'dragstart', popupClose);

    // Loading page visibility is adjusted using this function
    function setLoading(criteria){
        // When the data is loaded
        if(!criteria){
            summaryEl.style.display='block';
            detailEl.style.display='none';
            loadingEl.style.display='none';
            nowhereEl.style.display='none';
        // When the data is loading
        }else{
            summaryEl.style.display='none';
            detailEl.style.display='none';
            loadingEl.style.display='block';
            nowhereEl.style.display='none';
        }
        cityEl.innerHTML = "";
        countryEl.innerHTML = "";
    }

    // Toggle the visibility of given single element
    function toggleDisplay(element){
        if(element.style.display == 'block'){
            element.style.display = 'none';
        } else {
            element.style.display = 'block';
        }
    }
   
    // Summary page and detail page are togglable by clicking it
    summaryEl.onclick = function(){
        toggleDisplay(summaryEl);
        toggleDisplay(detailEl);
    }

    detailEl.onclick = function(){
        toggleDisplay(summaryEl);
        toggleDisplay(detailEl);
    }

    /* Init function might need to be added
    */
})();