const core = require('./.action/core')
const exec = require('./.action/exec')
const path = require('path')
const artifact = require('././.action/artifact')
const fs = require('fs')

const scxVersion = 'v2.3.0'

core.setCommandEcho(true)

async function run() {
    try {
        let packagePath = core.getInput('path', { required: false })
        let targetPackage = core.getInput('targetPackage', { required: false })
        let frameworks = core.getInput('frameworks', { required: false })
        let targets = core.getInput('target', { required: false })
        let configuration = core.getInput('configuration', { required: false })
        let platforms = core.getInput('platforms', { required: false })
        let xcconfig = core.getInput('xcconfig', { required: false })
        let resultName = core.getInput('resultName', { required: false })

        await installUsingBrewIfRequired("mint")

        // install ourselves if not installed
        await installUsingMintIfRequired('swift-create-xcframework', 'asltddev1/swift-create-xcframework')

        // put together our options
        var options = ['--github-action']

        if (!!configuration) {
            options.push('--configuration')
            options.push(configuration)
        }

        if (!!xcconfig) {
            options.push('--xcconfig')
            options.push(xcconfig)
        }

        if (!!platforms) {
            platforms
                .split(',')
                .map((p) => p.trim())
                .forEach((platform) => {
                    options.push('--platform')
                    options.push(platform)
                })
        }

        if (!targets) {
            targets
                .split(',')
                .map((t) => t.trim())
                .filter((t) => t.length > 0)
                .forEach((target) => {
                    options.push(target)
                })
        }

        if (!!packagePath) {
            await Promise.all(packagePath
                .split(',')
                .map((t) => t.trim())
                .filter((t) => t.length > 0)
                .map(async (path) => {
                    await runUsingMint('swift-create-xcframework', [...options, "--package-path", path])
                }))
        }

        if (!!frameworks) {
            await exec.exec('pwd')
            await exec.exec('ls')
            await Promise.all(frameworks
                .split(',')
                .map((t) => t.trim())
                .filter((t) => t.length > 0)
                .map(async (framework) => {
                    await exec.exec('mkdir', ['-p', `${targetPackage}/Sources/${framework}`])
                    await exec.exec('cp', ['-R', `${framework}/`, `${targetPackage}/Sources/${framework}`])
                }))
        }
        await exec.exec('zip', ['-vr', resultName, `${targetPackage}`])
    } catch (error) {
        core.setFailed(error)
    }
}

async function installUsingBrewIfRequired(package) {
    if (await isInstalled(package)) {
        core.info(package + " is already installed.")

    } else {
        core.info("Installing " + package)
        await exec.exec('brew', ['install', package])
    }
}

async function installUsingBrewIfRequired(package) {
    if (await isInstalled(package)) {
        core.info(package + " is already installed.")

    } else {
        core.info("Installing " + package)
        await exec.exec('brew', ['install', package])
    }
}

async function installUsingMintIfRequired(command, package) {
    if (await isInstalled(command)) {
        core.info(command + " is already installed")

    } else {
        core.info("Installing " + package)
        await exec.exec('mint', ['install', 'unsignedapps/swift-create-xcframework@' + scxVersion])
    }
}

async function runUsingMint(command, options) {
    await exec.exec('mint', ['run', command, ...options])
}

async function isInstalled(command) {
    return await exec.exec('which', [command], { silent: true, failOnStdErr: false, ignoreReturnCode: true }) == 0
}

run()


// Kuroneko:swift-create-xcframework bok$ swift create-xcframework --help
// OVERVIEW: Creates an XCFramework out of a Swift Package using xcodebuild

// Note that Swift Binary Frameworks (XCFramework) support is only available in Swift 5.1
// or newer, and so it is only supported by recent versions of Xcode and the *OS SDKs. Likewise,
// only Apple pplatforms are supported.

// Supported platforms: ios, macos, tvos, watchos

// USAGE: command [--package-path <directory>] [--build-path <directory>] [--configuration <debug|release>] [--clean] [--no-clean] [--list-products] [--platform <ios|macos|tvos|watchos> ...] [--output <directory>] [--zip] [--zip-version <version>] [<products> ...]

// ARGUMENTS:
//   <products>              An optional list of products (or targets) to build. Defaults to building all `.library` products

// OPTIONS:
//   --package-path <directory>
//                           The location of the Package (default: .)
//   --build-path <directory>
//                           The location of the build/cache directory to use (default: .build)
//   --configuration <debug|release>
//                           Build with a specific configuration (default: release)
//   --clean/--no-clean      Whether to clean before we build (default: true)
//   --list-products         Prints the available products and targets
//   --platform <ios|macos|tvos|watchos>
//                           A list of platforms you want to build for. Can be specified multiple times. Default is to build for all platforms supported in your
//                           Package.swift, or all Apple platforms if omitted
//   --output <directory>    Where to place the compiled .xcframework(s) (default: .)
//   --zip                   Whether to wrap the .xcframework(s) up in a versioned zip file ready for deployment
//   --zip-version <version> The version number to append to the name of the zip file

//                           If the target you are packaging is a dependency, swift-create-xcframework will look into the package graph and locate the version
//                           number the dependency resolved to. As there is no standard way to specify the version inside your Swift Package, --zip-version lets
//                           you specify it manually.
//   --version               Show the version.
//   -h, --help              Show help information.
