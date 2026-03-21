import { notarize } from "@electron/notarize"
import { config } from "dotenv"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, "../.env") })

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

  // 환경 변수가 없으면 electron-builder 자체 공증에 위임하고 스킵
  if (!appleId || !appleIdPassword || !teamId) {
    return
  }

  await notarize({
    appBundleId: "com.marchbom.typop",
    appPath: `${appOutDir}/${appName}.app`,
    appleId,
    appleIdPassword,
    teamId
  })
}
