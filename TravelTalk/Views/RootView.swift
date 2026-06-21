import SwiftUI

struct RootView: View {
    @EnvironmentObject private var viewModel: AppViewModel

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.status == .feedback {
                    FeedbackView()
                } else if viewModel.selectedScenario != nil {
                    ConversationView()
                } else {
                    ScenarioListView()
                }
            }
        }
    }
}
