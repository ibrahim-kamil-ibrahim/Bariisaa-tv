import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  private let channelName = "com.naik.naik_mobile/security"

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
    configureSecurityChannel(engineBridge.flutterEngine!)
  }

  private func configureSecurityChannel(_ engine: FlutterEngine) {
    let channel = FlutterMethodChannel(name: channelName, binaryMessenger: engine.binaryMessenger)
    channel.setMethodCallHandler { [weak self] call, result in
      switch call.method {
      case "isDeviceCompromised":
        result(self?.isDeviceJailbroken() ?? false)
      default:
        result(FlutterMethodNotImplemented)
      }
    }
  }

  private func isDeviceJailbroken() -> Bool {
    #if targetEnvironment(simulator)
    return false
    #else
    let jailbreakPaths = [
      "/Applications/Cydia.app",
      "/usr/sbin/sshd",
      "/etc/apt",
      "/private/var/lib/apt/",
      "/usr/bin/ssh",
      "/usr/libexec/sftp-server"
    ]
    if jailbreakPaths.contains(where: { FileManager.default.fileExists(atPath: $0) }) {
      return true
    }

    let testWritePath = "/" + UUID().uuidString
    do {
      "test".write(toFile: testWritePath, atomically: true, encoding: .utf8)
      try? FileManager.default.removeItem(atPath: testWritePath)
      return true
    } catch {
      return false
    }
    #endif
  }
}
