// Offline locality lookup used instead of a paid geocoding API in the MVP.
// Mappls search works with our key but returns no coordinates at this tier, so areas are listed here.
// Replace `searchLocalities` with a real geocoder later; keep the return shape.

export type Locality = {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
};

// The first 18 ids are referenced by seed data and saved accounts — keep them stable and append new areas.
export const LOCALITIES: Locality[] = [
  { id: "del-cp", name: "Connaught Place", city: "New Delhi", state: "Delhi", latitude: 28.6315, longitude: 77.2167 },
  { id: "del-saket", name: "Saket", city: "New Delhi", state: "Delhi", latitude: 28.5245, longitude: 77.2066 },
  { id: "del-lajpat", name: "Lajpat Nagar", city: "New Delhi", state: "Delhi", latitude: 28.5677, longitude: 77.2433 },
  { id: "del-dwarka", name: "Dwarka Sector 10", city: "New Delhi", state: "Delhi", latitude: 28.5823, longitude: 77.05 },
  { id: "del-rohini", name: "Rohini", city: "New Delhi", state: "Delhi", latitude: 28.7383, longitude: 77.0822 },
  { id: "ncr-noida18", name: "Noida Sector 18", city: "Noida", state: "Uttar Pradesh", latitude: 28.5708, longitude: 77.3261 },
  { id: "ncr-dlf3", name: "DLF Phase 3", city: "Gurugram", state: "Haryana", latitude: 28.4906, longitude: 77.0936 },
  { id: "mum-andheri", name: "Andheri West", city: "Mumbai", state: "Maharashtra", latitude: 19.1364, longitude: 72.8296 },
  { id: "mum-bandra", name: "Bandra West", city: "Mumbai", state: "Maharashtra", latitude: 19.0596, longitude: 72.8295 },
  { id: "mum-powai", name: "Powai", city: "Mumbai", state: "Maharashtra", latitude: 19.1176, longitude: 72.906 },
  { id: "mum-dadar", name: "Dadar", city: "Mumbai", state: "Maharashtra", latitude: 19.0178, longitude: 72.8478 },
  { id: "mum-thane", name: "Thane West", city: "Thane", state: "Maharashtra", latitude: 19.1972, longitude: 72.9722 },
  { id: "blr-koramangala", name: "Koramangala", city: "Bengaluru", state: "Karnataka", latitude: 12.9352, longitude: 77.6245 },
  { id: "blr-indiranagar", name: "Indiranagar", city: "Bengaluru", state: "Karnataka", latitude: 12.9719, longitude: 77.6412 },
  { id: "blr-whitefield", name: "Whitefield", city: "Bengaluru", state: "Karnataka", latitude: 12.9698, longitude: 77.75 },
  { id: "blr-jayanagar", name: "Jayanagar", city: "Bengaluru", state: "Karnataka", latitude: 12.9308, longitude: 77.5838 },
  { id: "blr-hsr", name: "HSR Layout", city: "Bengaluru", state: "Karnataka", latitude: 12.9121, longitude: 77.6446 },
  { id: "blr-malleshwaram", name: "Malleshwaram", city: "Bengaluru", state: "Karnataka", latitude: 13.0031, longitude: 77.5643 },

  // Delhi & NCR
  { id: "del-karolbagh", name: "Karol Bagh", city: "New Delhi", state: "Delhi", latitude: 28.6519, longitude: 77.1909 },
  { id: "del-mayurvihar", name: "Mayur Vihar", city: "New Delhi", state: "Delhi", latitude: 28.609, longitude: 77.295 },
  { id: "del-vasantkunj", name: "Vasant Kunj", city: "New Delhi", state: "Delhi", latitude: 28.52, longitude: 77.158 },
  { id: "del-pitampura", name: "Pitampura", city: "New Delhi", state: "Delhi", latitude: 28.698, longitude: 77.138 },
  { id: "del-janakpuri", name: "Janakpuri", city: "New Delhi", state: "Delhi", latitude: 28.6219, longitude: 77.0878 },
  { id: "ncr-noida62", name: "Noida Sector 62", city: "Noida", state: "Uttar Pradesh", latitude: 28.627, longitude: 77.365 },
  { id: "gzb-indirapuram", name: "Indirapuram", city: "Ghaziabad", state: "Uttar Pradesh", latitude: 28.6415, longitude: 77.3712 },
  { id: "ggn-sector29", name: "Sector 29", city: "Gurugram", state: "Haryana", latitude: 28.4675, longitude: 77.0625 },
  { id: "fbd-sector15", name: "Sector 15", city: "Faridabad", state: "Haryana", latitude: 28.395, longitude: 77.32 },

  // Andhra Pradesh
  { id: "vsk-dwaraka", name: "Dwaraka Nagar", city: "Visakhapatnam", state: "Andhra Pradesh", latitude: 17.7289, longitude: 83.305 },
  { id: "vja-benz", name: "Benz Circle", city: "Vijayawada", state: "Andhra Pradesh", latitude: 16.4995, longitude: 80.656 },
  { id: "gnt-brodipet", name: "Brodipet", city: "Guntur", state: "Andhra Pradesh", latitude: 16.3008, longitude: 80.4428 },
  { id: "tpt-balaji", name: "Balaji Colony", city: "Tirupati", state: "Andhra Pradesh", latitude: 13.6288, longitude: 79.4192 },
  { id: "amr-velagapudi", name: "Velagapudi", city: "Amaravati", state: "Andhra Pradesh", latitude: 16.515, longitude: 80.515 },

  // Arunachal Pradesh
  { id: "itn-ganga", name: "Ganga Market", city: "Itanagar", state: "Arunachal Pradesh", latitude: 27.0844, longitude: 93.6053 },

  // Assam
  { id: "guw-dispur", name: "Dispur", city: "Guwahati", state: "Assam", latitude: 26.1433, longitude: 91.7898 },
  { id: "guw-paltan", name: "Paltan Bazaar", city: "Guwahati", state: "Assam", latitude: 26.1809, longitude: 91.753 },
  { id: "dib-town", name: "Dibrugarh Town", city: "Dibrugarh", state: "Assam", latitude: 27.4728, longitude: 94.912 },
  { id: "slc-tarapur", name: "Tarapur", city: "Silchar", state: "Assam", latitude: 24.8333, longitude: 92.7789 },

  // Bihar
  { id: "pat-boring", name: "Boring Road", city: "Patna", state: "Bihar", latitude: 25.6124, longitude: 85.1156 },
  { id: "pat-kankarbagh", name: "Kankarbagh", city: "Patna", state: "Bihar", latitude: 25.596, longitude: 85.164 },
  { id: "gay-civil", name: "Civil Lines", city: "Gaya", state: "Bihar", latitude: 24.7955, longitude: 85.0002 },
  { id: "muz-motijheel", name: "Motijheel", city: "Muzaffarpur", state: "Bihar", latitude: 26.1209, longitude: 85.3647 },
  { id: "bhg-tilkamanjhi", name: "Tilka Manjhi", city: "Bhagalpur", state: "Bihar", latitude: 25.2425, longitude: 86.9842 },

  // Chhattisgarh
  { id: "rpr-shankar", name: "Shankar Nagar", city: "Raipur", state: "Chhattisgarh", latitude: 21.2514, longitude: 81.6296 },
  { id: "bhi-civic", name: "Civic Centre", city: "Bhilai", state: "Chhattisgarh", latitude: 21.2092, longitude: 81.379 },
  { id: "bsp-vyapar", name: "Vyapar Vihar", city: "Bilaspur", state: "Chhattisgarh", latitude: 22.0797, longitude: 82.1409 },

  // Goa
  { id: "goa-panaji", name: "Altinho", city: "Panaji", state: "Goa", latitude: 15.4909, longitude: 73.8278 },
  { id: "goa-margao", name: "Margao Market", city: "Margao", state: "Goa", latitude: 15.2832, longitude: 73.9862 },
  { id: "goa-vasco", name: "Vasco da Gama", city: "Vasco", state: "Goa", latitude: 15.3982, longitude: 73.8113 },

  // Gujarat
  { id: "amd-navrangpura", name: "Navrangpura", city: "Ahmedabad", state: "Gujarat", latitude: 23.0365, longitude: 72.5611 },
  { id: "amd-satellite", name: "Satellite", city: "Ahmedabad", state: "Gujarat", latitude: 23.03, longitude: 72.517 },
  { id: "amd-maninagar", name: "Maninagar", city: "Ahmedabad", state: "Gujarat", latitude: 22.9962, longitude: 72.603 },
  { id: "srt-adajan", name: "Adajan", city: "Surat", state: "Gujarat", latitude: 21.1959, longitude: 72.7933 },
  { id: "vad-alkapuri", name: "Alkapuri", city: "Vadodara", state: "Gujarat", latitude: 22.3106, longitude: 73.171 },
  { id: "rjk-kalawad", name: "Kalawad Road", city: "Rajkot", state: "Gujarat", latitude: 22.2916, longitude: 70.778 },
  { id: "gnr-sector21", name: "Sector 21", city: "Gandhinagar", state: "Gujarat", latitude: 23.235, longitude: 72.65 },

  // Haryana
  { id: "amb-cantt", name: "Ambala Cantt", city: "Ambala", state: "Haryana", latitude: 30.335, longitude: 76.835 },
  { id: "hsr-modeltown", name: "Model Town", city: "Hisar", state: "Haryana", latitude: 29.1492, longitude: 75.7217 },
  { id: "pnp-modeltown", name: "Model Town", city: "Panipat", state: "Haryana", latitude: 29.3909, longitude: 76.9635 },

  // Himachal Pradesh
  { id: "shl-mall", name: "The Mall", city: "Shimla", state: "Himachal Pradesh", latitude: 31.1048, longitude: 77.1734 },
  { id: "dhm-kotwali", name: "Kotwali Bazaar", city: "Dharamshala", state: "Himachal Pradesh", latitude: 32.219, longitude: 76.3234 },
  { id: "mnl-mall", name: "Mall Road", city: "Manali", state: "Himachal Pradesh", latitude: 32.2432, longitude: 77.1892 },

  // Jharkhand
  { id: "rnc-lalpur", name: "Lalpur", city: "Ranchi", state: "Jharkhand", latitude: 23.37, longitude: 85.335 },
  { id: "jsr-bistupur", name: "Bistupur", city: "Jamshedpur", state: "Jharkhand", latitude: 22.786, longitude: 86.185 },
  { id: "dhn-bankmore", name: "Bank More", city: "Dhanbad", state: "Jharkhand", latitude: 23.7957, longitude: 86.4304 },

  // Karnataka
  { id: "blr-electronic", name: "Electronic City", city: "Bengaluru", state: "Karnataka", latitude: 12.8452, longitude: 77.6602 },
  { id: "blr-yelahanka", name: "Yelahanka", city: "Bengaluru", state: "Karnataka", latitude: 13.1005, longitude: 77.5963 },
  { id: "mys-kuvempu", name: "Kuvempunagar", city: "Mysuru", state: "Karnataka", latitude: 12.2856, longitude: 76.625 },
  { id: "mng-hampankatta", name: "Hampankatta", city: "Mangaluru", state: "Karnataka", latitude: 12.8698, longitude: 74.843 },
  { id: "hbl-vidyanagar", name: "Vidyanagar", city: "Hubballi", state: "Karnataka", latitude: 15.3647, longitude: 75.124 },
  { id: "blg-tilakwadi", name: "Tilakwadi", city: "Belagavi", state: "Karnataka", latitude: 15.84, longitude: 74.51 },

  // Kerala
  { id: "tvm-pattom", name: "Pattom", city: "Thiruvananthapuram", state: "Kerala", latitude: 8.522, longitude: 76.942 },
  { id: "koc-kakkanad", name: "Kakkanad", city: "Kochi", state: "Kerala", latitude: 10.0159, longitude: 76.3419 },
  { id: "koc-edappally", name: "Edappally", city: "Kochi", state: "Kerala", latitude: 10.0261, longitude: 76.3083 },
  { id: "kzk-mavoor", name: "Mavoor Road", city: "Kozhikode", state: "Kerala", latitude: 11.2588, longitude: 75.7804 },
  { id: "tcr-swaraj", name: "Swaraj Round", city: "Thrissur", state: "Kerala", latitude: 10.5276, longitude: 76.2144 },

  // Madhya Pradesh
  { id: "bpl-arera", name: "Arera Colony", city: "Bhopal", state: "Madhya Pradesh", latitude: 23.2156, longitude: 77.4304 },
  { id: "ind-vijaynagar", name: "Vijay Nagar", city: "Indore", state: "Madhya Pradesh", latitude: 22.7533, longitude: 75.8937 },
  { id: "ind-palasia", name: "Palasia", city: "Indore", state: "Madhya Pradesh", latitude: 22.7244, longitude: 75.8839 },
  { id: "gwl-citycentre", name: "City Centre", city: "Gwalior", state: "Madhya Pradesh", latitude: 26.2124, longitude: 78.1772 },
  { id: "jbp-napier", name: "Napier Town", city: "Jabalpur", state: "Madhya Pradesh", latitude: 23.168, longitude: 79.933 },

  // Maharashtra
  { id: "mum-borivali", name: "Borivali West", city: "Mumbai", state: "Maharashtra", latitude: 19.2307, longitude: 72.8567 },
  { id: "mum-chembur", name: "Chembur", city: "Mumbai", state: "Maharashtra", latitude: 19.0522, longitude: 72.9005 },
  { id: "nvm-vashi", name: "Vashi", city: "Navi Mumbai", state: "Maharashtra", latitude: 19.0771, longitude: 72.9986 },
  { id: "pun-kothrud", name: "Kothrud", city: "Pune", state: "Maharashtra", latitude: 18.5074, longitude: 73.8077 },
  { id: "pun-vimannagar", name: "Viman Nagar", city: "Pune", state: "Maharashtra", latitude: 18.5679, longitude: 73.9143 },
  { id: "pun-hinjewadi", name: "Hinjewadi", city: "Pune", state: "Maharashtra", latitude: 18.5913, longitude: 73.7389 },
  { id: "ngp-dharampeth", name: "Dharampeth", city: "Nagpur", state: "Maharashtra", latitude: 21.14, longitude: 79.07 },
  { id: "nsk-college", name: "College Road", city: "Nashik", state: "Maharashtra", latitude: 20.005, longitude: 73.76 },
  { id: "aur-cidco", name: "CIDCO", city: "Chhatrapati Sambhajinagar", state: "Maharashtra", latitude: 19.8762, longitude: 75.3433 },
  { id: "klp-rajarampuri", name: "Rajarampuri", city: "Kolhapur", state: "Maharashtra", latitude: 16.698, longitude: 74.2433 },

  // Manipur
  { id: "imp-paona", name: "Paona Bazar", city: "Imphal", state: "Manipur", latitude: 24.8074, longitude: 93.9384 },

  // Meghalaya
  { id: "shg-police", name: "Police Bazar", city: "Shillong", state: "Meghalaya", latitude: 25.5764, longitude: 91.883 },

  // Mizoram
  { id: "azl-zarkawt", name: "Zarkawt", city: "Aizawl", state: "Mizoram", latitude: 23.7307, longitude: 92.7173 },

  // Nagaland
  { id: "kma-town", name: "Kohima Town", city: "Kohima", state: "Nagaland", latitude: 25.6701, longitude: 94.1077 },
  { id: "dmr-circular", name: "Circular Road", city: "Dimapur", state: "Nagaland", latitude: 25.9063, longitude: 93.7276 },

  // Odisha
  { id: "bbs-saheed", name: "Saheed Nagar", city: "Bhubaneswar", state: "Odisha", latitude: 20.29, longitude: 85.844 },
  { id: "bbs-patia", name: "Patia", city: "Bhubaneswar", state: "Odisha", latitude: 20.355, longitude: 85.82 },
  { id: "ctc-buxi", name: "Buxi Bazaar", city: "Cuttack", state: "Odisha", latitude: 20.4686, longitude: 85.8792 },
  { id: "rrk-civil", name: "Civil Township", city: "Rourkela", state: "Odisha", latitude: 22.24, longitude: 84.86 },
  { id: "pur-grandroad", name: "Grand Road", city: "Puri", state: "Odisha", latitude: 19.8106, longitude: 85.8314 },

  // Punjab
  { id: "ldh-sarabha", name: "Sarabha Nagar", city: "Ludhiana", state: "Punjab", latitude: 30.89, longitude: 75.82 },
  { id: "asr-ranjit", name: "Ranjit Avenue", city: "Amritsar", state: "Punjab", latitude: 31.656, longitude: 74.855 },
  { id: "jal-modeltown", name: "Model Town", city: "Jalandhar", state: "Punjab", latitude: 31.315, longitude: 75.59 },
  { id: "mhl-phase7", name: "Phase 7", city: "Mohali", state: "Punjab", latitude: 30.7046, longitude: 76.7179 },
  { id: "ptl-leela", name: "Leela Bhawan", city: "Patiala", state: "Punjab", latitude: 30.3398, longitude: 76.3869 },

  // Rajasthan
  { id: "jpr-malviya", name: "Malviya Nagar", city: "Jaipur", state: "Rajasthan", latitude: 26.853, longitude: 75.805 },
  { id: "jpr-vaishali", name: "Vaishali Nagar", city: "Jaipur", state: "Rajasthan", latitude: 26.911, longitude: 75.743 },
  { id: "jdh-sardarpura", name: "Sardarpura", city: "Jodhpur", state: "Rajasthan", latitude: 26.28, longitude: 73.01 },
  { id: "udr-fatehpura", name: "Fatehpura", city: "Udaipur", state: "Rajasthan", latitude: 24.602, longitude: 73.697 },
  { id: "kta-talwandi", name: "Talwandi", city: "Kota", state: "Rajasthan", latitude: 25.15, longitude: 75.84 },
  { id: "ajm-vaishali", name: "Vaishali Nagar", city: "Ajmer", state: "Rajasthan", latitude: 26.47, longitude: 74.64 },
  { id: "bkn-ranibazar", name: "Rani Bazar", city: "Bikaner", state: "Rajasthan", latitude: 28.0229, longitude: 73.3119 },

  // Sikkim
  { id: "gtk-mgmarg", name: "MG Marg", city: "Gangtok", state: "Sikkim", latitude: 27.3314, longitude: 88.6138 },

  // Tamil Nadu
  { id: "che-tnagar", name: "T. Nagar", city: "Chennai", state: "Tamil Nadu", latitude: 13.0418, longitude: 80.2341 },
  { id: "che-adyar", name: "Adyar", city: "Chennai", state: "Tamil Nadu", latitude: 13.0012, longitude: 80.2565 },
  { id: "che-annanagar", name: "Anna Nagar", city: "Chennai", state: "Tamil Nadu", latitude: 13.085, longitude: 80.2101 },
  { id: "che-velachery", name: "Velachery", city: "Chennai", state: "Tamil Nadu", latitude: 12.9791, longitude: 80.2209 },
  { id: "che-tambaram", name: "Tambaram", city: "Chennai", state: "Tamil Nadu", latitude: 12.9249, longitude: 80.1 },
  { id: "cbe-rspuram", name: "RS Puram", city: "Coimbatore", state: "Tamil Nadu", latitude: 11.01, longitude: 76.95 },
  { id: "mdu-kknagar", name: "KK Nagar", city: "Madurai", state: "Tamil Nadu", latitude: 9.93, longitude: 78.14 },
  { id: "try-thillai", name: "Thillai Nagar", city: "Tiruchirappalli", state: "Tamil Nadu", latitude: 10.825, longitude: 78.685 },
  { id: "slm-fairlands", name: "Fairlands", city: "Salem", state: "Tamil Nadu", latitude: 11.67, longitude: 78.14 },
  { id: "vel-gandhinagar", name: "Gandhi Nagar", city: "Vellore", state: "Tamil Nadu", latitude: 12.95, longitude: 79.14 },

  // Telangana
  { id: "hyd-banjara", name: "Banjara Hills", city: "Hyderabad", state: "Telangana", latitude: 17.4156, longitude: 78.4347 },
  { id: "hyd-gachibowli", name: "Gachibowli", city: "Hyderabad", state: "Telangana", latitude: 17.4401, longitude: 78.3489 },
  { id: "hyd-kukatpally", name: "Kukatpally", city: "Hyderabad", state: "Telangana", latitude: 17.4948, longitude: 78.3996 },
  { id: "hyd-secunderabad", name: "Secunderabad", city: "Hyderabad", state: "Telangana", latitude: 17.4399, longitude: 78.4983 },
  { id: "hyd-dilsukhnagar", name: "Dilsukhnagar", city: "Hyderabad", state: "Telangana", latitude: 17.3688, longitude: 78.5247 },
  { id: "wgl-hanamkonda", name: "Hanamkonda", city: "Warangal", state: "Telangana", latitude: 18.011, longitude: 79.558 },

  // Tripura
  { id: "agt-krishnanagar", name: "Krishnanagar", city: "Agartala", state: "Tripura", latitude: 23.8315, longitude: 91.2868 },

  // Uttar Pradesh
  { id: "lko-gomti", name: "Gomti Nagar", city: "Lucknow", state: "Uttar Pradesh", latitude: 26.85, longitude: 80.9999 },
  { id: "lko-hazratganj", name: "Hazratganj", city: "Lucknow", state: "Uttar Pradesh", latitude: 26.85, longitude: 80.9462 },
  { id: "knp-swaroop", name: "Swaroop Nagar", city: "Kanpur", state: "Uttar Pradesh", latitude: 26.48, longitude: 80.32 },
  { id: "vns-sigra", name: "Sigra", city: "Varanasi", state: "Uttar Pradesh", latitude: 25.3176, longitude: 82.987 },
  { id: "agr-sanjay", name: "Sanjay Place", city: "Agra", state: "Uttar Pradesh", latitude: 27.2, longitude: 78.005 },
  { id: "pry-civil", name: "Civil Lines", city: "Prayagraj", state: "Uttar Pradesh", latitude: 25.45, longitude: 81.84 },
  { id: "mrt-shastri", name: "Shastri Nagar", city: "Meerut", state: "Uttar Pradesh", latitude: 28.99, longitude: 77.7 },
  { id: "gkp-golghar", name: "Golghar", city: "Gorakhpur", state: "Uttar Pradesh", latitude: 26.7606, longitude: 83.3732 },

  // Uttarakhand
  { id: "ddn-rajpur", name: "Rajpur Road", city: "Dehradun", state: "Uttarakhand", latitude: 30.345, longitude: 78.06 },
  { id: "hdw-ranipur", name: "Ranipur More", city: "Haridwar", state: "Uttarakhand", latitude: 29.9457, longitude: 78.1642 },
  { id: "hld-nainitalroad", name: "Nainital Road", city: "Haldwani", state: "Uttarakhand", latitude: 29.2183, longitude: 79.513 },

  // West Bengal
  { id: "kol-parkstreet", name: "Park Street", city: "Kolkata", state: "West Bengal", latitude: 22.553, longitude: 88.352 },
  { id: "kol-saltlake", name: "Salt Lake Sector V", city: "Kolkata", state: "West Bengal", latitude: 22.576, longitude: 88.433 },
  { id: "kol-ballygunge", name: "Ballygunge", city: "Kolkata", state: "West Bengal", latitude: 22.528, longitude: 88.365 },
  { id: "kol-newtown", name: "New Town", city: "Kolkata", state: "West Bengal", latitude: 22.58, longitude: 88.46 },
  { id: "kol-behala", name: "Behala", city: "Kolkata", state: "West Bengal", latitude: 22.498, longitude: 88.31 },
  { id: "how-shibpur", name: "Shibpur", city: "Howrah", state: "West Bengal", latitude: 22.57, longitude: 88.318 },
  { id: "slg-sevoke", name: "Sevoke Road", city: "Siliguri", state: "West Bengal", latitude: 26.7271, longitude: 88.429 },
  { id: "dgp-citycentre", name: "City Centre", city: "Durgapur", state: "West Bengal", latitude: 23.53, longitude: 87.31 },

  // Union territories
  { id: "pbl-aberdeen", name: "Aberdeen Bazaar", city: "Port Blair", state: "Andaman and Nicobar Islands", latitude: 11.67, longitude: 92.74 },
  { id: "chd-sector17", name: "Sector 17", city: "Chandigarh", state: "Chandigarh", latitude: 30.741, longitude: 76.782 },
  { id: "chd-sector35", name: "Sector 35", city: "Chandigarh", state: "Chandigarh", latitude: 30.725, longitude: 76.76 },
  { id: "dmn-nani", name: "Nani Daman", city: "Daman", state: "Dadra and Nagar Haveli and Daman and Diu", latitude: 20.414, longitude: 72.833 },
  { id: "slv-silvassa", name: "Silvassa", city: "Silvassa", state: "Dadra and Nagar Haveli and Daman and Diu", latitude: 20.274, longitude: 73.015 },
  { id: "sxr-lalchowk", name: "Lal Chowk", city: "Srinagar", state: "Jammu and Kashmir", latitude: 34.07, longitude: 74.809 },
  { id: "jmu-gandhinagar", name: "Gandhi Nagar", city: "Jammu", state: "Jammu and Kashmir", latitude: 32.709, longitude: 74.857 },
  { id: "leh-main", name: "Main Bazaar", city: "Leh", state: "Ladakh", latitude: 34.165, longitude: 77.585 },
  { id: "kvt-kavaratti", name: "Kavaratti", city: "Kavaratti", state: "Lakshadweep", latitude: 10.5626, longitude: 72.6369 },
  { id: "pdy-whitetown", name: "White Town", city: "Puducherry", state: "Puducherry", latitude: 11.933, longitude: 79.835 },
];

/** Older or common names people still type, keyed by the city name used above. */
const CITY_ALIASES: Record<string, string> = {
  Bengaluru: "bangalore",
  Mumbai: "bombay",
  "Navi Mumbai": "new bombay",
  Gurugram: "gurgaon",
  Kolkata: "calcutta",
  Chennai: "madras",
  Mysuru: "mysore",
  Mangaluru: "mangalore",
  Hubballi: "hubli",
  Belagavi: "belgaum",
  Thiruvananthapuram: "trivandrum",
  Kochi: "cochin ernakulam",
  Kozhikode: "calicut",
  Tiruchirappalli: "trichy",
  Puducherry: "pondicherry pondy",
  Prayagraj: "allahabad",
  Varanasi: "banaras benares kashi",
  Vadodara: "baroda",
  Visakhapatnam: "vizag",
  Pune: "poona",
  Shimla: "simla",
  Panaji: "panjim",
  Margao: "madgaon",
  Mohali: "sas nagar",
  "Chhatrapati Sambhajinagar": "aurangabad",
  "Port Blair": "sri vijaya puram",
};

/** Localities grouped by state (alphabetical), for grouped dropdowns. */
export const LOCALITIES_BY_STATE: [state: string, localities: Locality[]][] = [...new Set(LOCALITIES.map((l) => l.state))]
  .sort((a, b) => a.localeCompare(b))
  .map((state) => [
    state,
    LOCALITIES.filter((l) => l.state === state).sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name)),
  ]);

export function localityLabel(locality: Locality): string {
  return `${locality.name}, ${locality.city}`;
}

/** Every word must match; areas whose name or city starts with the query rank first. */
function matchScore(locality: Locality, words: string[]): number {
  const name = locality.name.toLowerCase();
  const city = locality.city.toLowerCase();
  const aliases = CITY_ALIASES[locality.city] ?? "";
  const haystack = `${name} ${city} ${locality.state.toLowerCase()} ${aliases}`;
  if (!words.every((word) => haystack.includes(word))) return 0;
  const first = words[0];
  if (name.startsWith(first)) return 3;
  if (city.startsWith(first) || aliases.split(" ").some((alias) => alias.startsWith(first))) return 2;
  return 1;
}

export function searchLocalities(query: string, limit = 6): Locality[] {
  const words = query.trim().toLowerCase().split(/[\s,]+/).filter(Boolean);
  if (!words.length) return LOCALITIES.slice(0, limit);
  return LOCALITIES.map((locality) => ({ locality, score: matchScore(locality, words) }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((match) => match.locality);
}

export function findLocality(id: string): Locality | undefined {
  return LOCALITIES.find((locality) => locality.id === id);
}
