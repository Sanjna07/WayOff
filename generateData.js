const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

function makeUlpin(lat, lng, floorLvl, baseElev, ceilHt) {
    const rawStr = `${lat}-${lng}-${floorLvl}-${baseElev}-${ceilHt}`;
    const hasher = crypto.createHash('sha256');
    hasher.update(rawStr);
    const fullHash = hasher.digest('hex');
    return fullHash.substring(0, 14).toUpperCase();
}

// Map real-world base coordinates (Connaught Place area)
const baseLat = 28.6304;
const baseLng = 77.2177;

// Generate 3 Public Buildings
const publicBuildings = [
    {
        parcelId: "PUB-TOWN-01",
        name: "City Town Hall",
        address: "1 Central Plaza, New Delhi",
        type: "town_hall",
        isPublic: true,
        scenePosition: { x: -15, z: -14 },
        lat: baseLat + 0.001,
        lng: baseLng - 0.001,
        floors: [
            { floorNumber: 1, height: 4.5, owner: "Public Services & Information", status: "registered" },
            { floorNumber: 2, height: 4.0, owner: "Mayor's Office & Administration", status: "registered" },
            { floorNumber: 3, height: 4.0, owner: "City Council Chambers", status: "registered" }
        ]
    },
    {
        parcelId: "PUB-RAIL-01",
        name: "Central Railway Station",
        address: "Railway Station Road, New Delhi",
        type: "railway",
        isPublic: true,
        // Moved to the far edge (x: 40, z: -10)
        scenePosition: { x: 40, z: -10 },
        lat: baseLat + 0.001,
        lng: baseLng + 0.001,
        floors: [
            { floorNumber: 1, height: 5.0, owner: "Main Concourse & Ticketing", status: "registered" },
            { floorNumber: 2, height: 4.5, owner: "Waiting Lounges & Food Court", status: "registered" }
        ]
    },
    {
        parcelId: "PUB-PARK-01",
        name: "Central Green Park",
        address: "Park Avenue, New Delhi",
        type: "park",
        isPublic: true,
        // Moved park away from roads
        scenePosition: { x: -15, z: 15 },
        lat: baseLat - 0.001,
        lng: baseLng - 0.001,
        floors: [
            { floorNumber: 1, height: 0.5, owner: "Public Grounds", status: "registered" }
        ]
    }
];

// Generate ~13 Private Buildings in designated blocks (avoiding roads at x=0, z=0)
// Blocks are roughly: NW (-45..-5, -45..-5), NE (5..45, -45..-5), SW (-45..-5, 5..45), SE (5..45, 5..45)
const privateData = [
  // NW Block
  { x:-30, z:-25, w:12, h:35, d:12, style: 'skyscraper' },
  { x:-12, z:-25, w:8,  h:12, d:8,  style: 'residential' },
  { x:-30, z:-10, w:15, h:8,  d:10, style: 'mall' },
  { x:-12, z:-10, w:8,  h:20, d:8,  style: 'commercial' },
  
  // NE Block (mostly station and tracks at x > 30, so keep within 5..25)
  { x:12,  z:-25, w:8,  h:25, d:8,  style: 'commercial' },
  { x:25,  z:-25, w:10, h:15, d:10, style: 'residential' },
  { x:15,  z:-10, w:12, h:10, d:12, style: 'mall' },
  
  // SW Block
  { x:-35, z:15,  w:10, h:18, d:10, style: 'residential' },
  { x:-35, z:30,  w:8,  h:22, d:8,  style: 'commercial' },
  { x:-15, z:30,  w:12, h:12, d:12, style: 'residential' },
  
  // SE Block
  { x:15,  z:15,  w:14, h:30, d:14, style: 'skyscraper' },
  { x:30,  z:15,  w:10, h:14, d:10, style: 'residential' },
  { x:20,  z:30,  w:18, h:10, d:12, style: 'mall' }
];

const privateTypes = [
    { type: 'commercial', name: 'Apex Tech Tower', color: '#1e293b', ownerPre: 'Office Suite' },
    { type: 'residential', name: 'Sunrise Apartments', color: '#fef3c7', ownerPre: 'Apt' },
    { type: 'commercial', name: 'Global Trade Center', color: '#e2e8f0', ownerPre: 'Corporate Office' },
    { type: 'commercial', name: 'Horizon Business Park', color: '#e5e7eb', ownerPre: 'Office Unit' },
    
    { type: 'hospital', name: 'City Care Hospital', color: '#e0f2fe', ownerPre: 'Medical Wing' },
    { type: 'residential', name: 'Lakeview Condos', color: '#ffedd5', ownerPre: 'Condo' },
    { type: 'commercial', name: 'Nexus Shopping Mall', color: '#f3e8ff', ownerPre: 'Retail Store' },
    
    { type: 'residential', name: 'Oakwood Residences', color: '#ecfccb', ownerPre: 'Flat' },
    { type: 'school', name: 'Highland Public School', color: '#fef08a', ownerPre: 'Classrooms' },
    { type: 'residential', name: 'Skyline Lofts', color: '#f8fafc', ownerPre: 'Loft' },
    
    { type: 'commercial', name: 'Metro Plaza', color: '#ffedd5', ownerPre: 'Commercial Space' },
    { type: 'fire_station', name: 'Central Fire Station', color: '#fee2e2', ownerPre: 'Engine Bay' },
    { type: 'police_station', name: 'City Police Headquarters', color: '#dbeafe', ownerPre: 'Precinct' }
];

const privateBuildings = privateData.map((pos, i) => {
    const t = privateTypes[i];
    const numFloors = Math.floor(pos.h / 3.5); // Approx 3.5m per floor
    const floors = [];
    
    for(let f=1; f<=numFloors; f++) {
        const isVacant = Math.random() > 0.8;
        floors.push({
            floorNumber: f,
            height: 3.5,
            owner: isVacant ? "Looking for rent" : `${t.ownerPre} ${f}${String.fromCharCode(64 + (Math.floor(Math.random()*4)+1))}`,
            status: isVacant ? "vacant" : "registered"
        });
    }

    return {
        parcelId: `PRV-${1000 + i}`,
        name: t.name,
        address: `Plot ${i+1}, Tech Zone, New Delhi`,
        type: t.type,
        isPublic: false,
        scenePosition: { x: pos.x, z: pos.z, w: pos.w, d: pos.d, h: pos.h },
        style: pos.style,
        color: t.color,
        lat: baseLat + (pos.x * 0.0001),
        lng: baseLng + (pos.z * 0.0001),
        floors
    };
});

const allBuildings = [...publicBuildings, ...privateBuildings];

// Generate ULPINs
allBuildings.forEach(b => {
    let currentElev = 0;
    b.floors.forEach(f => {
        // lat, lng, floorLvl, baseElev, ceilHt
        f.ulpin = makeUlpin(b.lat, b.lng, f.floorNumber, currentElev, currentElev + f.height);
        currentElev += f.height;
    });
});

const fileContent = `/**
 * Generated Dataset with ULPIN hashing logic.
 */

export const SAMPLE_BUILDINGS = ${JSON.stringify(allBuildings, null, 2)};

export default SAMPLE_BUILDINGS;
`;

fs.writeFileSync(path.join(__dirname, 'frontend', 'src', 'data', 'sampleBuildings.js'), fileContent);
console.log("sampleBuildings.js successfully generated with SHA-256 ULPINs.");
