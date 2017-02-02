//IIFE 
(function() {
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
   
    function handleNewMapPosition(marker) {
        var coordinates = getCoordinates(marker);
        let locationInfo;
        let weatherInfo;
        
        // setLoading(true);

        getLocationInfo(coordinates)
            .then(function(data) {
                locationInfo = data;
                return getWeatherInfo(locationInfo);
            })
            .then(function(data) {
                console.log(data);
                console.log("2nd");
                weatherInfo = filterWeatherInfo(data, locationInfo);
            })
            .then(function() {
                console.log("3rd");
                if (!locationInfo){
                    displayInvalidLoaction();
                } else if (!weatherInfo){
                    displayNoWeatherAvailable();
                } else {
                    displayWeather(weatherInfo, locationInfo);
                }
                // setLoading(false);
            })
            .then(function() {
                
            })
            .catch(function() {
                console.log("something is not working");
            });

    }

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

                console.log("geocode api call is successful");

                var geocodeData;
                try {
                    geocodeData = JSON.parse(request.responseText);
                } catch(e) {
                    return reject(new Error('Invalid JSON returned from geocode api.'));
                }
                console.log(geocodeData);

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

                console.log("Location Information : ");
                console.log(locationInfo);

                return resolve(locationInfo);
            }
            request.send();
        });
    }

    function getWeatherInfo(locationInfo){
        console.log("get weather info is called");

        if(!locationInfo){
            console.log("location info is null");
            return resolve(null);
        }

        var city = locationInfo.city;
        var region = locationInfo.region;
        var countryCode = locationInfo.countryCode;

        var baseAPI = "http://api.openweathermap.org/data/2.5/weather?q=";
        var apikey = "&APPID=90aa12ad410be3d7a5f9af4f1f7e53d1";

        return new Promise((resolve,reject) => {
            var request = new XMLHttpRequest();
            var url;

            // if the specific city name is not available
            if(!city || typeof city === "number" || city.includes("-") || city.includes("Unknown")){
                url = baseAPI + region + "," + countryCode + apikey;
            // if the city name is available to search
            } else {
                url = baseAPI + city + "," + countryCode + apikey;
            }

            request.open("GET",url,true);
            request.onload = function () {
                if(request.status !== 200){
                    return reject(new Error("Weather api returned non 200 status code. Got " + request.status));
                }
 
                console.log("weather api call is successful");
                var weatherData;

                try{
                    weatherData = JSON.parse(request.responseText);
                } catch(e){
                    return reject(new Error("Invalid JSON returned from weather api"));
                }

                console.log("Weather Information : ");
                console.log(weatherData);

                return resolve(weatherData);
            }
            request.send();
        });
        
    }

    // filter the required weather information
    function filterWeatherInfo(rawWeather,locationInfo){
        console.log(rawWeather);
        console.log(locationInfo);

        if(!rawWeather || !locationInfo){
            return null;
        }
        return {
        
            temp : (rawWeather.main.temp -273.15).toFixed(2),
            humidity : rawWeather.main.humidity,
            desc : rawWeather.weather[0].description,
            icon : "http://openweathermap.org/img/w/" + rawWeather.weather[0].icon + ".png",
            clouds : rawWeather.clouds.all,
            wind : rawWeather.wind.speed

        };
    }

    // Elements used for display
    var popupTitlEl = document.getElementsByClassName('popup-title')[0];
    var cityEl = document.getElementById('regionAndCity');
    var countryEl = document.getElementById('country');
    var popupBodyEl = document.getElementsByClassName('popup-body')[0];
    var weatherIconEl = document.getElementById('weatherIcon');
    var temperatureEl = document.getElementById('temperature');
    var descriptionEl = document.getElementById('description');
    var humidityEl = document.getElementById('humidity');
    var cloudsEl = document.getElementById('clouds');
    var windEl = document.getElementById('wind');

    function displayInvalidLoaction(){
        countryEl.innerHTML = "This is middle of nowhere !";
        descriptionEl.innerHTML = "How about trying to move the marker to the other place?";
    }

    function displayNoWeatherAvailable(locationinfo){

    }
    
    function noWeatherAlert(){
        console.log("weather information is unavailable for this place")
        popupTitleEditor("middle of nowhere?!");
        document.getElementById('weatherSummary').innerHTML = "weather information is unavailable for this place";
        popupOpen();
    }
    // display the weather information using pop up window title and body
    function displayWeather(weather,location){

        console.log("display weather opened");

        var city = location.city;
        var region = location.region;
        var country = location.country;

        if(!city || typeof city === "number" || city.includes("-")){
            cityEl.innerHTML = region;
        } else {
            cityEl.innerHTML = city + ", " + region;
        }

        countryEl.innerHTML = country;
        popupBodyEditor(weather);
    }

    // pop up window related 
    var popupEl = document.getElementById('popup');
    var popup = new Popup(popupEl, {
        width: 500,
        height: 500
    });

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
            beaufortScale = "calm";
        } else if(windspeed>=0.3 && windspeed<1.6) {
            beaufortScale = "light air";
        } else if(windspeed>=1.6 && windspeed<3.4) {
            beaufortScale = "light breeze";
        } else if(windspeed>=3.4 && windspeed<5.5) {
            beaufortScale = "gentle breeze";
        } else if(windspeed>=5.5 && windspeed<8.0) {
            beaufortScale = "moderate breeze";
        } else if(windspeed>=8.0 && windspeed<10.8) {
            beaufortScale = "fresh breeze";
        } else if(windspeed>=10.8 && windspeed<13.9) {
            beaufortScale = "strong breeze";
        } else if(windspeed>=13.9 && windspeed<17.2) {
            beaufortScale = "near gale";
        } else if(windspeed>=17.2 && windspeed<20.8) {
            beaufortScale = "gale";
        } else if(windspeed>=20.8 && windspeed<24.5) {
            beaufortScale = "strong gale";
        } else if(windspeed>=24.5 && windspeed<28.5) {
            beaufortScale = "storm";
        } else if(windspeed>=28.5 && windspeed<32.7) {
            beaufortScale = "violent storm";
        } else if(windspeed>32.7) {
            beaufortScale = "hurricane force";
        }

    }
    function popupBodyEditor(weather){
        console.log("body editior opened");

        var iconImage = "<img src='" + weather.icon + "' height=100 width=100>";

        weatherIconEl.innerHTML = iconImage;
        temperatureEl.innerHTML = weather.temp + "°C";

        descriptionEl.innerHTML = weather.desc.charAt(0).toUpperCase() + weather.desc.slice(1);
        humidityEl.innerHTML = "Humidity is " + weather.humidity + "%.";
        cloudsEl.innerHTML = "Cloudness is " + weather.clouds + "%.";
        windEl.innerHTML = "Wind speed is " + weather.wind + "m/s.";
    }
    // function displayWeatherDetail(){
    //     document.getElementsByClassName('popup-body')[0].innerHTML = "Something else is coming here ! ";
    // }
    // document.getElementById('weatherIcon').onclick = displayWeatherDetail();

    google.maps.event.addListener(marker,'dragend', popupOpen);
    google.maps.event.addListener(marker,'dragstart', popupClose);

    function setLoading(){

    }

    function toggleDisplay(element){
        if(element.style.display == 'block'){
            element.style.display = 'none';
        } else {
            element.style.display = 'block';
        }
    }


    var infoBody = document.getElementsByClassName('popup-body')[0];
    var sum = document.getElementById('weatherSummary');
    sum.style.display='block';
    var det = document.getElementById('weatherDetail');
    det.style.display='none';

    infoBody.onclick = function(){
        toggleDisplay(sum);
        toggleDisplay(det);
    }
    // sum.onclick = toggle(sum,det);
    // det.onclick = toggle(sum,det);
    /* Init function might need to be added
    */
})();