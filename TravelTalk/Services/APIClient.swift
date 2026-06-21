import Foundation

struct ClientSecretResponse: Decodable {
    let value: String
}

final class APIClient {
    static let shared = APIClient()

    private let baseURL = URL(string: "http://localhost:8787")!
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    private init() {
        decoder.dateDecodingStrategy = .iso8601
        encoder.dateEncodingStrategy = .iso8601
    }

    func createRealtimeClientSecret(instructions: String) async throws -> String {
        var request = URLRequest(url: baseURL.appendingPathComponent("realtime/client-secret"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "instructions": instructions,
            "voice": "marin"
        ])

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)
        return try decoder.decode(ClientSecretResponse.self, from: data).value
    }

    func feedback(for scenario: TravelScenario, transcript: [TranscriptMessage]) async throws -> FeedbackReport {
        var request = URLRequest(url: baseURL.appendingPathComponent("feedback"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(FeedbackRequest(scenarioTitle: scenario.title, transcript: transcript))

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)
        return try decoder.decode(FeedbackReport.self, from: data)
    }

    private func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse, 200..<300 ~= http.statusCode else {
            let message = String(data: data, encoding: .utf8) ?? "Unknown API error"
            throw APIError.server(message)
        }
    }
}

private struct FeedbackRequest: Encodable {
    let scenarioTitle: String
    let transcript: [TranscriptMessage]
}

enum APIError: LocalizedError {
    case server(String)

    var errorDescription: String? {
        switch self {
        case .server(let message): message
        }
    }
}
