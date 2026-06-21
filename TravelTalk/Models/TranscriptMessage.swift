import Foundation

enum Speaker: String, Codable {
    case user
    case assistant
    case system
}

struct TranscriptMessage: Identifiable, Codable, Hashable {
    let id: UUID
    let speaker: Speaker
    let text: String
    let createdAt: Date

    init(id: UUID = UUID(), speaker: Speaker, text: String, createdAt: Date = Date()) {
        self.id = id
        self.speaker = speaker
        self.text = text
        self.createdAt = createdAt
    }
}
