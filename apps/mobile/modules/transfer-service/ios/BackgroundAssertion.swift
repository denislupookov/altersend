import UIKit

final class BackgroundAssertion {
  private var taskId: UIBackgroundTaskIdentifier = .invalid
  private let onExpire: () -> Void

  init(onExpire: @escaping () -> Void) {
    self.onExpire = onExpire
  }

  var isHeld: Bool {
    taskId != .invalid
  }

  func begin() {
    guard taskId == .invalid else { return }

    taskId = UIApplication.shared.beginBackgroundTask(withName: "AlterSend.transfer") { [weak self] in
      self?.expire()
    }
  }

  func end() {
    guard taskId != .invalid else { return }

    let finished = taskId
    taskId = .invalid
    UIApplication.shared.endBackgroundTask(finished)
  }

  private func expire() {
    guard taskId != .invalid else { return }

    end()
    onExpire()
  }
}
