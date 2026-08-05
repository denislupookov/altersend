import ExpoModulesCore

public class TransferServiceModule: Module {
  private var assertion: BackgroundAssertion?

  public func definition() -> ModuleDefinition {
    Name("TransferService")

    Events("onStopped")

    OnDestroy {
      self.releaseAssertion()
    }

    AsyncFunction("start") { (content: TransferNotificationContent, _: String) in
      self.holdAssertion()
      self.continueInBackground(content)
    }
    .runOnQueue(.main)

    AsyncFunction("update") { (content: TransferNotificationContent) in
      self.holdAssertion()
      self.continueInBackground(content)

      if #available(iOS 26.0, *) {
        ContinuedTransferTask.shared.update(
          title: content.title,
          subtitle: content.text,
          percent: content.progress
        )
      }
    }
    .runOnQueue(.main)

    AsyncFunction("notifyCompleted") { (_: String, _: String, _: String) in
    }

    AsyncFunction("setTransferring") { (_: Bool) in
    }

    AsyncFunction("stop") {
      if #available(iOS 26.0, *) {
        ContinuedTransferTask.shared.finish()
      }
      self.releaseAssertion()
    }
    .runOnQueue(.main)
  }

  private func continueInBackground(_ content: TransferNotificationContent) {
    guard content.progress >= 0 else { return }

    if #available(iOS 26.0, *) {
      ContinuedTransferTask.shared.onExpire = { [weak self] in
        self?.sendEvent("onStopped", [:])
      }
      ContinuedTransferTask.shared.onAttach = { [weak self] in
        self?.releaseAssertion()
      }
      ContinuedTransferTask.shared.submit(title: content.title, subtitle: content.text)
    }
  }

  private func continuedTaskIsRunning() -> Bool {
    if #available(iOS 26.0, *) {
      return ContinuedTransferTask.shared.isRunning
    }
    return false
  }

  private func holdAssertion() {
    guard !continuedTaskIsRunning() else { return }

    if assertion == nil {
      assertion = BackgroundAssertion { [weak self] in
        guard let self else { return }
        self.assertion = nil
        if !self.continuedTaskIsRunning() {
          self.sendEvent("onStopped", [:])
        }
      }
    }
    assertion?.begin()
  }

  private func releaseAssertion() {
    assertion?.end()
    assertion = nil
  }
}
