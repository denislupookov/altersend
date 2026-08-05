import BackgroundTasks
import Foundation

@available(iOS 26.0, *)
final class ContinuedTransferTask {
  static let shared = ContinuedTransferTask()
  static let identifier = "com.altersend.mobile.transfer"

  private var task: BGContinuedProcessingTask?
  private var submitted = false
  var onExpire: (() -> Void)?
  var onAttach: (() -> Void)?

  var isRunning: Bool {
    task != nil
  }

  private init() {}

  func register() {
    BGTaskScheduler.shared.register(forTaskWithIdentifier: Self.identifier, using: .main) { [weak self] task in
      guard let continued = task as? BGContinuedProcessingTask else {
        task.setTaskCompleted(success: false)
        return
      }
      self?.attach(continued)
    }
  }

  func submit(title: String, subtitle: String) {
    guard !submitted else { return }
    submitted = true

    let request = BGContinuedProcessingTaskRequest(
      identifier: Self.identifier,
      title: title,
      subtitle: subtitle
    )
    request.strategy = .queue

    do {
      try BGTaskScheduler.shared.submit(request)
    } catch {
      submitted = false
      NSLog("TransferService: continued task submit failed: \(error.localizedDescription)")
    }
  }

  func update(title: String, subtitle: String, percent: Int) {
    guard let task else { return }

    task.updateTitle(title, subtitle: subtitle)

    if percent < 0 {
      task.progress.totalUnitCount = 0
      task.progress.completedUnitCount = 0
      return
    }

    task.progress.totalUnitCount = 100
    task.progress.completedUnitCount = Int64(min(100, percent))
  }

  func finish() {
    if let task {
      let progress = task.progress
      let complete = progress.totalUnitCount > 0
        && progress.completedUnitCount >= progress.totalUnitCount
      task.setTaskCompleted(success: complete)
    } else if submitted {
      BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: Self.identifier)
    }

    task = nil
    submitted = false
  }

  private func attach(_ continued: BGContinuedProcessingTask) {
    task = continued
    continued.progress.totalUnitCount = 100
    onAttach?()

    continued.expirationHandler = { [weak self] in
      continued.setTaskCompleted(success: false)
      self?.task = nil
      self?.submitted = false
      self?.onExpire?()
    }
  }
}
