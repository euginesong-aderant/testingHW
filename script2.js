var myLatlng = new google.maps.LatLng(-25.363882,131.044922);
var mapOptions = {
  zoom: 4,
  center: myLatlng
}
var map = new google.maps.Map(document.getElementById("map"), mapOptions);

// Place a draggable marker on the map
var marker = new google.maps.Marker({
    position: myLatlng,
    map: map,
    draggable:true,
    title:"Drag me!"
});

google.maps.event.addListener(marker, 'dragend', function(marker){
    console.log("it is moved");
    console.log(marker.getPosition());
})