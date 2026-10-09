import "./globals.css";
import AuraVoiceAvatar from "../components/AuraVoiceAvatar";
export const metadata={title:"NUSA Enterprise Engineering OS",description:"Enterprise, Engineering, AI and Digital Twin operating system"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}<AuraVoiceAvatar/></body></html>}
