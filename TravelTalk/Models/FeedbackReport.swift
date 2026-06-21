import Foundation

struct FeedbackReport: Codable, Equatable {
    let grammar: [String]
    let naturalExpressions: [String]
    let vocabulary: [String]
    let overallScore: Int
    let summary: String

    static let empty = FeedbackReport(
        grammar: [],
        naturalExpressions: [],
        vocabulary: [],
        overallScore: 0,
        summary: ""
    )
}
