import type { Scenario } from "./types";

export const categoryLabels = {
  hotel: "ホテル",
  restaurant: "レストラン",
  airport: "空港",
  directions: "道案内"
} as const;

export const scenarios: Scenario[] = [
  {
    id: "barcelona-hotel-checkin",
    category: "hotel",
    title: "Barcelona Hotel Check-in",
    location: "Barcelona, Spain",
    role: "front desk hotel staff",
    openingLine: "Good evening. Welcome to Hotel Rambla. Do you have a reservation with us?",
    troubleSeeds: ["The reservation is hard to find.", "The room is not ready yet.", "A city tax payment is required."]
  },
  {
    id: "lisbon-hostel",
    category: "hotel",
    title: "Lisbon Hostel",
    location: "Lisbon, Portugal",
    role: "hostel reception staff",
    openingLine: "Hi there. Welcome to Alfama Nest Hostel. Are you checking in today?",
    troubleSeeds: ["The guest booked a mixed dorm by mistake.", "Only cash deposit is accepted.", "The locker key is missing."]
  },
  {
    id: "marrakech-riad",
    category: "hotel",
    title: "Marrakech Riad",
    location: "Marrakech, Morocco",
    role: "riad host",
    openingLine: "Welcome to our riad. Did you find the entrance easily from the medina?",
    troubleSeeds: ["The booking name is spelled differently.", "Dinner needs to be confirmed before sunset.", "Card payment may not work today."]
  },
  {
    id: "istanbul-transfer",
    category: "airport",
    title: "Istanbul Airport Transfer",
    location: "Istanbul Airport, Turkiye",
    role: "airline transfer desk staff",
    openingLine: "Hello. Are you here for a connecting flight? May I see your boarding pass?",
    troubleSeeds: ["The onward flight is delayed.", "The gate has changed.", "The passenger may need a new boarding pass."]
  },
  {
    id: "restaurant-payment",
    category: "restaurant",
    title: "Restaurant Payment Check",
    location: "Barcelona, Spain",
    role: "restaurant server",
    openingLine: "Did you enjoy your meal? Would you like to pay by card or cash?",
    troubleSeeds: ["The card terminal is offline.", "A split bill is requested.", "The menu item has an unexpected supplement."]
  },
  {
    id: "directions-old-town",
    category: "directions",
    title: "Old Town Directions",
    location: "Lisbon, Portugal",
    role: "local shop staff",
    openingLine: "Hi. You look a little lost. Where are you trying to go?",
    troubleSeeds: ["A street is closed.", "The tram is not running.", "The route is uphill and confusing."]
  }
];
