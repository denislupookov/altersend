require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'TransferService'
  s.version        = package['version']
  s.summary        = 'Keeps AlterSend transfers running while the app is backgrounded'
  s.description    = s.summary
  s.license        = 'Apache-2.0'
  s.author         = 'AlterSend'
  s.homepage       = 'https://altersend.com'
  s.platforms      = {
    :ios => '15.1'
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/denislupookov/altersend.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
end
