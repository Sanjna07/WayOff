const crypto = require('crypto');
const pool = require('../config/db');

// Create a new room with 3D PostGIS geometry
const makeUlpin = async (req, res) => {
    try {
        const { lat, lng, floorLvl, baseElev, ceilHt, isPublic, name, buildingId } = req.body;

        const rawStr = `${lat}-${lng}-${floorLvl}-${baseElev}-${ceilHt}`;
        const hasher = crypto.createHash('sha256');
        hasher.update(rawStr);
        const fullHash = hasher.digest('hex');
        const finalId = fullHash.substring(0, 14).toUpperCase();
        
        // We will create a small box footprint around the lat/lng center.
        // Approx 10x10 meters. 1 degree is roughly 111,111 meters.
        // 10 meters is approx 0.00009 degrees
        const offset = 0.000045;
        const minLng = parseFloat(lng) - offset;
        const maxLng = parseFloat(lng) + offset;
        const minLat = parseFloat(lat) - offset;
        const maxLat = parseFloat(lat) + offset;

        const insertQuery = `
            INSERT INTO rooms (ulpin, latitude, longitude, floor_level, base_elevation, ceiling_height, is_public, name, building_id, geom)
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9,
                ST_Extrude(
                    ST_MakeEnvelope($10, $11, $12, $13, 4326),
                    0, 0, $14
                )
            )
            RETURNING ulpin, latitude, longitude, floor_level, base_elevation, ceiling_height, is_public, name, building_id;
        `;
        // Extrude height is ceilHt - baseElev, but wait: 
        // ST_Extrude signature is ST_Extrude(geometry, x, y, z).
        // If we only extrude Z, we pass 0, 0, (ceilHt - baseElev)
        const extrudeZ = parseFloat(ceilHt) - parseFloat(baseElev);
        
        const values = [
            finalId, lat, lng, floorLvl, baseElev, ceilHt, 
            isPublic || false, name || 'Room', buildingId || 'UNKNOWN',
            minLng, minLat, maxLng, maxLat,
            extrudeZ
        ];
        
        const dbResult = await pool.query(insertQuery, values);
        
        res.status(200).json({
            success: true,
            message: "Room permanently saved to database!",
            savedRoom: dbResult.rows[0]
        });
        
    } catch (error) {
        console.error("Database Error:", error);
        if (error.code === '23505') {
            return res.status(409).json({ success: false, message: "A room with this ID already exists." });
        }
        res.status(500).json({ success: false, message: "Failed to generate or save ID" });
    }
};

// Get all rooms, optionally filter by building_id
const getRooms = async (req, res) => {
    try {
        const { building_id } = req.query;
        let query = `
            SELECT id, ulpin, latitude, longitude, floor_level, base_elevation, ceiling_height, is_public, name, building_id, 
            ST_AsGeoJSON(geom) as geometry 
            FROM rooms
        `;
        let values = [];

        if (building_id) {
            query += ` WHERE building_id = $1`;
            values.push(building_id);
        }

        const result = await pool.query(query, values);

        res.status(200).json({
            success: true,
            count: result.rowCount,
            data: result.rows
        });
    } catch (error) {
        console.error("Error fetching rooms:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { makeUlpin, getRooms };
