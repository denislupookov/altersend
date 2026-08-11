import AppKit
import Foundation
import UniformTypeIdentifiers

final class ShareViewController: NSViewController {
  private let lock = NSLock()
  private var paths: [String] = []

  override func loadView() {
    view = NSView(frame: .zero)
  }

  override func viewDidAppear() {
    super.viewDidAppear()
    collect()
  }

  private func collect() {
    let providers = (extensionContext?.inputItems as? [NSExtensionItem] ?? [])
      .flatMap { $0.attachments ?? [] }
      .filter { $0.hasItemConformingToTypeIdentifier(UTType.fileURL.identifier) }

    guard !providers.isEmpty else {
      finish()
      return
    }

    let group = DispatchGroup()
    for provider in providers {
      group.enter()
      provider.loadItem(forTypeIdentifier: UTType.fileURL.identifier, options: nil) { value, _ in
        defer { group.leave() }
        guard let url = Self.fileURL(from: value), url.isFileURL else { return }
        self.lock.lock()
        self.paths.append(url.path)
        self.lock.unlock()
      }
    }

    group.notify(queue: .main) { [weak self] in
      self?.handOff()
    }
  }

  private static func fileURL(from value: NSSecureCoding?) -> URL? {
    if let url = value as? URL { return url }
    if let data = value as? Data { return URL(dataRepresentation: data, relativeTo: nil) }
    if let text = value as? String { return URL(string: text) }
    return nil
  }

  private func handOff() {
    lock.lock()
    let collected = paths
    lock.unlock()

    guard !collected.isEmpty, let manifest = writeManifest(collected) else {
      finish()
      return
    }

    var components = URLComponents()
    components.scheme = "altersend"
    components.host = "share"
    components.queryItems = [URLQueryItem(name: "manifest", value: manifest)]

    guard let url = components.url else {
      finish()
      return
    }

    guard let context = extensionContext else {
      NSWorkspace.shared.open(url)
      finish()
      return
    }

    context.open(url) { opened in
      if !opened { NSWorkspace.shared.open(url) }
      DispatchQueue.main.async { self.finish() }
    }
  }

  private func writeManifest(_ collected: [String]) -> String? {
    let dir = FileManager.default.temporaryDirectory
    let target = dir.appendingPathComponent("share-\(UUID().uuidString).json")
    do {
      let data = try JSONSerialization.data(withJSONObject: collected, options: [])
      try data.write(to: target, options: .atomic)
      return target.path
    } catch {
      NSLog("AlterSend share extension: failed to write manifest — \(error)")
      return nil
    }
  }

  private func finish() {
    extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
  }
}
