//IIFE 
(function() {
    var myLatlng = new google.maps.LatLng(-25.363882,131.044922);
    var mapOptions = {
    zoom: 1,
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
    google.maps.event.addListener(marker, 'dragend', getCoordinates);
   

    // Get latitude and longitude from the marker after it is dragged to the new position
    function getCoordinates(marker){
        // let : block scope , var : function scope
        var latitude = marker.latLng.lat();
        var longitude = marker.latLng.lng();

        getLocationInfo(latitude,longitude);
        // tonning down the page to display weather information
    }

    function getLocationInfo(lat,long){
        var request = new XMLHttpRequest();
        var geocodeAPIcall = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + lat + "," + long + "&key=AIzaSyCFhxWUZbhlZDGKRzCcPvTSe30F8gaCqhg"
        var geocodeData = "NA";
        var locationInfo = "";

        request.open("GET", geocodeAPIcall, true);

        request.onload = function() {
            if (request.status >=200 && request.status <400){

                console.log("geocode api call is successful");

                geocodeData = JSON.parse(request.responseText);
                console.log(geocodeData);

                let length = geocodeData.results.length;
                
                if(geocodeData.status === "ZERO_RESULTS"){
                    locationInfo = {
                        country: 0,
                        countryCode: 0,
                        region: 0,
                        city: 0
                    }

                    noWeatherAlert();

                } else if(length < 2 && length >= 1){
                    locationInfo = {
                        country: geocodeData.results[0].address_components[0].long_name,
                        countryCode: geocodeData.results[0].address_components[0].short_name,
                        region: 0,
                        city: 0
                    }

                    noWeatherAlert();

                } else {
                    // handling array length error 
                    locationInfo = {
                        country: geocodeData.results[length-1].address_components[0].long_name,
                        countryCode: geocodeData.results[length-1].address_components[0].short_name,
                        region: geocodeData.results[length-2].address_components[0].long_name,
                    }

                    if (length>2){
                        locationInfo.city = geocodeData.results[length-3].address_components[0].long_name
                    } else {
                        locationInfo.city = 0;
                    }
                                        
                    console.log(geocodeData);
                    console.log(locationInfo);
                    getWeatherInfo(locationInfo);
                }


            } else {
                console.log("geocode api call is unsuccessful");
            }
        }
        request.send();

    }

    function getWeatherInfo(locationInfo){
        console.log("weather here");

        var rawWeatherInfo = "";

        var city = locationInfo.city;
        var region = locationInfo.region;
        var countryCode = locationInfo.countryCode;

        var baseAPI = "http://api.openweathermap.org/data/2.5/weather?q=";
        var apikey = "&APPID=90aa12ad410be3d7a5f9af4f1f7e53d1";

        var request = new XMLHttpRequest();
        var url = "";

        // if the specific city name is not available
        if(!city || typeof city === "number" || city.includes("-")){
            console.log(city);
            
            url = baseAPI + region + "," + countryCode + apikey;
            console.log(url);

        // if the city name is available to search
        } else {
            url = baseAPI + city + "," + countryCode + apikey;
            console.log(url);
        }

        request.open("GET",url,true); //async true
        request.onload = function () {
            if (request.status >= 200 && request.status < 400) {
                // Successful request 
                console.log("successful request is made")
                rawWeatherInfo = JSON.parse(request.responseText);

                console.log(request.responseText);
                console.log(rawWeatherInfo);

                filterWeather(rawWeatherInfo, locationInfo);
            } else {
                console.log("unsuccessful request is made")
                // Got an error from the server
            }
        }

        request.send();
        
    }

    // filter the required weather information
    function filterWeather(rawWeather,locationInfo){
        console.log("raw weather is going to be filtered");
        var filteredData = {
        
            temp : (rawWeather.main.temp -273.15).toFixed(2) + "°C",
            humidity : rawWeather.main.humidity + "%",
            desc : rawWeather.weather[0].description,
            icon : "http://openweathermap.org/img/w/" + rawWeather.weather[0].icon + ".png",
            clouds : rawWeather.clouds.all + "%",
            wind : rawWeather.wind.speed + "m/s"

        };

        displayWeather(filteredData,locationInfo);

    }

    // display the weather information
    function displayWeather(weather,location){

        var city = location.city;
        var region = location.region;
        var country = location.country;
        var title = "";
        var iconImage = "<img src=" + weather.icon + " height=100 width=100>"

        if(!city || typeof city === "number" || city.includes("-")){
            title = region + ", " + country;
        } else {
            title = city + ", " + region + ", " + country;
        }

        console.log(weather);

        popupTitleEditor(title);
        popupBodyEditor(iconImage);
    }

    function noWeatherAlert(){
        console.log("weather information is unavailable for this place")
        popupTitleEditor("middle of nowhere?!");
        popupBodyEditor("weather information is unavailable for this place")
        popupOpen();
    }

    // pop up window related 
    var popupEl = document.getElementById('popup');
    var popup = new Popup(popupEl, {
        width: 400,
        height: 500
    });

    function popupOpen(){
        popup.open();
    }

    function popupClose(){
        popup.close();
    }

    function popupBodyEditor(input){
        document.getElementsByClassName('popup-body')[0].innerHTML = input;
    }

    function popupTitleEditor(input){
        document.getElementById('popupTitle').innerHTML = input;
    }

    google.maps.event.addListener(marker,'dragend', popupOpen);
    google.maps.event.addListener(marker,'dragstart', popupClose);

    /* Init function might need to be added
    */
})();