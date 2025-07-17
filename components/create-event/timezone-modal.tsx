"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface TimezoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTimezoneSelect: (timezone: string) => void;
  selectedTimezone?: string;
}

interface TimezoneData {
  city: string;
  country: string;
  offset: string;
  value: string;
}

export default function TimezoneModal({
  isOpen,
  onClose,
  onTimezoneSelect,
  selectedTimezone,
}: TimezoneModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Comprehensive timezone data
  const timezones: TimezoneData[] = [
    {
      city: "'Ali Sabieh",
      country: "Djibouti",
      offset: "GMT+3",
      value: "Africa/Djibouti",
    },
    {
      city: "Aalborg",
      country: "Denmark",
      offset: "GMT+2",
      value: "Europe/Copenhagen",
    },
    {
      city: "Abakan",
      country: "Russia",
      offset: "GMT+7",
      value: "Asia/Krasnoyarsk",
    },
    {
      city: "Abepura",
      country: "Indonesia",
      offset: "GMT+9",
      value: "Asia/Jayapura",
    },
    {
      city: "Abidjan",
      country: "Ivory Coast",
      offset: "GMT",
      value: "Africa/Abidjan",
    },
    {
      city: "Abobo",
      country: "Ivory Coast",
      offset: "GMT",
      value: "Africa/Abidjan",
    },
    {
      city: "Abomey-Calavi",
      country: "Benin",
      offset: "GMT+1",
      value: "Africa/Porto-Novo",
    },
    {
      city: "Abu Dhabi",
      country: "United Arab Emirates",
      offset: "GMT+4",
      value: "Asia/Dubai",
    },
    {
      city: "Abéché",
      country: "Chad",
      offset: "GMT+1",
      value: "Africa/Ndjamena",
    },
    { city: "Accra", country: "Ghana", offset: "GMT", value: "Africa/Accra" },
    {
      city: "Achiaman",
      country: "Ghana",
      offset: "GMT",
      value: "Africa/Accra",
    },
    {
      city: "Achinsk",
      country: "Russia",
      offset: "GMT+7",
      value: "Asia/Krasnoyarsk",
    },
    {
      city: "Aconibe",
      country: "Equatorial Guinea",
      offset: "GMT+1",
      value: "Africa/Malabo",
    },
    {
      city: "Adamstown",
      country: "Pitcairn Islands",
      offset: "GMT-8",
      value: "Pacific/Pitcairn",
    },
    {
      city: "Addis Ababa",
      country: "Ethiopia",
      offset: "GMT+3",
      value: "Africa/Addis_Ababa",
    },
    {
      city: "Adelaide",
      country: "Australia",
      offset: "GMT+10:30",
      value: "Australia/Adelaide",
    },
    { city: "Aden", country: "Yemen", offset: "GMT+3", value: "Asia/Aden" },
    {
      city: "Agadir",
      country: "Morocco",
      offset: "GMT+1",
      value: "Africa/Casablanca",
    },
    { city: "Agana", country: "Guam", offset: "GMT+10", value: "Pacific/Guam" },
    {
      city: "Ahmedabad",
      country: "India",
      offset: "GMT+5:30",
      value: "Asia/Kolkata",
    },
    {
      city: "Akmola",
      country: "Kazakhstan",
      offset: "GMT+6",
      value: "Asia/Almaty",
    },
    {
      city: "Akron",
      country: "United States",
      offset: "GMT-5",
      value: "America/New_York",
    },
    {
      city: "Albuquerque",
      country: "United States",
      offset: "GMT-7",
      value: "America/Denver",
    },
    {
      city: "Alexandria",
      country: "Egypt",
      offset: "GMT+2",
      value: "Africa/Cairo",
    },
    {
      city: "Algiers",
      country: "Algeria",
      offset: "GMT+1",
      value: "Africa/Algiers",
    },
    {
      city: "Almaty",
      country: "Kazakhstan",
      offset: "GMT+6",
      value: "Asia/Almaty",
    },
    {
      city: "Amsterdam",
      country: "Netherlands",
      offset: "GMT+2",
      value: "Europe/Amsterdam",
    },
    {
      city: "Anchorage",
      country: "United States",
      offset: "GMT-9",
      value: "America/Anchorage",
    },
    {
      city: "Andorra la Vella",
      country: "Andorra",
      offset: "GMT+2",
      value: "Europe/Andorra",
    },
    {
      city: "Angeles",
      country: "Philippines",
      offset: "GMT+8",
      value: "Asia/Manila",
    },
    {
      city: "Ankara",
      country: "Turkey",
      offset: "GMT+3",
      value: "Europe/Istanbul",
    },
    {
      city: "Antananarivo",
      country: "Madagascar",
      offset: "GMT+3",
      value: "Indian/Antananarivo",
    },
    { city: "Apia", country: "Samoa", offset: "GMT+13", value: "Pacific/Apia" },
    {
      city: "Ashgabat",
      country: "Turkmenistan",
      offset: "GMT+5",
      value: "Asia/Ashgabat",
    },
    {
      city: "Asmara",
      country: "Eritrea",
      offset: "GMT+3",
      value: "Africa/Asmara",
    },
    {
      city: "Asunción",
      country: "Paraguay",
      offset: "GMT-3",
      value: "America/Asuncion",
    },
    {
      city: "Athens",
      country: "Greece",
      offset: "GMT+3",
      value: "Europe/Athens",
    },
    {
      city: "Atlanta",
      country: "United States",
      offset: "GMT-5",
      value: "America/New_York",
    },
    {
      city: "Auckland",
      country: "New Zealand",
      offset: "GMT+12",
      value: "Pacific/Auckland",
    },
    {
      city: "Austin",
      country: "United States",
      offset: "GMT-6",
      value: "America/Chicago",
    },
    {
      city: "Baghdad",
      country: "Iraq",
      offset: "GMT+3",
      value: "Asia/Baghdad",
    },
    {
      city: "Bahrain",
      country: "Bahrain",
      offset: "GMT+3",
      value: "Asia/Bahrain",
    },
    {
      city: "Baku",
      country: "Azerbaijan",
      offset: "GMT+4",
      value: "Asia/Baku",
    },
    {
      city: "Baltimore",
      country: "United States",
      offset: "GMT-5",
      value: "America/New_York",
    },
    { city: "Bamako", country: "Mali", offset: "GMT", value: "Africa/Bamako" },
    {
      city: "Bandar Seri Begawan",
      country: "Brunei",
      offset: "GMT+8",
      value: "Asia/Brunei",
    },
    {
      city: "Bangalore",
      country: "India",
      offset: "GMT+5:30",
      value: "Asia/Kolkata",
    },
    {
      city: "Bangkok",
      country: "Thailand",
      offset: "GMT+7",
      value: "Asia/Bangkok",
    },
    {
      city: "Bangui",
      country: "Central African Republic",
      offset: "GMT+1",
      value: "Africa/Bangui",
    },
    {
      city: "Banjul",
      country: "Gambia",
      offset: "GMT",
      value: "Africa/Banjul",
    },
    {
      city: "Barcelona",
      country: "Spain",
      offset: "GMT+2",
      value: "Europe/Madrid",
    },
    {
      city: "Basel",
      country: "Switzerland",
      offset: "GMT+2",
      value: "Europe/Zurich",
    },
    {
      city: "Beijing",
      country: "China",
      offset: "GMT+8",
      value: "Asia/Shanghai",
    },
    {
      city: "Beirut",
      country: "Lebanon",
      offset: "GMT+3",
      value: "Asia/Beirut",
    },
    {
      city: "Belgrade",
      country: "Serbia",
      offset: "GMT+2",
      value: "Europe/Belgrade",
    },
    {
      city: "Belize City",
      country: "Belize",
      offset: "GMT-6",
      value: "America/Belize",
    },
    {
      city: "Berlin",
      country: "Germany",
      offset: "GMT+2",
      value: "Europe/Berlin",
    },
    {
      city: "Bern",
      country: "Switzerland",
      offset: "GMT+2",
      value: "Europe/Zurich",
    },
    {
      city: "Bishkek",
      country: "Kyrgyzstan",
      offset: "GMT+6",
      value: "Asia/Bishkek",
    },
    {
      city: "Bissau",
      country: "Guinea-Bissau",
      offset: "GMT",
      value: "Africa/Bissau",
    },
    {
      city: "Bogotá",
      country: "Colombia",
      offset: "GMT-5",
      value: "America/Bogota",
    },
    {
      city: "Boston",
      country: "United States",
      offset: "GMT-5",
      value: "America/New_York",
    },
    {
      city: "Brasília",
      country: "Brazil",
      offset: "GMT-3",
      value: "America/Sao_Paulo",
    },
    {
      city: "Bratislava",
      country: "Slovakia",
      offset: "GMT+2",
      value: "Europe/Bratislava",
    },
    {
      city: "Brazzaville",
      country: "Congo",
      offset: "GMT+1",
      value: "Africa/Brazzaville",
    },
    {
      city: "Bridgetown",
      country: "Barbados",
      offset: "GMT-4",
      value: "America/Barbados",
    },
    {
      city: "Brussels",
      country: "Belgium",
      offset: "GMT+2",
      value: "Europe/Brussels",
    },
    {
      city: "Bucharest",
      country: "Romania",
      offset: "GMT+3",
      value: "Europe/Bucharest",
    },
    {
      city: "Budapest",
      country: "Hungary",
      offset: "GMT+2",
      value: "Europe/Budapest",
    },
    {
      city: "Buenos Aires",
      country: "Argentina",
      offset: "GMT-3",
      value: "America/Argentina/Buenos_Aires",
    },
    {
      city: "Bujumbura",
      country: "Burundi",
      offset: "GMT+2",
      value: "Africa/Bujumbura",
    },
    { city: "Cairo", country: "Egypt", offset: "GMT+2", value: "Africa/Cairo" },
    {
      city: "Calgary",
      country: "Canada",
      offset: "GMT-7",
      value: "America/Edmonton",
    },
    {
      city: "Canberra",
      country: "Australia",
      offset: "GMT+11",
      value: "Australia/Sydney",
    },
    {
      city: "Cape Town",
      country: "South Africa",
      offset: "GMT+2",
      value: "Africa/Johannesburg",
    },
    {
      city: "Caracas",
      country: "Venezuela",
      offset: "GMT-4",
      value: "America/Caracas",
    },
    {
      city: "Casablanca",
      country: "Morocco",
      offset: "GMT+1",
      value: "Africa/Casablanca",
    },
    {
      city: "Castries",
      country: "Saint Lucia",
      offset: "GMT-4",
      value: "America/St_Lucia",
    },
    {
      city: "Charlotte",
      country: "United States",
      offset: "GMT-5",
      value: "America/New_York",
    },
    {
      city: "Chicago",
      country: "United States",
      offset: "GMT-6",
      value: "America/Chicago",
    },
    {
      city: "Chisinau",
      country: "Moldova",
      offset: "GMT+3",
      value: "Europe/Chisinau",
    },
    {
      city: "Colombo",
      country: "Sri Lanka",
      offset: "GMT+5:30",
      value: "Asia/Colombo",
    },
    {
      city: "Conakry",
      country: "Guinea",
      offset: "GMT",
      value: "Africa/Conakry",
    },
    {
      city: "Copenhagen",
      country: "Denmark",
      offset: "GMT+2",
      value: "Europe/Copenhagen",
    },
    { city: "Dakar", country: "Senegal", offset: "GMT", value: "Africa/Dakar" },
    {
      city: "Dallas",
      country: "United States",
      offset: "GMT-6",
      value: "America/Chicago",
    },
    {
      city: "Damascus",
      country: "Syria",
      offset: "GMT+3",
      value: "Asia/Damascus",
    },
    {
      city: "Denver",
      country: "United States",
      offset: "GMT-7",
      value: "America/Denver",
    },
    {
      city: "Detroit",
      country: "United States",
      offset: "GMT-5",
      value: "America/Detroit",
    },
    {
      city: "Dhaka",
      country: "Bangladesh",
      offset: "GMT+6",
      value: "Asia/Dhaka",
    },
    {
      city: "Dili",
      country: "East Timor",
      offset: "GMT+9",
      value: "Asia/Dili",
    },
    {
      city: "Djibouti",
      country: "Djibouti",
      offset: "GMT+3",
      value: "Africa/Djibouti",
    },
    {
      city: "Dodoma",
      country: "Tanzania",
      offset: "GMT+3",
      value: "Africa/Dar_es_Salaam",
    },
    { city: "Doha", country: "Qatar", offset: "GMT+3", value: "Asia/Qatar" },
    {
      city: "Dublin",
      country: "Ireland",
      offset: "GMT+1",
      value: "Europe/Dublin",
    },
    {
      city: "Dushanbe",
      country: "Tajikistan",
      offset: "GMT+5",
      value: "Asia/Dushanbe",
    },
    {
      city: "Edinburgh",
      country: "United Kingdom",
      offset: "GMT+1",
      value: "Europe/London",
    },
    {
      city: "Frankfurt",
      country: "Germany",
      offset: "GMT+2",
      value: "Europe/Berlin",
    },
    {
      city: "Geneva",
      country: "Switzerland",
      offset: "GMT+2",
      value: "Europe/Zurich",
    },
    {
      city: "Gibraltar",
      country: "Gibraltar",
      offset: "GMT+2",
      value: "Europe/Gibraltar",
    },
    {
      city: "Guatemala City",
      country: "Guatemala",
      offset: "GMT-6",
      value: "America/Guatemala",
    },
    {
      city: "Hamburg",
      country: "Germany",
      offset: "GMT+2",
      value: "Europe/Berlin",
    },
    {
      city: "Hanoi",
      country: "Vietnam",
      offset: "GMT+7",
      value: "Asia/Ho_Chi_Minh",
    },
    {
      city: "Harare",
      country: "Zimbabwe",
      offset: "GMT+2",
      value: "Africa/Harare",
    },
    {
      city: "Havana",
      country: "Cuba",
      offset: "GMT-5",
      value: "America/Havana",
    },
    {
      city: "Helsinki",
      country: "Finland",
      offset: "GMT+3",
      value: "Europe/Helsinki",
    },
    {
      city: "Ho Chi Minh City",
      country: "Vietnam",
      offset: "GMT+7",
      value: "Asia/Ho_Chi_Minh",
    },
    {
      city: "Hong Kong",
      country: "Hong Kong",
      offset: "GMT+8",
      value: "Asia/Hong_Kong",
    },
    {
      city: "Honolulu",
      country: "United States",
      offset: "GMT-10",
      value: "Pacific/Honolulu",
    },
    {
      city: "Houston",
      country: "United States",
      offset: "GMT-6",
      value: "America/Chicago",
    },
    {
      city: "Indianapolis",
      country: "United States",
      offset: "GMT-5",
      value: "America/Indiana/Indianapolis",
    },
    {
      city: "Islamabad",
      country: "Pakistan",
      offset: "GMT+5",
      value: "Asia/Karachi",
    },
    {
      city: "Istanbul",
      country: "Turkey",
      offset: "GMT+3",
      value: "Europe/Istanbul",
    },
    {
      city: "Jakarta",
      country: "Indonesia",
      offset: "GMT+7",
      value: "Asia/Jakarta",
    },
    {
      city: "Jerusalem",
      country: "Israel",
      offset: "GMT+3",
      value: "Asia/Jerusalem",
    },
    {
      city: "Johannesburg",
      country: "South Africa",
      offset: "GMT+2",
      value: "Africa/Johannesburg",
    },
    {
      city: "Kabul",
      country: "Afghanistan",
      offset: "GMT+4:30",
      value: "Asia/Kabul",
    },
    {
      city: "Kampala",
      country: "Uganda",
      offset: "GMT+3",
      value: "Africa/Kampala",
    },
    {
      city: "Karachi",
      country: "Pakistan",
      offset: "GMT+5",
      value: "Asia/Karachi",
    },
    {
      city: "Kathmandu",
      country: "Nepal",
      offset: "GMT+5:45",
      value: "Asia/Kathmandu",
    },
    {
      city: "Khartoum",
      country: "Sudan",
      offset: "GMT+2",
      value: "Africa/Khartoum",
    },
    { city: "Kiev", country: "Ukraine", offset: "GMT+3", value: "Europe/Kiev" },
    {
      city: "Kigali",
      country: "Rwanda",
      offset: "GMT+2",
      value: "Africa/Kigali",
    },
    {
      city: "Kingston",
      country: "Jamaica",
      offset: "GMT-5",
      value: "America/Jamaica",
    },
    {
      city: "Kinshasa",
      country: "Democratic Republic of the Congo",
      offset: "GMT+1",
      value: "Africa/Kinshasa",
    },
    {
      city: "Kuala Lumpur",
      country: "Malaysia",
      offset: "GMT+8",
      value: "Asia/Kuala_Lumpur",
    },
    {
      city: "Kuwait City",
      country: "Kuwait",
      offset: "GMT+3",
      value: "Asia/Kuwait",
    },
    {
      city: "Las Vegas",
      country: "United States",
      offset: "GMT-8",
      value: "America/Los_Angeles",
    },
    { city: "Lima", country: "Peru", offset: "GMT-5", value: "America/Lima" },
    {
      city: "Lisbon",
      country: "Portugal",
      offset: "GMT+1",
      value: "Europe/Lisbon",
    },
    {
      city: "Ljubljana",
      country: "Slovenia",
      offset: "GMT+2",
      value: "Europe/Ljubljana",
    },
    {
      city: "London",
      country: "United Kingdom",
      offset: "GMT+1",
      value: "Europe/London",
    },
    {
      city: "Los Angeles",
      country: "United States",
      offset: "GMT-8",
      value: "America/Los_Angeles",
    },
    {
      city: "Luanda",
      country: "Angola",
      offset: "GMT+1",
      value: "Africa/Luanda",
    },
    {
      city: "Lusaka",
      country: "Zambia",
      offset: "GMT+2",
      value: "Africa/Lusaka",
    },
    {
      city: "Luxembourg",
      country: "Luxembourg",
      offset: "GMT+2",
      value: "Europe/Luxembourg",
    },
    {
      city: "Madrid",
      country: "Spain",
      offset: "GMT+2",
      value: "Europe/Madrid",
    },
    {
      city: "Majuro",
      country: "Marshall Islands",
      offset: "GMT+12",
      value: "Pacific/Majuro",
    },
    {
      city: "Malabo",
      country: "Equatorial Guinea",
      offset: "GMT+1",
      value: "Africa/Malabo",
    },
    {
      city: "Malé",
      country: "Maldives",
      offset: "GMT+5",
      value: "Indian/Maldives",
    },
    {
      city: "Managua",
      country: "Nicaragua",
      offset: "GMT-6",
      value: "America/Managua",
    },
    {
      city: "Manama",
      country: "Bahrain",
      offset: "GMT+3",
      value: "Asia/Bahrain",
    },
    {
      city: "Manila",
      country: "Philippines",
      offset: "GMT+8",
      value: "Asia/Manila",
    },
    {
      city: "Maputo",
      country: "Mozambique",
      offset: "GMT+2",
      value: "Africa/Maputo",
    },
    {
      city: "Maseru",
      country: "Lesotho",
      offset: "GMT+2",
      value: "Africa/Maseru",
    },
    {
      city: "Mbabane",
      country: "Swaziland",
      offset: "GMT+2",
      value: "Africa/Mbabane",
    },
    {
      city: "Melbourne",
      country: "Australia",
      offset: "GMT+11",
      value: "Australia/Melbourne",
    },
    {
      city: "Mexico City",
      country: "Mexico",
      offset: "GMT-6",
      value: "America/Mexico_City",
    },
    {
      city: "Miami",
      country: "United States",
      offset: "GMT-5",
      value: "America/New_York",
    },
    { city: "Milan", country: "Italy", offset: "GMT+2", value: "Europe/Rome" },
    {
      city: "Minsk",
      country: "Belarus",
      offset: "GMT+3",
      value: "Europe/Minsk",
    },
    {
      city: "Mogadishu",
      country: "Somalia",
      offset: "GMT+3",
      value: "Africa/Mogadishu",
    },
    {
      city: "Monaco",
      country: "Monaco",
      offset: "GMT+2",
      value: "Europe/Monaco",
    },
    {
      city: "Monrovia",
      country: "Liberia",
      offset: "GMT",
      value: "Africa/Monrovia",
    },
    {
      city: "Montevideo",
      country: "Uruguay",
      offset: "GMT-3",
      value: "America/Montevideo",
    },
    {
      city: "Montreal",
      country: "Canada",
      offset: "GMT-5",
      value: "America/Toronto",
    },
    {
      city: "Moroni",
      country: "Comoros",
      offset: "GMT+3",
      value: "Indian/Comoro",
    },
    {
      city: "Moscow",
      country: "Russia",
      offset: "GMT+3",
      value: "Europe/Moscow",
    },
    {
      city: "Mumbai",
      country: "India",
      offset: "GMT+5:30",
      value: "Asia/Kolkata",
    },
    {
      city: "Munich",
      country: "Germany",
      offset: "GMT+2",
      value: "Europe/Berlin",
    },
    { city: "Muscat", country: "Oman", offset: "GMT+4", value: "Asia/Muscat" },
    {
      city: "N'Djamena",
      country: "Chad",
      offset: "GMT+1",
      value: "Africa/Ndjamena",
    },
    {
      city: "Nairobi",
      country: "Kenya",
      offset: "GMT+3",
      value: "Africa/Nairobi",
    },
    {
      city: "Nassau",
      country: "Bahamas",
      offset: "GMT-5",
      value: "America/Nassau",
    },
    {
      city: "Nay Pyi Taw",
      country: "Myanmar",
      offset: "GMT+6:30",
      value: "Asia/Yangon",
    },
    {
      city: "New Delhi",
      country: "India",
      offset: "GMT+5:30",
      value: "Asia/Kolkata",
    },
    {
      city: "New York",
      country: "United States",
      offset: "GMT-5",
      value: "America/New_York",
    },
    {
      city: "Niamey",
      country: "Niger",
      offset: "GMT+1",
      value: "Africa/Niamey",
    },
    {
      city: "Nicosia",
      country: "Cyprus",
      offset: "GMT+3",
      value: "Asia/Nicosia",
    },
    {
      city: "Nouakchott",
      country: "Mauritania",
      offset: "GMT",
      value: "Africa/Nouakchott",
    },
    {
      city: "Nouméa",
      country: "New Caledonia",
      offset: "GMT+11",
      value: "Pacific/Noumea",
    },
    {
      city: "Nuku'alofa",
      country: "Tonga",
      offset: "GMT+13",
      value: "Pacific/Tongatapu",
    },
    {
      city: "Nur-Sultan",
      country: "Kazakhstan",
      offset: "GMT+6",
      value: "Asia/Almaty",
    },
    { city: "Oslo", country: "Norway", offset: "GMT+2", value: "Europe/Oslo" },
    {
      city: "Ottawa",
      country: "Canada",
      offset: "GMT-5",
      value: "America/Toronto",
    },
    {
      city: "Ouagadougou",
      country: "Burkina Faso",
      offset: "GMT",
      value: "Africa/Ouagadougou",
    },
    {
      city: "Palikir",
      country: "Federated States of Micronesia",
      offset: "GMT+11",
      value: "Pacific/Pohnpei",
    },
    {
      city: "Panama City",
      country: "Panama",
      offset: "GMT-5",
      value: "America/Panama",
    },
    {
      city: "Papeete",
      country: "French Polynesia",
      offset: "GMT-10",
      value: "Pacific/Tahiti",
    },
    {
      city: "Paramaribo",
      country: "Suriname",
      offset: "GMT-3",
      value: "America/Paramaribo",
    },
    {
      city: "Paris",
      country: "France",
      offset: "GMT+2",
      value: "Europe/Paris",
    },
    {
      city: "Perth",
      country: "Australia",
      offset: "GMT+8",
      value: "Australia/Perth",
    },
    {
      city: "Philadelphia",
      country: "United States",
      offset: "GMT-5",
      value: "America/New_York",
    },
    {
      city: "Phnom Penh",
      country: "Cambodia",
      offset: "GMT+7",
      value: "Asia/Phnom_Penh",
    },
    {
      city: "Phoenix",
      country: "United States",
      offset: "GMT-7",
      value: "America/Phoenix",
    },
    {
      city: "Port Louis",
      country: "Mauritius",
      offset: "GMT+4",
      value: "Indian/Mauritius",
    },
    {
      city: "Port Moresby",
      country: "Papua New Guinea",
      offset: "GMT+10",
      value: "Pacific/Port_Moresby",
    },
    {
      city: "Port of Spain",
      country: "Trinidad and Tobago",
      offset: "GMT-4",
      value: "America/Port_of_Spain",
    },
    {
      city: "Port-au-Prince",
      country: "Haiti",
      offset: "GMT-5",
      value: "America/Port-au-Prince",
    },
    {
      city: "Port-Vila",
      country: "Vanuatu",
      offset: "GMT+11",
      value: "Pacific/Efate",
    },
    {
      city: "Portland",
      country: "United States",
      offset: "GMT-8",
      value: "America/Los_Angeles",
    },
    {
      city: "Porto-Novo",
      country: "Benin",
      offset: "GMT+1",
      value: "Africa/Porto-Novo",
    },
    {
      city: "Prague",
      country: "Czech Republic",
      offset: "GMT+2",
      value: "Europe/Prague",
    },
    {
      city: "Praia",
      country: "Cape Verde",
      offset: "GMT-1",
      value: "Atlantic/Cape_Verde",
    },
    {
      city: "Pretoria",
      country: "South Africa",
      offset: "GMT+2",
      value: "Africa/Johannesburg",
    },
    {
      city: "Pristina",
      country: "Kosovo",
      offset: "GMT+2",
      value: "Europe/Belgrade",
    },
    {
      city: "Pyongyang",
      country: "North Korea",
      offset: "GMT+9",
      value: "Asia/Pyongyang",
    },
    {
      city: "Quito",
      country: "Ecuador",
      offset: "GMT-5",
      value: "America/Guayaquil",
    },
    {
      city: "Rabat",
      country: "Morocco",
      offset: "GMT+1",
      value: "Africa/Casablanca",
    },
    {
      city: "Reykjavik",
      country: "Iceland",
      offset: "GMT",
      value: "Atlantic/Reykjavik",
    },
    { city: "Riga", country: "Latvia", offset: "GMT+3", value: "Europe/Riga" },
    {
      city: "Riyadh",
      country: "Saudi Arabia",
      offset: "GMT+3",
      value: "Asia/Riyadh",
    },
    { city: "Rome", country: "Italy", offset: "GMT+2", value: "Europe/Rome" },
    {
      city: "Roseau",
      country: "Dominica",
      offset: "GMT-4",
      value: "America/Dominica",
    },
    {
      city: "San José",
      country: "Costa Rica",
      offset: "GMT-6",
      value: "America/Costa_Rica",
    },
    {
      city: "San Marino",
      country: "San Marino",
      offset: "GMT+2",
      value: "Europe/San_Marino",
    },
    {
      city: "San Salvador",
      country: "El Salvador",
      offset: "GMT-6",
      value: "America/El_Salvador",
    },
    { city: "Sana'a", country: "Yemen", offset: "GMT+3", value: "Asia/Aden" },
    {
      city: "Santiago",
      country: "Chile",
      offset: "GMT-3",
      value: "America/Santiago",
    },
    {
      city: "Santo Domingo",
      country: "Dominican Republic",
      offset: "GMT-4",
      value: "America/Santo_Domingo",
    },
    {
      city: "São Tomé",
      country: "São Tomé and Príncipe",
      offset: "GMT",
      value: "Africa/Sao_Tome",
    },
    {
      city: "Sarajevo",
      country: "Bosnia and Herzegovina",
      offset: "GMT+2",
      value: "Europe/Sarajevo",
    },
    {
      city: "Seattle",
      country: "United States",
      offset: "GMT-8",
      value: "America/Los_Angeles",
    },
    {
      city: "Seoul",
      country: "South Korea",
      offset: "GMT+9",
      value: "Asia/Seoul",
    },
    {
      city: "Shanghai",
      country: "China",
      offset: "GMT+8",
      value: "Asia/Shanghai",
    },
    {
      city: "Singapore",
      country: "Singapore",
      offset: "GMT+8",
      value: "Asia/Singapore",
    },
    {
      city: "Skopje",
      country: "North Macedonia",
      offset: "GMT+2",
      value: "Europe/Skopje",
    },
    {
      city: "Sofia",
      country: "Bulgaria",
      offset: "GMT+3",
      value: "Europe/Sofia",
    },
    {
      city: "Stockholm",
      country: "Sweden",
      offset: "GMT+2",
      value: "Europe/Stockholm",
    },
    { city: "Suva", country: "Fiji", offset: "GMT+12", value: "Pacific/Fiji" },
    {
      city: "Sydney",
      country: "Australia",
      offset: "GMT+11",
      value: "Australia/Sydney",
    },
    {
      city: "Taipei",
      country: "Taiwan",
      offset: "GMT+8",
      value: "Asia/Taipei",
    },
    {
      city: "Tallinn",
      country: "Estonia",
      offset: "GMT+3",
      value: "Europe/Tallinn",
    },
    {
      city: "Tarawa",
      country: "Kiribati",
      offset: "GMT+12",
      value: "Pacific/Tarawa",
    },
    {
      city: "Tashkent",
      country: "Uzbekistan",
      offset: "GMT+5",
      value: "Asia/Tashkent",
    },
    {
      city: "Tbilisi",
      country: "Georgia",
      offset: "GMT+4",
      value: "Asia/Tbilisi",
    },
    {
      city: "Tegucigalpa",
      country: "Honduras",
      offset: "GMT-6",
      value: "America/Tegucigalpa",
    },
    {
      city: "Tehran",
      country: "Iran",
      offset: "GMT+3:30",
      value: "Asia/Tehran",
    },
    {
      city: "Tel Aviv",
      country: "Israel",
      offset: "GMT+3",
      value: "Asia/Jerusalem",
    },
    {
      city: "Thimphu",
      country: "Bhutan",
      offset: "GMT+6",
      value: "Asia/Thimphu",
    },
    {
      city: "Tirana",
      country: "Albania",
      offset: "GMT+2",
      value: "Europe/Tirane",
    },
    { city: "Tokyo", country: "Japan", offset: "GMT+9", value: "Asia/Tokyo" },
    {
      city: "Toronto",
      country: "Canada",
      offset: "GMT-5",
      value: "America/Toronto",
    },
    {
      city: "Tripoli",
      country: "Libya",
      offset: "GMT+2",
      value: "Africa/Tripoli",
    },
    {
      city: "Tunis",
      country: "Tunisia",
      offset: "GMT+1",
      value: "Africa/Tunis",
    },
    {
      city: "Ulaanbaatar",
      country: "Mongolia",
      offset: "GMT+8",
      value: "Asia/Ulaanbaatar",
    },
    {
      city: "Vaduz",
      country: "Liechtenstein",
      offset: "GMT+2",
      value: "Europe/Vaduz",
    },
    {
      city: "Valletta",
      country: "Malta",
      offset: "GMT+2",
      value: "Europe/Malta",
    },
    {
      city: "Vancouver",
      country: "Canada",
      offset: "GMT-8",
      value: "America/Vancouver",
    },
    {
      city: "Vatican City",
      country: "Vatican City",
      offset: "GMT+2",
      value: "Europe/Vatican",
    },
    {
      city: "Victoria",
      country: "Seychelles",
      offset: "GMT+4",
      value: "Indian/Mahe",
    },
    {
      city: "Vienna",
      country: "Austria",
      offset: "GMT+2",
      value: "Europe/Vienna",
    },
    {
      city: "Vientiane",
      country: "Laos",
      offset: "GMT+7",
      value: "Asia/Vientiane",
    },
    {
      city: "Vilnius",
      country: "Lithuania",
      offset: "GMT+3",
      value: "Europe/Vilnius",
    },
    {
      city: "Warsaw",
      country: "Poland",
      offset: "GMT+2",
      value: "Europe/Warsaw",
    },
    {
      city: "Washington DC",
      country: "United States",
      offset: "GMT-5",
      value: "America/New_York",
    },
    {
      city: "Wellington",
      country: "New Zealand",
      offset: "GMT+12",
      value: "Pacific/Auckland",
    },
    {
      city: "Windhoek",
      country: "Namibia",
      offset: "GMT+2",
      value: "Africa/Windhoek",
    },
    {
      city: "Yamoussoukro",
      country: "Ivory Coast",
      offset: "GMT",
      value: "Africa/Abidjan",
    },
    {
      city: "Yangon",
      country: "Myanmar",
      offset: "GMT+6:30",
      value: "Asia/Yangon",
    },
    {
      city: "Yaoundé",
      country: "Cameroon",
      offset: "GMT+1",
      value: "Africa/Douala",
    },
    {
      city: "Yerevan",
      country: "Armenia",
      offset: "GMT+4",
      value: "Asia/Yerevan",
    },
    {
      city: "Zagreb",
      country: "Croatia",
      offset: "GMT+2",
      value: "Europe/Zagreb",
    },
    {
      city: "Zurich",
      country: "Switzerland",
      offset: "GMT+2",
      value: "Europe/Zurich",
    },
  ];

  // Filter timezones based on search query
  const filteredTimezones = useMemo(() => {
    if (!searchQuery.trim()) return timezones;

    const query = searchQuery.toLowerCase();
    return timezones.filter(
      (tz) =>
        tz.city.toLowerCase().includes(query) ||
        tz.country.toLowerCase().includes(query) ||
        tz.offset.toLowerCase().includes(query) ||
        tz.value.toLowerCase().includes(query),
    );
  }, [searchQuery, timezones]);

  const handleTimezoneSelect = (timezone: TimezoneData) => {
    onTimezoneSelect(`${timezone.offset.replace("GMT", "")}`);
    onClose();
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <button onClick={onClose} className="font-medium text-red-500">
          Cancel
        </button>
        <h1 className="text-lg font-semibold">Select Timezone</h1>
        <div className="w-12"></div> {/* Spacer for centering */}
      </div>

      {/* Search Bar */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border-none bg-gray-100 py-3 pl-10 pr-4 text-gray-700 placeholder-gray-400 outline-none"
          />
        </div>
      </div>

      {/* Timezone List */}
      <div className="flex-1 overflow-y-auto">
        {filteredTimezones.map((timezone, index) => (
          <button
            key={index}
            onClick={() => handleTimezoneSelect(timezone)}
            className="w-full border-b border-gray-100 px-4 py-4 text-left hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {timezone.city}, {timezone.country}
                </p>
              </div>
              <span className="text-sm font-medium text-red-500">
                {timezone.offset}
              </span>
            </div>
          </button>
        ))}

        {filteredTimezones.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">No timezones found</p>
          </div>
        )}
      </div>
    </div>
  );
}
