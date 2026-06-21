import AVFoundation
import Foundation

final class AudioIO {
    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private let outputFormat = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: 24_000, channels: 1, interleaved: false)!
    private var inputConverter: AVAudioConverter?
    private var onAudioChunk: ((Data) -> Void)?
    private var isPlayerAttached = false

    func start(onAudioChunk: @escaping (Data) -> Void) throws {
        self.onAudioChunk = onAudioChunk

        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.defaultToSpeaker, .allowBluetooth])
        try session.setPreferredSampleRate(24_000)
        try session.setActive(true)

        if !isPlayerAttached {
            engine.attach(player)
            isPlayerAttached = true
        }
        engine.connect(player, to: engine.mainMixerNode, format: outputFormat)

        let input = engine.inputNode
        let inputFormat = input.inputFormat(forBus: 0)
        inputConverter = AVAudioConverter(from: inputFormat, to: outputFormat)

        input.removeTap(onBus: 0)
        input.installTap(onBus: 0, bufferSize: 1024, format: inputFormat) { [weak self] buffer, _ in
            self?.handleInput(buffer)
        }

        engine.prepare()
        try engine.start()
        player.play()
    }

    func stop() {
        engine.inputNode.removeTap(onBus: 0)
        player.stop()
        engine.stop()
        try? AVAudioSession.sharedInstance().setActive(false)
    }

    func playPCM16(_ data: Data) {
        guard !data.isEmpty else { return }
        let frameCount = AVAudioFrameCount(data.count / MemoryLayout<Int16>.size)
        guard let buffer = AVAudioPCMBuffer(pcmFormat: outputFormat, frameCapacity: frameCount) else { return }
        buffer.frameLength = frameCount
        data.withUnsafeBytes { raw in
            if let source = raw.baseAddress, let destination = buffer.int16ChannelData?[0] {
                memcpy(destination, source, data.count)
            }
        }
        player.scheduleBuffer(buffer, completionHandler: nil)
        if !player.isPlaying {
            player.play()
        }
    }

    private func handleInput(_ buffer: AVAudioPCMBuffer) {
        guard let converter = inputConverter else { return }
        let ratio = outputFormat.sampleRate / buffer.format.sampleRate
        let capacity = AVAudioFrameCount(Double(buffer.frameLength) * ratio) + 1
        guard let converted = AVAudioPCMBuffer(pcmFormat: outputFormat, frameCapacity: capacity) else { return }

        var error: NSError?
        var didProvideBuffer = false
        let status = converter.convert(to: converted, error: &error) { _, outStatus in
            if didProvideBuffer {
                outStatus.pointee = .noDataNow
                return nil
            }
            didProvideBuffer = true
            outStatus.pointee = .haveData
            return buffer
        }

        guard status != .error, converted.frameLength > 0, let channel = converted.int16ChannelData?[0] else { return }
        let byteCount = Int(converted.frameLength) * MemoryLayout<Int16>.size
        onAudioChunk?(Data(bytes: channel, count: byteCount))
    }
}
