import SwiftUI

struct FeedbackView: View {
    @EnvironmentObject private var viewModel: AppViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                header

                if viewModel.isLoadingFeedback {
                    ProgressView("添削を作成中...")
                        .frame(maxWidth: .infinity, minHeight: 160)
                } else if let report = viewModel.feedbackReport {
                    score(report)
                    FeedbackSection(title: "文法", items: report.grammar)
                    FeedbackSection(title: "より自然な表現", items: report.naturalExpressions)
                    FeedbackSection(title: "語彙", items: report.vocabulary)
                    FeedbackSection(title: "総合評価", items: [report.summary])
                }

                if let error = viewModel.errorMessage {
                    Text(error)
                        .foregroundStyle(.red)
                        .font(.footnote)
                }

                Button {
                    viewModel.reset()
                } label: {
                    Label("シナリオ選択へ", systemImage: "arrow.counterclockwise")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
            }
            .padding(20)
        }
        .navigationBarBackButtonHidden(true)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Feedback")
                .font(.largeTitle.bold())
            Text(viewModel.selectedScenario?.title ?? "")
                .foregroundStyle(.secondary)
        }
    }

    private func score(_ report: FeedbackReport) -> some View {
        HStack(alignment: .lastTextBaseline, spacing: 6) {
            Text("\(report.overallScore)")
                .font(.system(size: 52, weight: .bold, design: .rounded))
            Text("/ 100")
                .font(.title3)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

private struct FeedbackSection: View {
    let title: String
    let items: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.headline)
            ForEach(items.isEmpty ? ["今回の会話では大きな指摘はありません。"] : items, id: \.self) { item in
                Text(item)
                    .font(.body)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
    }
}
