// Get target container
const container = document.getElementById('container')

// Init CUBE instance
const C = new CUBE.Space(container, {
    background: "333333", // Set Background Color
    center: {latitude: 13.35598636764411, longitude: 52.59689384531339}, // Set a geo location center
    scale: .002, // Set a map scale
    camera:{
        position: {x: 5, y: 5, z: 5} // Set camera default position
    }
})

// Add a basic box with wgs84 coordinate


// Add Geojson Map Layer
const berlin = '../assets/planung_conv.geojson';
fetch(berlin).then(async (res)=>{
    C.Add(new CUBE.GeoLayer("china", await res.json()).AdministrativeMap({border: true, height: .01}))
})



// Animate scene every frame
Update()
function Update(){
    requestAnimationFrame(Update)
    C.Runtime()
}
