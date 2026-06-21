import Foundation

@MainActor
final class AppViewModel: ObservableObject {
    @Published var scenarios = TravelScenario.samples
    @Published var selectedScenario: TravelScenario?
    @Published var transcript: [TranscriptMessage] = []
    @Published var status: ConversationStatus = .idle
    @Published var feedbackReport: FeedbackReport?
    @Published var isLoadingFeedback = false
    @Published var errorMessage: String?

    private let realtimeClient: RealtimeClient
    private let apiClient: APIClient

    init(realtimeClient: RealtimeClient = RealtimeClient(), apiClient: APIClient = .shared) {
        self.realtimeClient = realtimeClient
        self.apiClient = apiClient
        self.realtimeClient.delegate = self
    }

    func start(_ scenario: TravelScenario) {
        selectedScenario = scenario
        transcript = []
        feedbackReport = nil
        errorMessage = nil
        Task { await realtimeClient.connect(scenario: scenario) }
    }

    func endAndRequestFeedback() {
        realtimeClient.disconnect()
        status = .feedback
        Task { await loadFeedback() }
    }

    func reset() {
        realtimeClient.disconnect()
        selectedScenario = nil
        transcript = []
        feedbackReport = nil
        errorMessage = nil
        status = .idle
    }

    private func loadFeedback() async {
        guard let scenario = selectedScenario else { return }
        isLoadingFeedback = true
        defer { isLoadingFeedback = false }

        do {
            feedbackReport = try await apiClient.feedback(for: scenario, transcript: transcript)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

extension AppViewModel: RealtimeClientDelegate {
    func realtimeClientDidChangeStatus(_ status: ConversationStatus) {
        self.status = status
    }

    func realtimeClientDidReceiveTranscript(_ message: TranscriptMessage) {
        transcript.append(message)
    }

    func realtimeClientDidReceiveFeedbackRequest() {
        endAndRequestFeedback()
    }

    func realtimeClientDidFail(_ error: Error) {
        errorMessage = error.localizedDescription
    }
}
