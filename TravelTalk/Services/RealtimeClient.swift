import Foundation

@MainActor
protocol RealtimeClientDelegate: AnyObject {
    func realtimeClientDidChangeStatus(_ status: ConversationStatus)
    func realtimeClientDidReceiveTranscript(_ message: TranscriptMessage)
    func realtimeClientDidReceiveFeedbackRequest()
    func realtimeClientDidFail(_ error: Error)
}

enum ConversationStatus: Equatable {
    case idle
    case connecting
    case connected
    case feedback
    case failed(String)
}

final class RealtimeClient {
    weak var delegate: RealtimeClientDelegate?

    private let apiClient: APIClient
    private let audioIO = AudioIO()
    private var webSocket: URLSessionWebSocketTask?
    private var receiveTask: Task<Void, Never>?
    private var assistantTranscriptBuffer = ""

    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }

    @MainActor
    func connect(scenario: TravelScenario) async {
        do {
            delegate?.realtimeClientDidChangeStatus(.connecting)
            let instructions = PromptBuilder.instructions(for: scenario)
            let clientSecret = try await apiClient.createRealtimeClientSecret(instructions: instructions)

            var request = URLRequest(url: URL(string: "wss://api.openai.com/v1/realtime?model=gpt-realtime-2")!)
            request.setValue("Bearer \(clientSecret)", forHTTPHeaderField: "Authorization")
            request.setValue("traveltalk-ios-mvp", forHTTPHeaderField: "OpenAI-Safety-Identifier")

            let task = URLSession.shared.webSocketTask(with: request)
            webSocket = task
            task.resume()
            delegate?.realtimeClientDidChangeStatus(.connected)

            receiveTask = Task { [weak self] in
                await self?.receiveLoop()
            }

            try audioIO.start { [weak self] pcm in
                Task { await self?.sendAudio(pcm) }
            }

            sendJSON([
                "type": "conversation.item.create",
                "item": [
                    "type": "message",
                    "role": "user",
                    "content": [
                        ["type": "input_text", "text": "Please start the roleplay now."]
                    ]
                ]
            ])
            sendJSON(["type": "response.create"])
        } catch {
            delegate?.realtimeClientDidFail(error)
            delegate?.realtimeClientDidChangeStatus(.failed(error.localizedDescription))
        }
    }

    func disconnect() {
        audioIO.stop()
        receiveTask?.cancel()
        webSocket?.cancel(with: .normalClosure, reason: nil)
        webSocket = nil
    }

    private func sendAudio(_ data: Data) async {
        sendJSON([
            "type": "input_audio_buffer.append",
            "audio": data.base64EncodedString()
        ])
    }

    private func sendJSON(_ object: [String: Any]) {
        guard let webSocket, let data = try? JSONSerialization.data(withJSONObject: object),
              let text = String(data: data, encoding: .utf8) else { return }
        webSocket.send(.string(text)) { error in
            if let error {
                Task { @MainActor [weak self] in self?.delegate?.realtimeClientDidFail(error) }
            }
        }
    }

    private func receiveLoop() async {
        while !Task.isCancelled {
            do {
                guard let message = try await webSocket?.receive() else { return }
                switch message {
                case .string(let text):
                    await handleEventText(text)
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        await handleEventText(text)
                    }
                @unknown default:
                    continue
                }
            } catch {
                if !Task.isCancelled {
                    await MainActor.run { [weak self] in self?.delegate?.realtimeClientDidFail(error) }
                }
                return
            }
        }
    }

    @MainActor
    private func handleEventText(_ text: String) {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else { return }

        switch type {
        case "response.output_audio.delta":
            if let delta = json["delta"] as? String, let audioData = Data(base64Encoded: delta) {
                audioIO.playPCM16(audioData)
            }
        case "response.output_audio_transcript.delta", "response.output_text.delta":
            assistantTranscriptBuffer += json["delta"] as? String ?? ""
        case "response.output_audio_transcript.done", "response.output_text.done":
            flushAssistantTranscript()
        case "conversation.item.input_audio_transcription.completed":
            let transcript = json["transcript"] as? String ?? ""
            guard !transcript.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
            delegate?.realtimeClientDidReceiveTranscript(TranscriptMessage(speaker: .user, text: transcript))
            if transcript.lowercased().contains("feedback") {
                delegate?.realtimeClientDidReceiveFeedbackRequest()
            }
        case "response.done":
            flushAssistantTranscript()
        case "error":
            let message = (json["error"] as? [String: Any])?["message"] as? String ?? "Realtime API error"
            delegate?.realtimeClientDidChangeStatus(.failed(message))
        default:
            break
        }
    }

    @MainActor
    private func flushAssistantTranscript() {
        let trimmed = assistantTranscriptBuffer.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        assistantTranscriptBuffer = ""
        delegate?.realtimeClientDidReceiveTranscript(TranscriptMessage(speaker: .assistant, text: trimmed))
    }
}
