import Foundation

enum ScenarioCategory: String, CaseIterable, Codable {
    case hotel = "ホテル"
    case restaurant = "レストラン"
    case airport = "空港"
    case directions = "道案内"
}

struct TravelScenario: Identifiable, Hashable, Codable {
    let id: String
    let category: ScenarioCategory
    let title: String
    let location: String
    let role: String
    let levelRange: String
    let openingLine: String
    let troubleSeeds: [String]

    static let samples: [TravelScenario] = [
        TravelScenario(
            id: "barcelona-hotel-checkin",
            category: .hotel,
            title: "Barcelona Hotel Check-in",
            location: "Barcelona, Spain",
            role: "front desk hotel staff",
            levelRange: "A2-B2",
            openingLine: "Good evening. Welcome to Hotel Rambla. Do you have a reservation with us?",
            troubleSeeds: ["The reservation is hard to find.", "The room is not ready yet.", "A city tax payment is required."]
        ),
        TravelScenario(
            id: "lisbon-hostel",
            category: .hotel,
            title: "Lisbon Hostel",
            location: "Lisbon, Portugal",
            role: "hostel reception staff",
            levelRange: "A2-B2",
            openingLine: "Hi there. Welcome to Alfama Nest Hostel. Are you checking in today?",
            troubleSeeds: ["The guest booked a mixed dorm by mistake.", "Only cash deposit is accepted.", "The locker key is missing."]
        ),
        TravelScenario(
            id: "marrakech-riad",
            category: .hotel,
            title: "Marrakech Riad",
            location: "Marrakech, Morocco",
            role: "riad host",
            levelRange: "A2-B2",
            openingLine: "Welcome to our riad. Did you find the entrance easily from the medina?",
            troubleSeeds: ["The booking name is spelled differently.", "Dinner needs to be confirmed before sunset.", "Card payment may not work today."]
        ),
        TravelScenario(
            id: "istanbul-transfer",
            category: .airport,
            title: "Istanbul Airport Transfer",
            location: "Istanbul Airport, Turkiye",
            role: "airline transfer desk staff",
            levelRange: "A2-B2",
            openingLine: "Hello. Are you here for a connecting flight? May I see your boarding pass?",
            troubleSeeds: ["The onward flight is delayed.", "The gate has changed.", "The passenger may need a new boarding pass."]
        ),
        TravelScenario(
            id: "restaurant-payment",
            category: .restaurant,
            title: "Restaurant Payment Check",
            location: "Barcelona, Spain",
            role: "restaurant server",
            levelRange: "A2-B2",
            openingLine: "Did you enjoy your meal? Would you like to pay by card or cash?",
            troubleSeeds: ["The card terminal is offline.", "A split bill is requested.", "The menu item has an unexpected supplement."]
        ),
        TravelScenario(
            id: "directions-old-town",
            category: .directions,
            title: "Old Town Directions",
            location: "Lisbon, Portugal",
            role: "local shop staff",
            levelRange: "A2-B2",
            openingLine: "Hi. You look a little lost. Where are you trying to go?",
            troubleSeeds: ["A street is closed.", "The tram is not running.", "The route is uphill and confusing."]
        )
    ]
}
