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
                let length = geocodeData.results.length;

                // handling array length error 
                locationInfo = {
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
                getWeatherInfo(locationInfo.contryCode,locationInfo.region,locationInfo.city);

            } else {
                console.log("geocode api call is unsuccessful");
            }
        }
        request.send();

    }

    function getWeatherInfo(country,region,city){
        console.log("weather here");
    }

    // Get raw weather data using the coordinates making API call
    function getWeatherInfoOld(lat,long){
        // console.log("latitude is : " + lat);
        // console.log("longitude is : " + long);

        // var weatherAPIcall = "https://api.darksky.net/forecast/de424ca25621d294b676a6c59da57276/" + lat + "," + long;
        
        var weatherAPIcall = "http://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&long=" + long + "&APPID=90aa12ad410be3d7a5f9af4f1f7e53d1";

        var request = new XMLHttpRequest();
        var weatherData ="NA";
        request.open("GET", weatherAPIcall, true);
        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                // Successful request 
                console.log("successful request is made")
                weatherData = JSON.parse(request.responseText);
                console.log(request.responseText);
            } else {
                console.log("unsuccessful request is made")
                // Got an error from the server
            }
        };
        request.send();

        console.log(weatherData);

    }

})();