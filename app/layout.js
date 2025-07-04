import './globals.css'

export const metadata = {
  title: 'Workflow Builder',
  description: 'Simple workflow automation builder',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
