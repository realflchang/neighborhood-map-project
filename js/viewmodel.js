      "use strict";

      var vm = function() {
        var self = this;

        self.mapInput = ko.observable(); // Binds to input text field
        self.keyLocArray = ko.observableArray(otherPlaces); // Binds to array containing Key Locations (Other Places)

        var marker; // Each marker object: Google Map Marker and InfoWindow data
        for (var i = 0; i < numOfPlaces; i++) {
          marker = getMarker(self.keyLocArray()[i]);
          markers[i] = marker;
          self.keyLocArray()[i].j = i;
          self.keyLocArray()[i].visible = ko.observable(true);
          self.keyLocArray()[i].marker = ko.observable(marker);
        }

        // Calls when user click on a key location in list-view, and moves map to place
        self.moveToLoc = function(placeObj) {
          clickedOnMarker(placeObj);  // Moves map to center of place
        };

        // Calls when user enters text in input field. Will then filter Key Locations list and reset markers
        self.filterLocs = function() {
          var i;

          // Remove initial markers on map
          if (markers.length > 0) {
            for (i = 0; i < markers.length; i++) {
              markers[i].marker.setMap(null);
            }
          }

          // If each list item has a matching substring from input (case insensitive), make it visible. Otherwise hide it.
          for (i = 0; i < numOfPlaces; i++) {
            if (self.keyLocArray()[i].name.toUpperCase().indexOf(self.mapInput().toUpperCase()) >= 0) {
              self.keyLocArray()[i].visible(true); // Allow key location to appear
              markers[i].marker.setMap(map); // Allow marker to appear on map
            }
            else {
              self.keyLocArray()[i].visible(false); // Otherwise hide the key location
            }
          }
        };

      };

      ko.applyBindings(new vm());


      // Initialize once Google map has finish loading
      function initialize() {

        // Offline detection on index.html every 5 seconds. Shows a message to user if offline
        Offline.options = {checks: {xhr: {url: 'index.html'}}};
        var run = function(){
          if (Offline.state === 'up')
            Offline.check();
          }
        setInterval(run, 5000);

        // Define map options, based on mainPlace object
        var mapOptions = {
          center: mainPlace,
          zoom: mainPlace.zoom
        };

        // Create our map
        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

        // Add initial markers on map
        for (var i = 0; i < numOfPlaces; i++) {
          addMarker(otherPlaces[i], i);
        }

        // Initialize our infoWindow
        infowin = new google.maps.InfoWindow();

      }
      google.maps.event.addDomListener(window, 'load', initialize);


      // Returns google map LatLng object from a place's latitude and longitude
      function getGMLatLng(placeObj) {
        return new google.maps.LatLng(placeObj.lat, placeObj.lng);
      }


      // Returns marker object from a place object
      function getMarker(placeObj) {
        var location = getGMLatLng(placeObj);
        var name = placeObj.name;

        var marker = new google.maps.Marker({
          position: location,
          title: name
        });

        return marker;
      }


      // Adds initial marker and infowindow to the map
      function addMarker(placeObj, i) {
        var location = getGMLatLng(placeObj);
        var name = placeObj.name;

        // Create marker object
        var marker = new google.maps.Marker({
          position: location,
          map: map,
          title: name
        });

        // Create basic infowindow content for this marker
        placeObj.infowin = '<b>' + otherPlaces[i].name + '</b>' + '<br><div class="wikiajax">' + wikiPlaceholder + '</div><br><div class="nytimesajax">' + nytimesPlaceholder + '</div>';

        // Set time limit to get info from Wiki API
        otherPlaces[i].wikiRequestTimeout = setTimeout(function(){
          placeObj.infowin = placeObj.infowin.replace(wikiPlaceholder, 'Sorry, could not get Wikipedia resources for '+otherPlaces[i].name);
        }, 8000);

        // Set time limit to get info from NY Times API
        otherPlaces[i].nytimesRequestTimeout = setTimeout(function(){
          placeObj.infowin = placeObj.infowin.replace(nytimesPlaceholder, 'Sorry, could not get NY Times articles for '+otherPlaces[i].name);
        }, 8000);


        // Validate search term. If place object has no term property, use the name
        if (!otherPlaces[i].term) {
          otherPlaces[i].term = otherPlaces[i].name;
        }

        // Retrieve Wikipedia Info for InfoWindow
        var wikiLoc = wikiUrl;
        wikiLoc = wikiLoc.replace("SEARCHTERM", otherPlaces[i].term);
        addWikiInfo(wikiLoc, otherPlaces[i]);

        // Retrieve NY Times Info for InfoWindow
        var nytimesLoc = nytimesUrl;
        nytimesLoc = nytimesLoc.replace("SEARCHTERM", otherPlaces[i].term);
        addNYTimesInfo(nytimesLoc, otherPlaces[i]);

        // Add marker to markers array. Allows for optional revisions to markers object array
        markers[i] = { marker: marker };

        // Enable click event to marker
        google.maps.event.addListener(markers[i].marker, 'click', function() {
          clickedOnMarker(otherPlaces[i]);
        });
      }


      // Calls when user clicks on marker in the map. Stop all marker animation, then animate the one clicked marker. Then open its infowindow.
      function clickedOnMarker(placeObj) {
        map.setCenter(getGMLatLng(placeObj));

        for (var i = 0; i < markers.length; i++) {
          markers[i].marker.setMap(null);
          if (otherPlaces[i].visible() === true) {
            markers[i].marker.setMap(map);
          }
          markers[i].marker.setAnimation(null);
        }
        markers[placeObj.j].marker.setAnimation(google.maps.Animation.BOUNCE);
        infowin.setContent(placeObj.infowin);
        infowin.open(map, markers[placeObj.j].marker);
      }

      // Wiki Ajax function. Runs ajax query, and populate infowindow when there is new data
      function addWikiInfo(wikiUrl, placeObj) {
        var output = "";

        $.ajax({
            url: wikiUrl,
            dataType: "jsonp",
            success: function( response ) {
              var articleList = response[1];
              var articleStr;

              for (var i = 0; i < articleList.length; i++) {
                articleStr = articleList[i];
                var url = 'http://en.wikipedia.org/wiki/' + articleStr;
                output += '<li><a href="' + url + '" target="info">' + articleStr + '</a></li>';
              }
              clearTimeout(placeObj.wikiRequestTimeout);  // Found data, so we can clear timeout
              if (!output) {
                output = "(No Wikipedia articles found)";
              }
              else {
                output = "Wikipedia Links:<br>" + output;
              }
              placeObj.infowin = placeObj.infowin.replace(wikiPlaceholder, output); // Replace placeholder with Wiki results
            },
            error: function( response, textstatus, errorthrown ) {
              output = "There is an error retrieving Wiki: " + textstatus + ".";
              placeObj.infowin = placeObj.infowin.replace(wikiPlaceholder, output); // Replace placeholder with Wiki results
            }
        });

      }


      // NYTimes Ajax function. Runs json query, and populate infowindow when there is new data
      function addNYTimesInfo(nytimesLoc, placeObj) {
        var output = "";

        $.getJSON(nytimesLoc, function(data){
            var articles = data.response.docs;
            for (var i = 0; i < articles.length; i++) {
              var article = articles[i];
              output += '<li class="article">'+
                  '<a href="'+article.web_url+'" target="info">'+article.headline.main+'</a>'+
                  '<p>' + article.snippet + '</p>'+
              '</li>';
            }
            if (!output) {
              output = "(No NY Times articles found)";
            }
            else {
              output = "NY Times Related Articles:<br>" + output;
            }
            placeObj.infowin = placeObj.infowin.replace(nytimesPlaceholder, output);

            clearTimeout(placeObj.nytimesRequestTimeout);  // Found data, so we can clear timeout
        }).fail(function(e, textstatus, error){
            output = "There is an error retrieving NY Times articles: " + textstatus + ", " + error;
            placeObj.infowin = placeObj.infowin.replace(nytimesPlaceholder, output);
            clearTimeout(placeObj.nytimesRequestTimeout);
        });
      }

