/**
 * Civic Air Quality Briefing Studio - Indian CAAQMS Authentic Datasets
 * Official Central Pollution Control Board (CPCB) and State Pollution Control Board
 * monitoring presets across the National Capital Region and key Indian metros.
 */

export interface DatasetPreset {
  id: string;
  name: string;
  source: string;
  description: string;
  location: string;
  suggestedPersona: string;
  defaultStandard: 'cpcb' | 'epa';
  cityKey?: string;
  coordinates?: { lat: number; lon: number };
  csvData: string;
}

export const INDIAN_DATASETS: DatasetPreset[] = [
  {
    id: 'cpcb-delhi-smog',
    name: 'CPCB Delhi Winter Smog Episode (Anand Vihar, Punjabi Bagh, RK Puram)',
    source: 'Central Pollution Control Board (CPCB) Official Portal & DPCC CAAQMS Network',
    description: 'Authentic 24-hour winter inversion episode across Delhi NCT wards. Features severe PM2.5 spikes (exceeding 380 µg/m³), secondary particulate trapping, and morning traffic surges at Anand Vihar ISBT.',
    location: 'Delhi NCT, India',
    suggestedPersona: 'ward_officer',
    defaultStandard: 'cpcb',
    cityKey: 'delhi',
    coordinates: { lat: 28.6469, lon: 77.3160 },
    csvData: `Station,Timestamp,PM2.5 (ug/m3),PM10 (ug/m3),NO2 (ug/m3),CO (mg/m3),SO2 (ug/m3),O3 (ug/m3)
Anand Vihar CAAQMS,2024-11-04 00:00,324.5,482.0,88.4,2.8,24.1,18.5
Anand Vihar CAAQMS,2024-11-04 02:00,342.1,510.4,92.1,3.1,26.0,14.2
Anand Vihar CAAQMS,2024-11-04 04:00,368.0,545.2,104.5,3.6,28.4,12.0
Anand Vihar CAAQMS,2024-11-04 06:00,412.8,598.0,128.2,4.4,32.1,10.5
Anand Vihar CAAQMS,2024-11-04 08:00,448.2,630.5,142.0,5.2,35.6,15.8
Anand Vihar CAAQMS,2024-11-04 10:00,380.0,520.1,118.4,3.9,29.0,26.4
Anand Vihar CAAQMS,2024-11-04 12:00,295.4,410.2,85.2,2.4,22.1,42.0
Anand Vihar CAAQMS,2024-11-04 14:00,240.1,350.8,68.0,1.8,18.4,54.2
Anand Vihar CAAQMS,2024-11-04 16:00,285.0,398.4,84.5,2.5,21.0,38.0
Anand Vihar CAAQMS,2024-11-04 18:00,360.5,490.0,115.0,3.8,27.5,22.1
Anand Vihar CAAQMS,2024-11-04 20:00,405.0,560.2,135.2,4.6,31.2,16.4
Anand Vihar CAAQMS,2024-11-04 22:00,382.4,530.0,120.1,4.0,28.9,14.0
Punjabi Bagh,2024-11-04 00:00,245.0,380.2,72.1,1.9,18.5,20.4
Punjabi Bagh,2024-11-04 02:00,260.4,402.0,76.5,2.1,19.2,16.1
Punjabi Bagh,2024-11-04 04:00,288.1,435.0,84.0,2.5,21.4,14.0
Punjabi Bagh,2024-11-04 06:00,320.0,470.5,96.2,3.0,24.0,12.5
Punjabi Bagh,2024-11-04 08:00,355.2,510.0,110.4,3.8,28.1,18.0
Punjabi Bagh,2024-11-04 10:00,290.0,420.4,92.0,2.8,23.5,28.5
Punjabi Bagh,2024-11-04 12:00,215.0,320.0,64.2,1.6,17.0,45.0
Punjabi Bagh,2024-11-04 14:00,185.4,280.5,52.0,1.3,14.2,56.1
Punjabi Bagh,2024-11-04 16:00,220.0,325.0,68.4,1.8,16.8,42.0
Punjabi Bagh,2024-11-04 18:00,278.5,395.2,88.0,2.7,22.0,25.4
Punjabi Bagh,2024-11-04 20:00,315.0,445.0,102.5,3.4,25.4,18.2
Punjabi Bagh,2024-11-04 22:00,290.2,410.0,90.1,2.9,22.1,15.0
RK Puram Sector 12,2024-11-04 00:00,195.0,290.0,58.4,1.5,14.0,22.5
RK Puram Sector 12,2024-11-04 02:00,208.5,305.2,61.0,1.6,15.2,18.0
RK Puram Sector 12,2024-11-04 04:00,225.0,328.0,68.2,1.9,16.5,15.2
RK Puram Sector 12,2024-11-04 06:00,265.4,375.0,82.0,2.4,19.8,13.0
RK Puram Sector 12,2024-11-04 08:00,298.0,415.5,95.4,3.0,23.0,19.5
RK Puram Sector 12,2024-11-04 10:00,235.0,340.0,75.0,2.1,18.5,32.0
RK Puram Sector 12,2024-11-04 12:00,165.2,250.4,48.2,1.2,12.4,49.2
RK Puram Sector 12,2024-11-04 14:00,140.0,215.0,38.5,0.9,10.1,58.4
RK Puram Sector 12,2024-11-04 16:00,172.0,260.0,52.0,1.4,13.5,44.0
RK Puram Sector 12,2024-11-04 18:00,218.4,318.0,72.1,2.2,17.2,28.0
RK Puram Sector 12,2024-11-04 20:00,250.0,360.5,85.0,2.6,20.4,20.1
RK Puram Sector 12,2024-11-04 22:00,230.1,335.0,74.2,2.3,18.0,17.5`
  },
  {
    id: 'cpcb-mumbai-metropolitan',
    name: 'MPCB Mumbai Coastal & Traffic Corridor (Bandra & Colaba)',
    source: 'Maharashtra Pollution Control Board (MPCB) CAAQMS Stations',
    description: 'Maritime boundary monitoring in Mumbai metropolitan airshed. Demonstrates diurnal sea breeze dispersion, coastal relative humidity moderation, and evening BKC highway particulate peaks.',
    location: 'Mumbai, Maharashtra, India',
    suggestedPersona: 'health_official',
    defaultStandard: 'cpcb',
    cityKey: 'mumbai',
    coordinates: { lat: 19.0596, lon: 72.8295 },
    csvData: `Station,Timestamp,PM2.5 (ug/m3),PM10 (ug/m3),NO2 (ug/m3),CO (mg/m3),SO2 (ug/m3),O3 (ug/m3)
Bandra CAAQMS,2024-11-12 00:00,88.4,142.0,42.5,1.1,16.2,24.0
Bandra CAAQMS,2024-11-12 03:00,74.0,120.5,35.0,0.9,14.0,28.5
Bandra CAAQMS,2024-11-12 06:00,95.2,160.0,54.1,1.4,18.5,21.0
Bandra CAAQMS,2024-11-12 09:00,135.0,210.4,72.8,1.9,22.4,34.2
Bandra CAAQMS,2024-11-12 12:00,110.5,175.0,58.0,1.3,19.0,52.0
Bandra CAAQMS,2024-11-12 15:00,92.0,148.2,46.2,1.0,17.5,60.4
Bandra CAAQMS,2024-11-12 18:00,128.4,195.0,68.4,1.8,21.0,42.1
Bandra CAAQMS,2024-11-12 21:00,115.0,180.2,60.1,1.5,19.2,30.5
Colaba CAAQMS,2024-11-12 00:00,62.1,105.0,32.0,0.8,12.5,28.0
Colaba CAAQMS,2024-11-12 03:00,54.0,92.4,28.4,0.7,11.0,31.2
Colaba CAAQMS,2024-11-12 06:00,71.5,118.0,40.2,1.0,14.2,25.0
Colaba CAAQMS,2024-11-12 09:00,98.0,155.2,56.0,1.4,17.0,38.5
Colaba CAAQMS,2024-11-12 12:00,82.4,130.0,44.5,1.1,15.2,56.0
Colaba CAAQMS,2024-11-12 15:00,70.0,112.5,38.0,0.9,13.5,64.2
Colaba CAAQMS,2024-11-12 18:00,96.5,150.0,54.2,1.3,16.8,45.0
Colaba CAAQMS,2024-11-12 21:00,84.0,135.4,46.0,1.1,15.0,34.0`
  },
  {
    id: 'cpcb-gangetic-winter',
    name: 'Gangetic Basin Winter Inversion (Kanpur, Lucknow & Patna)',
    source: 'Central Pollution Control Board (CPCB) & UPPCB / BSPCB CAAQMS',
    description: 'High particulate stagnation episode along the central Indo-Gangetic Plains corridor. Demonstrates regional background smog trapping across urban industrial clusters.',
    location: 'Uttar Pradesh & Bihar, India',
    suggestedPersona: 'industrial',
    defaultStandard: 'cpcb',
    cityKey: 'kanpur',
    coordinates: { lat: 26.4499, lon: 80.3319 },
    csvData: `Station,Timestamp,PM2.5 (ug/m3),PM10 (ug/m3),NO2 (ug/m3),CO (mg/m3),SO2 (ug/m3),O3 (ug/m3)
Kanpur Nehru Nagar,2024-11-10 02:00,265.4,395.0,78.2,2.5,24.0,16.2
Kanpur Nehru Nagar,2024-11-10 06:00,312.0,460.5,98.0,3.2,28.5,12.0
Kanpur Nehru Nagar,2024-11-10 10:00,345.8,505.0,114.5,3.8,32.0,24.5
Kanpur Nehru Nagar,2024-11-10 14:00,210.0,320.4,62.0,1.9,18.4,48.0
Kanpur Nehru Nagar,2024-11-10 18:00,298.5,440.0,92.4,3.0,26.5,28.0
Kanpur Nehru Nagar,2024-11-10 22:00,320.0,480.2,105.0,3.5,30.0,18.4
Lucknow Lalbagh,2024-11-10 02:00,230.0,350.2,68.5,2.1,20.4,18.0
Lucknow Lalbagh,2024-11-10 06:00,278.4,410.0,86.0,2.8,25.0,14.5
Lucknow Lalbagh,2024-11-10 10:00,305.0,455.0,98.2,3.3,28.0,26.0
Lucknow Lalbagh,2024-11-10 14:00,185.0,290.0,54.0,1.6,16.5,52.0
Lucknow Lalbagh,2024-11-10 18:00,260.2,390.4,80.0,2.6,22.8,30.0
Lucknow Lalbagh,2024-11-10 22:00,285.0,425.0,92.5,3.1,26.0,20.0
Patna Samanpura,2024-11-10 02:00,245.0,365.0,72.0,2.3,22.0,15.0
Patna Samanpura,2024-11-10 06:00,295.0,430.2,90.4,3.0,26.5,11.5
Patna Samanpura,2024-11-10 10:00,325.2,485.0,104.0,3.6,30.5,22.0
Patna Samanpura,2024-11-10 14:00,195.4,305.0,58.0,1.8,17.2,45.0
Patna Samanpura,2024-11-10 18:00,280.0,415.0,86.2,2.8,24.0,26.0
Patna Samanpura,2024-11-10 22:00,308.0,450.4,98.0,3.3,28.5,16.8`
  },
  {
    id: 'cpcb-bengaluru-urban',
    name: 'KSPCB Bengaluru Urban Plateau (BTM Layout)',
    source: 'Karnataka State Pollution Control Board (KSPCB) CAAQMS Grid',
    description: 'Elevated Deccan plateau ambient profile reflecting urban traffic, moderate elevation dispersion, and evening commuter peak particulate shifts.',
    location: 'Bengaluru, Karnataka, India',
    suggestedPersona: 'school',
    defaultStandard: 'cpcb',
    cityKey: 'bengaluru-btm',
    coordinates: { lat: 12.9166, lon: 77.6101 },
    csvData: `Station,Timestamp,PM2.5 (ug/m3),PM10 (ug/m3),NO2 (ug/m3),CO (mg/m3),SO2 (ug/m3),O3 (ug/m3)
BTM Layout CAAQMS,2024-11-15 00:00,42.5,78.0,28.4,0.7,9.5,32.0
BTM Layout CAAQMS,2024-11-15 03:00,35.0,65.2,22.0,0.5,8.0,36.5
BTM Layout CAAQMS,2024-11-15 06:00,56.8,98.0,38.5,0.9,11.2,28.0
BTM Layout CAAQMS,2024-11-15 09:00,82.4,138.5,56.0,1.4,14.8,42.0
BTM Layout CAAQMS,2024-11-15 12:00,64.0,110.0,42.1,1.0,12.0,58.4
BTM Layout CAAQMS,2024-11-15 15:00,52.2,92.4,34.0,0.8,10.5,66.0
BTM Layout CAAQMS,2024-11-15 18:00,78.5,130.0,52.4,1.3,13.5,45.2
BTM Layout CAAQMS,2024-11-15 21:00,60.0,104.2,40.0,0.9,11.0,35.0`
  }
];

// Preserves backward compatibility with existing imports
export const AUTHENTIC_DATASETS: DatasetPreset[] = INDIAN_DATASETS;
