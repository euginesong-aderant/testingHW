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
                weatherInfo = filterWeatherInfo(data);
            })
            .then(function() {
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

        if(!locationInfo){
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
    function filterWeather(rawWeather,locationInfo){
        if(!rawWeather || !locationInfo){
            return null;
        }
        return {
        
            temp : (rawWeather.main.temp -273.15).toFixed(2) + "°C",
            humidity : rawWeather.main.humidity + "%",
            desc : rawWeather.weather[0].description,
            icon : "http://openweathermap.org/img/w/" + rawWeather.weather[0].icon + ".png",
            clouds : rawWeather.clouds.all + "%",
            wind : rawWeather.wind.speed + "m/s"

        };
    }

    function displayInvalidLoaction(){

    }

    function displayNoWeatherAvailable(){

    }
    
    function noWeatherAlert(){
        console.log("weather information is unavailable for this place")
        popupTitleEditor("middle of nowhere?!");
        document.getElementById('weatherSummary').innerHTML = "weather information is unavailable for this place";
        popupOpen();
    }
    // display the weather information using pop up window title and body
    function displayWeather(weather,location){

        var city = location.city;
        var region = location.region;
        var country = location.country;
        var title = "";
        
        if(!city || typeof city === "number" || city.includes("-")){
            title = region + ", " + country;
        } else {
            title = city + ", " + region + ", " + country;
        }

        console.log(weather);

        popupTitleEditor(title);
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

    function popupBodyEditor(weather){
        
        var iconImage = "<img src='" + weather.icon + "' height=100 width=100>";

        var weatherIconElement = document.getElementById('weatherIcon');
        var temperatureElement = document.getElementById('temperature');
        weatherIconElement.innerHTML = iconImage;
        temperatureElement.innerHTML = weather.temp;
    }

    function popupTitleEditor(input){
        document.getElementById('popupTitle').innerHTML = input;
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
        console.log("Toggle the visibility");

        if(element.style.display == 'block'){
            element.style.display = 'none';
        } else {
            element.style.display = 'block';
        }
    }


    // testing purpose 
    var testBtn = document.getElementById('testingButton');
    var sum = document.getElementById('weatherSummary');
    sum.style.display='block';
    var det = document.getElementById('weatherDetail');
    det.style.display='none';

    testBtn.onclick = function(){
        toggleDisplay(sum);
        toggleDisplay(det);
    }
    // sum.onclick = toggle(sum,det);
    // det.onclick = toggle(sum,det);
    /* Init function might need to be added
    */
})();