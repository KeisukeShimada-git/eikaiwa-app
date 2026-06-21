import SwiftUI

struct ScenarioListView: View {
    @EnvironmentObject private var viewModel: AppViewModel
    @State private var selectedCategory: ScenarioCategory? = nil

    private var filteredScenarios: [TravelScenario] {
        guard let selectedCategory else { return viewModel.scenarios }
        return viewModel.scenarios.filter { $0.category == selectedCategory }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 6) {
                Text("TravelTalk")
                    .font(.largeTitle.bold())
                Text("旅先スタッフと英語でリアルタイム練習")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Picker("Category", selection: $selectedCategory) {
                Text("すべて").tag(ScenarioCategory?.none)
                ForEach(ScenarioCategory.allCases, id: \.self) { category in
                    Text(category.rawValue).tag(Optional(category))
                }
            }
            .pickerStyle(.segmented)

            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(filteredScenarios) { scenario in
                        Button {
                            viewModel.start(scenario)
                        } label: {
                            ScenarioCard(scenario: scenario)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.vertical, 4)
            }
        }
        .padding(20)
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct ScenarioCard: View {
    let scenario: TravelScenario

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(scenario.category.rawValue)
                    .font(.caption.weight(.semibold))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color.teal.opacity(0.14), in: Capsule())
                Spacer()
                Text(scenario.levelRange)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Text(scenario.title)
                .font(.headline)
                .foregroundStyle(.primary)
            Text(scenario.location)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text(scenario.troubleSeeds.first ?? "")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
