import SwiftUI

struct ConversationView: View {
    @EnvironmentObject private var viewModel: AppViewModel

    var body: some View {
        VStack(spacing: 0) {
            header
            Divider()
            transcriptList
            controls
        }
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button("戻る") { viewModel.reset() }
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(viewModel.selectedScenario?.title ?? "")
                .font(.title3.bold())
            Text(statusText)
                .font(.subheadline)
                .foregroundStyle(statusColor)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
    }

    private var transcriptList: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 10) {
                    ForEach(viewModel.transcript) { message in
                        TranscriptBubble(message: message)
                            .id(message.id)
                    }
                }
                .padding(16)
            }
            .onChange(of: viewModel.transcript.count) {
                guard let last = viewModel.transcript.last else { return }
                withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
            }
        }
    }

    private var controls: some View {
        VStack(spacing: 12) {
            if let error = viewModel.errorMessage {
                Text(error)
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
            }

            HStack(spacing: 12) {
                Button {
                    viewModel.endAndRequestFeedback()
                } label: {
                    Label("終了して添削", systemImage: "checkmark.circle.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
            }

            Text("音声で会話します。feedback と言うと添削に進みます。")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(20)
        .background(Color(.systemBackground))
    }

    private var statusText: String {
        switch viewModel.status {
        case .idle: "待機中"
        case .connecting: "接続中..."
        case .connected: "会話中"
        case .feedback: "添削中"
        case .failed: "接続エラー"
        }
    }

    private var statusColor: Color {
        switch viewModel.status {
        case .connected: .green
        case .failed: .red
        default: .secondary
        }
    }
}

private struct TranscriptBubble: View {
    let message: TranscriptMessage

    var body: some View {
        HStack {
            if message.speaker == .assistant { bubble }
            Spacer(minLength: 36)
            if message.speaker == .user { bubble }
        }
    }

    private var bubble: some View {
        Text(message.text)
            .font(.body)
            .foregroundStyle(message.speaker == .user ? .white : .primary)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(message.speaker == .user ? Color.teal : Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .frame(maxWidth: 300, alignment: message.speaker == .user ? .trailing : .leading)
    }
}
