
      // mainPlace is the initial location of the map
      var mainPlace = { lat: 22.283, lng: 114.17, zoom: 12, name: "Hong Kong" };

      // otherPlaces contains other locations in and around the initial location. We will set markers to these places
      var otherPlaces = [
                          { name: "Victoria's Peak", lat: 22.275, lng: 114.147, term: "Victoria's Peak Hong Kong" },
                          { name: "Hong Kong Disneyland", lat: 22.311, lng: 114.042, term: "Disneyland" },
                          { name: "McDonald's", lat: 22.281, lng: 114.177, term: "McDonald's Restaurant" },
                          { name: "KFC", lat: 22.280, lng: 114.178, term: "Kentucky Fried Chicken" },
                          { name: "Hong Kong International Airport", lat: 22.308, lng: 113.922 },
                          { name: "International Finance Center", lat: 22.286, lng: 114.160, term: "International Finance Center Hong Kong" }
                        ];

      // API urls and placeholder text in info-windows
      var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=SEARCHTERM&format=json&callback=wikiCallback';
      var wikiPlaceholder = 'Retrieving Wikipedia links...';

      var nytimesUrl = 'http://api.nytimes.com/svc/search/v2/articlesearch.json?q=SEARCHTERM&sort=newest&api-key=5523c9884485f5cd674bde70c977397a:10:72302772';
      var nytimesPlaceholder = 'Retrieving NY Times articles...';

      var map;  // Stores our Google Map
      var markers = []; // Stores our markers in use on the map
      var infowin; // Stores our infowindow

      var numOfPlaces = otherPlaces.length; // Stores number of places in our otherPlaces object array
