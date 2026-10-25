import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/personal-utilities/privacy')({
  head: () => ({
    meta: [
      { title: 'Personal Utilities Privacy Policy · Imo Madjid' },
      {
        name: 'description',
        content: 'How Personal Utilities accesses, uses, and stores Google account data.',
      },
    ],
  }),
  component: UtilitiesPrivacy,
})

function UtilitiesPrivacy() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-sm">Personal Utilities · Updated 25 October 2026</p>
      <p>
        Personal Utilities is an OAuth application owned and operated by Imo Madjid for private
        tools that work with my own Google account. This policy describes the current Google Drive
        file-sync connection.
      </p>
      <section>
        <h2>Data access and use</h2>
        <p>
          GoogleDriveSync and rclone access Google Drive file contents and metadata, such as file
          names, sizes, and modification times, to compare and sync configured folders. The Google
          Drive permission allows reading, creating, updating, and deleting files in my account.
          Sync jobs are configured for specific folders.
        </p>
        <p>
          Account data is used for file sync. It is not used for advertising, sold, or used to train
          AI models.
        </p>
      </section>
      <section>
        <h2>Storage and sharing</h2>
        <p>
          Files move between my devices and Google Drive. Sign-in tokens and client credentials are
          stored in local application configuration or operating-system credential storage.
          Diagnostic logs may contain file paths and transfer details.
        </p>
        <p>
          This portfolio website does not receive these tokens, credentials, or Drive files. The
          tools do not intentionally share account data with unrelated third parties. Google
          processes data as the service provider for Google Drive.
        </p>
      </section>
      <section>
        <h2>Retention and control</h2>
        <p>
          Synced files remain on my devices or in Google Drive until I delete them or a configured
          sync job removes them. Local credentials remain until removed or revoked. Diagnostic logs
          remain until deleted.
        </p>
        <p>
          Access can be revoked at any time through{' '}
          <a href="https://myaccount.google.com/connections">Google Account connections</a>.
          Revoking access stops future authorized requests; it does not delete existing file copies.
        </p>
      </section>
      <section>
        <h2>This website</h2>
        <p>
          These information pages do not ask visitors to sign in or upload files. Cloudflare hosts
          the site and may process ordinary request information, such as IP addresses, to serve and
          protect it. The portfolio may store a theme preference in the visitor’s browser.
        </p>
      </section>
      <section>
        <h2>Changes and contact</h2>
        <p>
          I will update this policy when the tools’ use of Google account data changes. Contact me
          at <a href="mailto:mhmmadjid@gmail.com">mhmmadjid@gmail.com</a> with questions.
        </p>
        <p>
          <Link to="/personal-utilities">About Personal Utilities</Link>
        </p>
      </section>
    </>
  )
}
