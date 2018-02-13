import * as fs from 'fs-extra'
import * as path from 'path'
import * as execa from 'execa'

interface IVersion {
    breaking: number
    feature: number
    patch: number
    original: string
}

const packageJsonPath = path.join(__dirname, '..', 'package.json')
const packageLockJsonPath = path.join(__dirname, '..', 'package-lock.json')

async function main() {
    console.log(`Get last release:`)
    const gitTagsOutput = await execa.stdout('git', ['tag', '-l', '--sort=v:refname'])
    const tagVersions = gitTagsOutput.split('\n')
        .filter(t => /v(\d+).(\d+).(\d+)/.test(t))
        .reduce((versions: IVersion[], t) => {
            const match = t.match(/v(\d+).(\d+).(\d+)/)
            if (match === null) {
                return versions
            }

            const [breaking, feature, patch] = match.slice(1, 4).map(x => parseInt(x))
            return [...versions, {
                breaking,
                feature,
                patch,
                original: t
            }]
        }, [])

    // TODO: Actually sort by max breaking, feature, patch since it's not clear that git will sort correctly be default
    const highestTag = tagVersions[tagVersions.length - 1]
    const { breaking, feature, patch } = highestTag
    const nextVersion = `${breaking}.${feature + 1}.${patch}`
    console.log(`Last Release: `, highestTag.original)
    console.log(`Next Version: `, nextVersion)

    console.log(`Reading package.json from: ${packageJsonPath}`)
    try {
        const packageJsonObj = await fs.readJson(packageJsonPath)
        const packageLockJsonObj = await fs.readJson(packageLockJsonPath)
        const { version } = packageJsonObj
        console.log(`Found version: ${version}`)

        const newPackageJson = {
            ...packageJsonObj,
            version: nextVersion
        }

        const newPackageLockJson = {
            ...packageLockJsonObj,
            version: nextVersion
        }

        console.log(`Writing version: ${nextVersion} to ${packageJsonPath}`)
        await fs.writeJson(packageJsonPath, newPackageJson, { spaces: '  ' })

        console.log(`Writing version: ${nextVersion} to ${packageLockJsonPath}`)
        await fs.writeJson(packageLockJsonPath, newPackageLockJson, { spaces: '  ' })
    }
    catch (e) {
        const error = e as Error
        console.error(error.message)
        process.exit(1)
    }

    console.log(`Create tag on current commit using the next version: ${nextVersion}`)
    try {
        await execa('git', ['tag', '-a', '-m', `${nextVersion}`, `v${nextVersion}`])
    }
    catch (e) {
        const error = e as Error
        console.error(`Error when attempting to create tag: ${nextVersion}`, error.message)
        process.exit(1)
    }
}

main()