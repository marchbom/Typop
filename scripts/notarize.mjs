import { notarize } from "@electron/notarize"

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context

  if (electronPlatformName !== "darwin") {
    return
  }

  const appName = context.packager.appInfo.productFilename

  const appleId = process.env.APPLE_ID
  const appleIdPassword = process.env.APPLE_APP_PASSWORD
  const teamId = process.env.APPLE_TEAM_ID

  if (!appleId || !appleIdPassword || !teamId) {
    throw new Error("Missing APPLE_ID, APPLE_APP_PASSWORD, or APPLE_TEAM_ID environment variables.")
  }

  await notarize({
    appBundleId: "com.marchbom.typop",
    appPath: `${appOutDir}/${appName}.app`,
    appleId,
    appleIdPassword,
    teamId
  })
}
