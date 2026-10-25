import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/personal-utilities/')({
  component: PersonalUtilities,
})

function PersonalUtilities() {
  return (
    <>
      <h1>Personal Utilities</h1>
      <p>
        Personal Utilities is a collection of private tools I use with my own Google account. I’m
        Imo Madjid, and I own and operate this OAuth application for personal use.
      </p>
      <section>
        <h2>Google Drive file sync</h2>
        <p>
          I use GoogleDriveSync, powered by rclone, to sync selected folders from my devices to my
          Google Drive. The connection can read, create, update, and delete Drive files as needed
          for the configured sync jobs.
        </p>
      </section>
      <section>
        <h2>How the connection works</h2>
        <p>
          Google handles sign-in and asks for permission before a tool can access my account. The
          tools run on my devices and communicate with Google directly. This website provides
          information about the tools; it does not receive Google sign-in tokens or Drive files.
        </p>
        <p>These utilities are for my own use. They are not a public sign-up service.</p>
      </section>
      <section>
        <h2>Privacy and contact</h2>
        <p>
          Read the <Link to="/personal-utilities/privacy">Privacy Policy</Link> for details about
          data access, storage, and revoking permission.
        </p>
        <p>
          Questions: <a href="mailto:mhmmadjid@gmail.com">mhmmadjid@gmail.com</a>.
        </p>
      </section>
    </>
  )
}
