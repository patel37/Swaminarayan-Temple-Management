// import {
//   Container,
//   Heading,
//   Tab,
//   TabList,
//   TabPanel,
//   TabPanels,
//   Tabs,
// } from "@chakra-ui/react"
// import { useQueryClient } from "@tanstack/react-query"
// import { createFileRoute } from "@tanstack/react-router"

// import type { UserOut } from "../../client"
// import Appearance from "../../components/UserSettings/Appearance"
// import ChangePassword from "../../components/UserSettings/ChangePassword"
// import DeleteAccount from "../../components/UserSettings/DeleteAccount"
// import UserInformation from "../../components/UserSettings/UserInformation"
// import PDFViewSettings from "../../components/UserSettings/pdfview"
// import WhatsappLogin from "../../components/UserSettings/WhatsAppsLogin" 

// const tabsConfig = [
//   { title: "My profile", component: UserInformation },
//   { title: "PDF View Settings", component: PDFViewSettings },
//   { title: "Password", component: ChangePassword },
//   { title: "Appearance", component: Appearance },
//   { title: "Danger zone", component: DeleteAccount },
//   { title: "WhatsappLogin", component: WhatsAppsLogin },
// { title: "WhatsappLogin", component: WhatsappLogin },
// ]

// export const Route = createFileRoute("/_layout/settings")({
//   component: UserSettings,
// })

// function UserSettings() {
//   const queryClient = useQueryClient()
//   const currentUser = queryClient.getQueryData<UserOut>(["currentUser"])
//   const finalTabs = currentUser?.is_superuser
//     ? tabsConfig.slice(0, 3)
//     : tabsConfig

//   return (
//     <Container maxW="full">
//       <Heading size="lg" textAlign={{ base: "center", md: "left" }} py={12}>
//         User Settings
//       </Heading>
//       <Tabs variant="enclosed">
//         <TabList>
//           {finalTabs.map((tab, index) => (
//             <Tab key={index}>{tab.title}</Tab>
//           ))}
//         </TabList>
//         <TabPanels>
//           {finalTabs.map((tab, index) => (
//             <TabPanel key={index}>
//               <tab.component />
//             </TabPanel>
//           ))}
//         </TabPanels>
//       </Tabs>
//     </Container>
//   )
// }

import {
  Container,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import type { UserOut } from "../../client"
import Appearance from "../../components/UserSettings/Appearance"
import ChangePassword from "../../components/UserSettings/ChangePassword"
import DeleteAccount from "../../components/UserSettings/DeleteAccount"
import UserInformation from "../../components/UserSettings/UserInformation"
import PDFViewSettings from "../../components/UserSettings/pdfview"
import WhatsappLogin from "../../components/UserSettings/WhatsAppsLogin" 

const tabsConfig = [
  // { title: "My profile", component: UserInformation },
  { title: "PDF View Settings", component: PDFViewSettings },
  { title: "Password", component: ChangePassword },
  { title: "Appearance", component: Appearance },
  // { title: "Danger zone", component: DeleteAccount },
  // { title: "WhatsappLogin", component: WhatsappLogin }, // Fixed name in config
]

export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
})

function UserSettings() {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserOut>(["currentUser"])
  const finalTabs = currentUser?.is_superuser
    ? tabsConfig.slice(0, 3)
    : tabsConfig

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} py={12}>
        User Settings
      </Heading>
      <Tabs variant="enclosed">
        <TabList>
          {finalTabs.map((tab, index) => (
            <Tab key={index}>{tab.title}</Tab>
          ))}
        </TabList>
        <TabPanels>
          {finalTabs.map((tab, index) => (
            <TabPanel key={index}>
              <tab.component />
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Container>
  )
}
