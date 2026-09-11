/**
 * Hardcoded sample dataset for buildings & parcels matching exact data contract requirement.
 * 
 * DATA CONTRACT SHAPE:
 * {
 *   "parcelId": string,
 *   "name": string (optional display label),
 *   "footprint": Array<[longitude: number, latitude: number]>, // Closed polygon (4+ points)
 *   "floors": Array<{
 *     "floorNumber": number,
 *     "height": number, // Height in meters
 *     "ulpin": string,  // Unique Land Parcel Identification Number
 *     "owner": string,
 *     "status": "registered" | "disputed" | "vacant"
 *   }>,
 *   "underground": {
 *     "levels": number,
 *     "ulpin": string,
 *     "type": string // e.g. "parking", "basement storage", "vault"
 *   }
 * }
 */

export const SAMPLE_BUILDINGS = [
  {
    parcelId: "UP-GZB-0001",
    name: "Raj Nagar Heights (Parcel UP-GZB-0001)",
    address: "Plot 14, Sector 10, Raj Nagar, Ghaziabad",
    district: "Ghaziabad, Uttar Pradesh",
    tehsil: "Ghaziabad Sadar",
    surveyDate: "2024-11-18",
    registrarOffice: "Sub-Registrar Office, Ghaziabad I",
    footprint: [
      [77.4500, 28.6600],
      [77.4510, 28.6600],
      [77.4510, 28.6610],
      [77.4500, 28.6610]
    ],
    floors: [
      {
        floorNumber: 1,
        height: 4.0,
        ulpin: "UP-GZB-0001-F1",
        owner: "Ramesh Kumar",
        status: "registered"
      },
      {
        floorNumber: 2,
        height: 3.5,
        ulpin: "UP-GZB-0001-F2",
        owner: "Sita Devi",
        status: "disputed"
      },
      {
        floorNumber: 3,
        height: 3.2,
        ulpin: "UP-GZB-0001-F3",
        owner: "Vikram Sharma",
        status: "registered"
      },
      {
        floorNumber: 4,
        height: 3.2,
        ulpin: "UP-GZB-0001-F4",
        owner: "Unallocated",
        status: "vacant"
      },
      {
        floorNumber: 5,
        height: 3.2,
        ulpin: "UP-GZB-0001-F5",
        owner: "Ananya Gupta",
        status: "disputed"
      }
    ],
    underground: {
      levels: 2,
      ulpin: "UP-GZB-0001-UG1",
      type: "Automated Underground Parking & Utilities"
    }
  },
  {
    parcelId: "UP-NOI-0002",
    name: "Cyber Park Tower B (Parcel UP-NOI-0002)",
    address: "Block B, Tech Zone 4, Noida",
    district: "Gautam Buddha Nagar, Uttar Pradesh",
    tehsil: "Dadri",
    surveyDate: "2025-02-03",
    registrarOffice: "Sub-Registrar Office, Noida II",
    footprint: [
      [77.4520, 28.6620],
      [77.4535, 28.6620],
      [77.4535, 28.6632],
      [77.4520, 28.6632]
    ],
    floors: [
      {
        floorNumber: 1,
        height: 4.5,
        ulpin: "UP-NOI-0002-F1",
        owner: "Apex Retail Pvt Ltd",
        status: "registered"
      },
      {
        floorNumber: 2,
        height: 3.8,
        ulpin: "UP-NOI-0002-F2",
        owner: "Infotech Solutions Inc",
        status: "registered"
      },
      {
        floorNumber: 3,
        height: 3.8,
        ulpin: "UP-NOI-0002-F3",
        owner: "Metro Builders Co.",
        status: "disputed"
      },
      {
        floorNumber: 4,
        height: 3.8,
        ulpin: "UP-NOI-0002-F4",
        owner: "CloudNine Technologies",
        status: "registered"
      }
    ],
    underground: {
      levels: 1,
      ulpin: "UP-NOI-0002-UG1",
      type: "Basement Vault & Mechanical Server Room"
    }
  },
  {
    parcelId: "DL-NDLS-0003",
    name: "Connaught View Complex (Parcel DL-NDLS-0003)",
    address: "Inner Circle, Connaught Place, New Delhi",
    district: "New Delhi",
    tehsil: "Connaught Place",
    surveyDate: "2024-08-27",
    registrarOffice: "Sub-Registrar Office, New Delhi IV",
    footprint: [
      [77.4480, 28.6580],
      [77.4495, 28.6580],
      [77.4495, 28.6592],
      [77.4480, 28.6592]
    ],
    floors: [
      {
        floorNumber: 1,
        height: 4.2,
        ulpin: "DL-NDLS-0003-F1",
        owner: "Heritage Commercial Trust",
        status: "registered"
      },
      {
        floorNumber: 2,
        height: 3.6,
        ulpin: "DL-NDLS-0003-F2",
        owner: "Kavita Roy",
        status: "vacant"
      },
      {
        floorNumber: 3,
        height: 3.6,
        ulpin: "DL-NDLS-0003-F3",
        owner: "Sunil & Brothers Enterprises",
        status: "disputed"
      }
    ],
    underground: {
      levels: 1,
      ulpin: "DL-NDLS-0003-UG1",
      type: "Sub-Level Logistics & Storage Facility"
    }
  }
];

export default SAMPLE_BUILDINGS;
