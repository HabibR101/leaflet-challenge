// Select which data to use: all day / all week / all month
let URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson'; // all week

// Tectonic plates URL
let platesURL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

// Load in GeoJSON data
d3.json(URL).then(response => {
  createFeatures(response.features);
});

// Create Features function to initiate Popups and Markers
function createFeatures(earthquakeData) {
  function onEachFeature(feature, layer) {
    layer.bindPopup(`<h3>${feature.properties.title}</h3>\
            <hr>Magnitude: ${feature.properties.mag}<hr>\
            Depth: ${feature.geometry.coordinates[2]}`);
  }

  // Get min and max Depth values for plotting circles
  let minDepth = Math.min(...earthquakeData.map(data => data.geometry.coordinates[2]));
  let maxDepth = Math.max(...earthquakeData.map(data => data.geometry.coordinates[2]));

  console.log("Min Depth is: ", minDepth, "Max Depth is: ", maxDepth);

  let earthquakes = L.geoJSON(earthquakeData, {
    onEachFeature: onEachFeature,
    pointToLayer: function (feature, latlng) {
      let magScale = feature.properties.mag * 2;
      let depthScale = feature.geometry.coordinates[2];
      let markerColor = getColor(depthScale);

      return L.circleMarker(latlng, {
        radius: magScale,
        color: markerColor,
        fillColor: markerColor,
        fillOpacity: 0.75,
      });
    },
  });

  createMap(earthquakes);
}

// Define color ranges based on depth
function getColor(depth) {
  let colorRanges = {
    "-1": "#4CAF50", // Green
    "0-19": "#8BC34A", // Light Green
    "20-39": "#FFC107", // Amber
    "40-59": "#FF5722", // Deep Orange
    "60-79": "#FF9800", // Orange
    "80-99": "#FF5733", // Tomato
    "100+": "#D32F2F", // Dark Red
  };

  for (let range in colorRanges) {
    let [min, max] = range.split('-').map(Number);
    if ((max && depth >= min && depth <= max) || (!max && depth >= min)) {
      return colorRanges[range];
    }
  }

  return "#8B0000"; // Default color for values over 100
}

// Define createMap function
function createMap(earthquakes) {
  d3.json(platesURL).then(response => {
    let plates = L.geoJSON(response.features);

    let street = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    );

    let topo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    });

    let satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      }
    );

    let terrain = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS',
      maxZoom: 13
    });

    let baseMaps = {
      "Street Map": street,
      "Topographic Map": topo,
      "Satellite" : satellite,
      "Terrain" : terrain
    };

    let overlayMaps = {
      Earthquakes: earthquakes,
      Plates: plates,
    };

    let centerGlobe = [30, 31];
    let myMap = L.map("map", {
      center: centerGlobe,
      zoom: 3,
      layers: [street, earthquakes],
    });

    L.control.layers(baseMaps, overlayMaps, {
      collapsed: false,
    }).addTo(myMap);

    let legend = L.control({ position: "bottomright" });
    let legendInfo = {
      "Less than 0": "#4CAF50", // GREEN
      "0-19": "#8BC34A", // LIME
      "20-39": "#FFC107", // YELLOW
      "40-59": "#FF5722", // ORANGE
      "60-79": "#FF9800", // ORANGE RED
      "80-99": "#FF5733", // RED
      "100+": "#D32F2F", // DARK RED
    };

    legend.onAdd = function () {
      let div = L.DomUtil.create("div", "legend-item");

      div.innerHTML = [
        "<h3>Earthquake Depth (m)</h3><hr>",
        ...Object.entries(legendInfo).map(([key, value]) => {
          return `<i style="background:${value}"></i><b>${key}</b><br>`;
        }),
      ].join("");

      return div;
    };

    legend.addTo(myMap);
  });
}
